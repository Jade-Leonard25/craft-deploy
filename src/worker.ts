import 'dotenv/config';
import { boss, startQueue } from './queues/build-queue';
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

function buildInDocker(srcDir: string, outDir: string, log: Logger): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = [
      'cp -r /src/. /tmp/app',
      'cd /tmp/app',
      'npm install --include=dev --ignore-scripts',
      'npm run build',
      '(cp -r dist/. /out 2>/dev/null || cp -r build/. /out)',
    ].join(' && ');

    const args = [
      'run', '--rm',
      '--memory', '1g',
      '--cpus', '1',
      '--user', `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      '-e', 'HOME=/tmp',
      '-e', 'NODE_ENV=production',
      '-v', `${srcDir}:/src:ro`,
      '-v', `${outDir}:/out`,
      'node:22-alpine',
      'sh', '-c', `mkdir -p /tmp/app && ${script}`,
    ];

    console.log('\n[BUILD] Running build in Docker...');
    log.write('$ docker run node:22-alpine (npm install && npm run build)');
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
      else reject(new Error(`Docker build failed with exit code ${code}`));
    });
  });
}

async function run() {
  await startQueue();

  await boss.work("build-jobs", async (jobs) => {
    for (const job of jobs) {
      const { deploymentId, repoUrl, branch } = job.data as {
        deploymentId: string; repoUrl: string; branch: string;
      };
      const srcDir = path.join(os.tmpdir(), 'builds', deploymentId);
      const outDir = path.join(DEPLOYMENTS_DIR, deploymentId, 'public');
      const log = createLogger(deploymentId);

      console.log(`\n🚀 Starting build for deployment: ${deploymentId}`);

      try {
        // reset logs so a retry/redeploy starts clean
        await db.update(deployments)
          .set({ status: 'building', logs: '' })
          .where(eq(deployments.id, deploymentId));

        await fs.rm(srcDir, { recursive: true, force: true });
        await fs.mkdir(srcDir, { recursive: true });
        await fs.rm(outDir, { recursive: true, force: true });
        await fs.mkdir(outDir, { recursive: true });

        console.log(`📦 Cloning ${repoUrl} (${branch})...`);
        log.write(`$ git clone --branch ${branch || 'main'} --depth 1 ${repoUrl}`);
        await simpleGit().clone(repoUrl, srcDir, ['--branch', branch || 'main', '--depth', '1']);

        await buildInDocker(srcDir, outDir, log);

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
  });

  console.log("👷 Worker is listening for build jobs...");
}

run().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
