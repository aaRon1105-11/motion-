import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Runs `npx remotion render` for a given composition.
 * Reports render progress (0–100) via onProgress.
 */
export function runRender(
  compositionId: string,
  props: Record<string, unknown>,
  cwd: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outDir = path.join(cwd, 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outputFile = path.join(outDir, `${compositionId}.mp4`);
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      'remotion',
      'render',
      'src/index.ts',
      compositionId,
      outputFile,
    ];

    if (props && Object.keys(props).length > 0) {
      args.push('--props', JSON.stringify(props));
    }

    const child = spawn(npxCmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: { ...process.env },
    });

    const progressRe = /\((\d+)%\)/;

    const handleData = (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      const match = text.match(progressRe);
      if (match) {
        onProgress(parseInt(match[1], 10));
      }
    };

    child.stdout?.on('data', handleData);
    child.stderr?.on('data', handleData);

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn Remotion render process: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        onProgress(100);
        resolve(outputFile);
      } else {
        reject(new Error(`Remotion render exited with code ${code}`));
      }
    });
  });
}
