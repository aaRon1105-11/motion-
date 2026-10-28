import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Runs `tsc --noEmit` in the given directory.
 * Returns null if clean, or the error output string if there are errors.
 */
export async function runTsc(cwd: string): Promise<string | null> {
  try {
    await execAsync('npx tsc --noEmit', { cwd });
    return null; // clean
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'stdout' in err) {
      const e = err as { stdout: string; stderr: string };
      return (e.stdout + e.stderr).trim() || 'Unknown TypeScript error';
    }
    return String(err);
  }
}
