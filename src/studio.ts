import { spawn, ChildProcess } from 'child_process';

let studioProcess: ChildProcess | null = null;

/**
 * Spawns the Remotion Studio dev server in the workspace directory.
 */
export function startStudio(
  workspaceDir: string,
  port = 3010
): { process: ChildProcess; url: string } {
  if (studioProcess) {
    return { process: studioProcess, url: `http://localhost:${port}` };
  }

  // Windows: npx is npx.cmd
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  // Use --no-open to prevent Remotion Studio from launching the external system browser,
  // since the preview is already embedded directly in the app's webview.
  const args = ['remotion', 'studio', 'src/index.ts', '--port', String(port), '--no-open'];

  studioProcess = spawn(npxCmd, args, {
    cwd: workspaceDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  studioProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString('utf8');
    if (process.env.DEBUG_STUDIO) {
      console.log('[Studio]', text.trim());
    }
  });

  studioProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString('utf8');
    if (process.env.DEBUG_STUDIO) {
      console.error('[Studio ERR]', text.trim());
    }
  });

  studioProcess.on('exit', (code) => {
    console.log(`Remotion Studio exited with code ${code}`);
    studioProcess = null;
  });

  return { process: studioProcess, url: `http://localhost:${port}` };
}

/**
 * Terminates the Studio process if running.
 */
export function stopStudio(): void {
  if (studioProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(studioProcess.pid), '/f', '/t']);
      } else {
        studioProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('Failed to kill Studio process', e);
    }
    studioProcess = null;
  }
}
