import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema } from "../globals/globals.config.controllers";
import db from "../db";
import { users } from "../schema/schema";
import bcrypt from "bcryptjs";

const signControllers = new Hono();

// Drizzle wraps the real database error in `cause`
function dbReason(error: any): string {
  return error?.cause?.message ?? error?.message ?? "Unknown error";
}

signControllers.post(
  "/sign-up",
  zValidator("json", signUpSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      const [created] = await db
        .insert(users)
        .values({
          username: input.email.split("@")[0],
          email: input.email,
          passwordHash,
        })
        .returning({ id: users.id, username: users.username, email: users.email });

      return c.json({ success: true, user: created }, 201);
    } catch (error: any) {
      const reason = dbReason(error);
      console.error("Sign-up failed:", reason);

      if (/UNIQUE constraint failed/i.test(reason)) {
        return c.json(
          { success: false, message: "An account with this email already exists. Try logging in." },
          409
        );
      }
      if (/no such table/i.test(reason)) {
        return c.json(
          { success: false, message: "Database table missing. Run: npx drizzle-kit push" },
          500
        );
      }
      return c.json({ success: false, message: reason }, 500);
    }
  }
);

export default signControllers;
