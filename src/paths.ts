import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';

// Built sites are stored here.
// path.resolve makes it absolute, because Docker needs absolute paths for -v mounts.
export const DEPLOYMENTS_DIR = path.resolve(
  process.env.DEPLOYMENTS_DIR ?? path.join(os.homedir(), 'deploycraft-data')
);
