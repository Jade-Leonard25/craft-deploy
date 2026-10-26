import { Hono } from "hono";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import db from "../db";
import { deployments } from "../schema/schema";
import { eq, desc, and } from "drizzle-orm";
import { DEPLOYMENTS_DIR } from "../paths";

// ---------- Validation schemas ----------
const safeName = /^[\w./-]+$/;

const createDeploymentSchema = z.object({
  projectName: z.string().min(1).max(60),
  sourceType: z.enum(["zip", "github"]).default("github"),
  repoUrl: z
    .string()
    .url()
    .startsWith("https://", "Repository URL must start with https://"),
  branch: z
    .string()
    .min(1)
    .max(100)
    .regex(safeName, "Invalid branch name")
    .refine((b) => !b.startsWith("-"), "Invalid branch name")
    .default("main"),
  installCommand: z.string().min(1).max(500).default("npm install"),
  buildCommand: z.string().min(1).max(500).default("npm run build"),
  outputDir: z
    .string()
    .min(1)
    .max(100)
    .regex(safeName, "Invalid output folder")
    .refine(
      (p) => !p.startsWith("/") && !p.includes(".."),
      "Must be a relative path inside the project"
    )
    .default("dist"),
});

const settingsSchema = createDeploymentSchema.pick({
  repoUrl: true,
  branch: true,
  installCommand: true,
  buildCommand: true,
  outputDir: true,
});

const deploymentControllers = new Hono<{
  Variables: { jwtPayload: { sub: string } };
}>();
const jwtSecret = process.env.JWT_KEY || process.env.HEADER_BEARER;

// ---------- Auth middleware ----------
deploymentControllers.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
  }
  if (!jwtSecret) {
    throw new HTTPException(500, { message: "Server auth misconfigured" });
  }
  try {
    const token = authHeader.slice(7);
    const payload = await verify(token, jwtSecret, "HS256");
    c.set("jwtPayload", payload as { sub: string });
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
  await next();
});

// ---------- Create deployment (the worker picks up status "pending") ----------
deploymentControllers.post(
  "/",
  zValidator("json", createDeploymentSchema),
  async (c) => {
    try {
      const payload = c.get("jwtPayload");
      const {
        projectName,
        sourceType,
        repoUrl,
        branch,
        installCommand,
        buildCommand,
        outputDir,
      } = c.req.valid("json");

      const [newDeployment] = await db
        .insert(deployments)
        .values({
          userId: payload.sub,
          projectName,
          sourceType,
          status: "pending",
          repoUrl,
          branch,
          installCommand,
          buildCommand,
          outputDir,
        })
        .returning();

      return c.json(
        { success: true, message: "Deployment queued", data: newDeployment },
        201
      );
    } catch (error: any) {
      return c.json(
        { success: false, message: "Failed to create deployment", error: error.message },
        500
      );
    }
  }
);

// ---------- List deployments ----------
deploymentControllers.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const rows = await db
    .select()
    .from(deployments)
    .where(eq(deployments.userId, payload.sub))
    .orderBy(desc(deployments.createdAt));
  return c.json({ success: true, data: rows });
});

// ---------- Live logs (SSE) ----------
deploymentControllers.get("/:id/logs", (c) => {
  const { sub } = c.get("jwtPayload");
  const id = c.req.param("id");

  return streamSSE(c, async (stream) => {
    let offset = 0;
    let lastStatus = "";

    while (!stream.aborted) {
      const [d] = await db
        .select({ logs: deployments.logs, status: deployments.status })
        .from(deployments)
        .where(and(eq(deployments.id, id), eq(deployments.userId, sub)))
        .limit(1);

      if (!d) {
        await stream.writeSSE({ event: "error", data: "Deployment not found" });
        return;
      }

      if (d.logs.length > offset) {
        await stream.writeSSE({ event: "log", data: JSON.stringify(d.logs.slice(offset)) });
        offset = d.logs.length;
      }
      if (d.status !== lastStatus) {
        lastStatus = d.status;
        await stream.writeSSE({ event: "status", data: d.status });
      }
      if (d.status === "active" || d.status === "failed") {
        await stream.writeSSE({ event: "done", data: d.status });
        return;
      }
      await stream.sleep(700);
    }
  });
});

// ---------- Download logs as CSV ----------
deploymentControllers.get("/:id/logs/download", async (c) => {
  const { sub } = c.get("jwtPayload");
  const id = c.req.param("id");

  const [d] = await db
    .select({ id: deployments.id })
    .from(deployments)
    .where(and(eq(deployments.id, id), eq(deployments.userId, sub)))
    .limit(1);
  if (!d) return c.json({ success: false, message: "Deployment not found" }, 404);

  try {
    const file = await fs.readFile(path.join(DEPLOYMENTS_DIR, "_logs", `${d.id}.csv`));
    return new Response(file, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="deployment-${d.id}.csv"`,
      },
    });
  } catch {
    return c.json({ success: false, message: "No CSV for this deployment yet" }, 404);
  }
});

// ---------- Save new settings and redeploy ----------
deploymentControllers.post(
  "/:id/redeploy",
  zValidator("json", settingsSchema),
  async (c) => {
    const { sub } = c.get("jwtPayload");
    const id = c.req.param("id");
    const settings = c.req.valid("json");

    const [current] = await db
      .select({ status: deployments.status })
      .from(deployments)
      .where(and(eq(deployments.id, id), eq(deployments.userId, sub)))
      .limit(1);

    if (!current) return c.json({ success: false, message: "Deployment not found" }, 404);
    if (current.status === "pending" || current.status === "building") {
      return c.json({ success: false, message: "A build is already running" }, 409);
    }

    // Resetting to "pending" is what queues the build; the worker claims it.
    const [updated] = await db
      .update(deployments)
      .set({ ...settings, status: "pending", logs: "", updatedAt: new Date() })
      .where(and(eq(deployments.id, id), eq(deployments.userId, sub)))
      .returning();

    return c.json({ success: true, data: updated });
  }
);

// ---------- Get one deployment ----------
deploymentControllers.get("/:id", async (c) => {
  const payload = c.get("jwtPayload");
  const deploymentId = c.req.param("id");

  const [deployment] = await db
    .select()
    .from(deployments)
    .where(and(eq(deployments.id, deploymentId), eq(deployments.userId, payload.sub)));

  if (!deployment) {
    return c.json({ success: false, message: "Deployment not found" }, 404);
  }
  return c.json({ success: true, data: deployment });
});


// ---------- Delete a deployment (any status except building) ----------
deploymentControllers.delete("/:id", async (c) => {
  const { sub } = c.get("jwtPayload");
  const id = c.req.param("id");

  const [d] = await db
    .select({ id: deployments.id, status: deployments.status })
    .from(deployments)
    .where(and(eq(deployments.id, id), eq(deployments.userId, sub)))
    .limit(1);

  if (!d) return c.json({ success: false, message: "Deployment not found" }, 404);
  if (d.status === "building") {
    return c.json({ success: false, message: "A build is running. Wait for it to finish." }, 409);
  }

  await db
    .delete(deployments)
    .where(and(eq(deployments.id, d.id), eq(deployments.userId, sub)));

  await fs.rm(path.join(DEPLOYMENTS_DIR, d.id), { recursive: true, force: true });
  await fs.rm(path.join(DEPLOYMENTS_DIR, "_logs", `${d.id}.csv`), { force: true });

  return c.json({ success: true });
});

export default deploymentControllers;
