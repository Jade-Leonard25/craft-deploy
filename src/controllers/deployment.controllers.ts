import { Hono } from "hono";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { streamSSE } from "hono/streaming"; // 👈 Added for live logs
import db from "../db";
import { deployments } from "../schema/schema";
import { eq, desc, and } from "drizzle-orm"; // 👈 Added 'and'
import { createDeploymentSchema } from "../globals/globals.config.controllers";
import { boss, startQueue } from "../queues/build-queue";

const deploymentControllers = new Hono<{
  Variables: { jwtPayload: { sub: string } };
}>();
const jwtSecret = process.env.JWT_KEY || process.env.HEADER_BEARER;

startQueue();

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

// Create deployment
deploymentControllers.post(
  "/",
  zValidator("json", createDeploymentSchema),
  async (c) => {
    try {
      const payload = c.get("jwtPayload");
      const { projectName, sourceType } = c.req.valid("json");

      const repoUrl = "https://github.com/Jade-Leonard25/testing-deployments.git";
      const branch = "main";

      const [newDeployment] = await db
        .insert(deployments)
        .values({
          userId: payload.sub,
          projectName,
          sourceType,
          status: "pending",
        })
        .returning();

      const jobId = await boss.send("build-jobs", {
        deploymentId: newDeployment.id,
        repoUrl,
        branch,
      });

      console.log(`📦 Job ${jobId} sent to queue!`);

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

// List deployments
deploymentControllers.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const rows = await db
    .select()
    .from(deployments)
    .where(eq(deployments.userId, payload.sub))
    .orderBy(desc(deployments.createdAt));
  return c.json({ success: true, data: rows });
});

// 👇 NEW: Get a single deployment by ID
deploymentControllers.get("/:id", async (c) => {
  const payload = c.get("jwtPayload");
  const deploymentId = c.req.param("id");

  const [deployment] = await db
    .select()
    .from(deployments)
    .where(
      and(
        eq(deployments.id, deploymentId),
        eq(deployments.userId, payload.sub)
      )
    );

  if (!deployment) {
    return c.json({ success: false, message: "Deployment not found" }, 404);
  }

  return c.json({ success: true, data: deployment });
});

// 👇 NEW: Live logs SSE stream
// 👇 NEW: Live logs SSE stream
deploymentControllers.get("/:id/logs", async (c) => {
  const deploymentId = c.req.param("id");

  return streamSSE(c, async (stream) => {
    let lastSentLogs: string | null = null;
    let lastSentStatus: string | null = null;

    while (true) {
      const [deployment] = await db
        .select({ logs: deployments.logs, status: deployments.status })
        .from(deployments)
        .where(eq(deployments.id, deploymentId));

      if (!deployment) {
        await stream.writeSSE({ data: JSON.stringify({ error: "Deployment not found" }), event: "error" });
        break;
      }

      // 👇 THIS IS THE FIX: Send if logs OR status has changed
      if (deployment.logs !== lastSentLogs || deployment.status !== lastSentStatus) {
        lastSentLogs = deployment.logs || "";
        lastSentStatus = deployment.status;
        
        await stream.writeSSE({
          data: JSON.stringify({ logs: lastSentLogs, status: deployment.status }),
          event: "update",
        });
      }

      if (deployment.status === "active" || deployment.status === "failed") {
        await stream.writeSSE({ data: JSON.stringify({ done: true }), event: "done" });
        break;
      }

      await stream.sleep(1000);
    }
  });
});
export default deploymentControllers;
