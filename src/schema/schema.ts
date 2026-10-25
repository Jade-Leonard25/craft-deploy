import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user_signup", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const userData = sqliteTable("user_data", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstname: text("firstname"),
  lastname: text("lastname"),
  githubUser: text("github_user"),
  bio: text("bio"),
});

export const deployments = sqliteTable("deployments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  repoUrl: text("repo_url").notNull().default(""),
  branch: text("branch").notNull().default("main"),
  installCommand: text("install_command").notNull().default("npm install"),
  buildCommand: text("build_command").notNull().default("npm run build"),
  outputDir: text("output_dir").notNull().default("dist"),
  projectName: text("project_name").notNull(),
  status: text("status", { enum: ["pending", "building", "active", "failed"] })
    .default("pending")
    .notNull(),
  sourceType: text("source_type", { enum: ["zip", "github"] }).notNull(),
  logs: text("logs").default("").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
