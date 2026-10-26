import 'dotenv/config';

import { simpleGit } from 'simple-git';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import db from './db';
import { deployments } from './schema/schema';
import { eq, sql } from 'drizzle-orm';
import { DEPLOYMENTS_DIR } from './paths';

type Logger = ReturnType<typeof createLogger>;

type BuildConfig = {
  installCommand: string;
  buildCommand: string;
  outputDir: string;
};

// Buffers log text and appends it to deployments.logs in batches, in order.
function createLogger(deploymentId: string) {
  let chain: Promise<void> = Promise.resolve();
  let buffer = '';
  let timer: NodeJS.Timeout | null = null;

  const flush = (): Promise<void> => {
    if (!buffer) return chain;
    const chunk = buffer;
    buffer = '';
    chain = chain.then(async () => {
      try {
        await db
          .update(deployments)
          .set({ logs: sql`${deployments.logs} || ${chunk}`, updatedAt: new Date() })
          .where(eq(deployments.id, deploymentId));
      } catch (e) {
        console.error('log write failed', e);
      }
    });
    return chain;
  };

  return {
    write(text: string) {
      if (!text) return;
      buffer += text.endsWith('\n') ? text : text + '\n';
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          void flush();
        }, 300);
      }
    },
    async close() {
      if (timer) clearTimeout(timer);
      timer = null;
      await flush();
    },
  };
}

// Commands are passed as environment variables, not pasted into the script,
// so quotes or $(...) in a user's command can't break out of the wrapper.
function buildInDocker(
  srcDir: string,
  outDir: string,
  cfg: BuildConfig,
  log: Logger
): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = `
set -e
mkdir -p /tmp/app
cp -r /src/. /tmp/app
cd /tmp/app

echo "$ $INSTALL_CMD"
sh -c "$INSTALL_CMD"

echo "$ $BUILD_CMD"
NODE_ENV=production sh -c "$BUILD_CMD"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "✖ Output folder '$OUTPUT_DIR' was not created by the build"
  exit 1
fi
cp -r "$OUTPUT_DIR"/. /out
`;

    const args = [
      'run', '--rm',
      '--memory', '1g',
      '--cpus', '1',
      '--pids-limit', '512',
      '--user', `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      '-e', 'HOME=/tmp',
      '-e', `INSTALL_CMD=${cfg.installCommand}`,
      '-e', `BUILD_CMD=${cfg.buildCommand}`,
      '-e', `OUTPUT_DIR=${cfg.outputDir}`,
      '-v', `${srcDir}:/src:ro`,
      '-v', `${outDir}:/out`,
      'node:22-alpine',
      'sh', '-c', script,
    ];

    console.log('\n[BUILD] Running build in Docker...');
    const child = spawn('docker', args);

    const timer = setTimeout(() => {
      log.write('✖ Build timed out after 10 minutes');
      child.kill('SIGKILL');
    }, 10 * 60_000);

    child.stdout.on('data', (d) => {
      const text = d.toString();
      console.log(text.trim());
      log.write(text);
    });
    child.stderr.on('data', (d) => {
      const text = d.toString();
      console.error(text.trim());
      log.write(text);
    });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Build failed with exit code ${code}`));
    });
  });
}

// Atomically claims the oldest pending deployment
async function claimNext() {
  const [job] = await db
    .update(deployments)
    .set({ status: 'building', updatedAt: new Date() })
    .where(
      eq(
        deployments.id,
        sql`(SELECT id FROM deployments WHERE status = 'pending' ORDER BY created_at LIMIT 1)`
      )
    )
    .returning();
  return job;
}

async function runBuild(job: typeof deployments.$inferSelect) {
  const deploymentId = job.id;
  const srcDir = path.join(os.tmpdir(), 'builds', deploymentId);
  const outDir = path.join(DEPLOYMENTS_DIR, deploymentId, 'public');
  const log = createLogger(deploymentId);

  console.log(`\n🚀 Starting build for deployment: ${deploymentId}`);

  try {
    await fs.rm(srcDir, { recursive: true, force: true });
    await fs.mkdir(srcDir, { recursive: true });
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });

    log.write(`$ git clone --branch ${job.branch} --depth 1 ${job.repoUrl}`);
    await simpleGit().clone(job.repoUrl, srcDir, ['--branch', job.branch, '--depth', '1']);

    await buildInDocker(
      srcDir,
      outDir,
      {
        installCommand: job.installCommand,
        buildCommand: job.buildCommand,
        outputDir: job.outputDir,
      },
      log
    );

    log.write('✔ Build complete. Deployment is live.');
    await log.close(); // flush BEFORE the status changes
    await db.update(deployments).set({ status: 'active' }).where(eq(deployments.id, deploymentId));
    console.log(`✅ Deployment ${deploymentId} successful!`);
  } catch (error: any) {
    console.error(`🚨 Deployment ${deploymentId} failed:`, error);
    log.write(`✖ ${error?.message ?? 'Deployment failed'}`);
    await log.close();
    await db.update(deployments).set({ status: 'failed' }).where(eq(deployments.id, deploymentId));
  } finally {
    await fs.rm(srcDir, { recursive: true, force: true });
  }
}

async function run() {
  // Crash recovery: a build left on "building" means the last worker died.
  // Safe with ONE worker only.
  await db
    .update(deployments)
    .set({ status: 'pending' })
    .where(eq(deployments.status, 'building'));

  console.log('👷 Worker is polling for pending deployments...');

  while (true) {
    try {
      const job = await claimNext();
      if (job) {
        await runBuild(job);
        continue; // look for more work right away
      }
    } catch (err) {
      console.error('Worker loop error:', err);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

run().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
