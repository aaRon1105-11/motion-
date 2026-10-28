import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Finds the agy executable on the system.
 */
export function getAgyExecutable(): string {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const candidate = path.join(localAppData, 'agy', 'bin', 'agy.exe');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'agy.exe';
  }
  return 'agy';
}

/**
 * Runs `agy -p "<prompt>"` in the workspace directory.
 * Streams each stdout line to the onLine callback.
 * Automatically approves tool execution via `--dangerously-skip-permissions`.
 */
export function runAgent(
  prompt: string,
  cwd: string,
  onLine: (line: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const agyBin = getAgyExecutable();

    // agy headless mode with structured stream-json output
    const args = [
      '--output-format',
      'stream-json',
      '--dangerously-skip-permissions',
      '-p',
      prompt,
    ];

    // IMPORTANT: shell must be false so Windows does not route through cmd.exe,
    // which mangles quotes, newlines, and arguments, causing flag parsing error (exit code 2).
    const child = spawn(agyBin, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env },
    });

    let buffer = '';
    const stderrLines: string[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const eventType = parsed.event || parsed.type;
          let displayText = '';
          if (eventType === 'init') {
            displayText = '⚡ Initialized agent workspace session';
          } else if (eventType === 'tool_call') {
            const toolName = parsed.tool_call?.name || parsed.name || 'tool';
            displayText = `⚙️ [Tool] Executing ${toolName}`;
          } else if (eventType === 'tool_result') {
            displayText = '✓ [Tool] Completed tool action';
          } else if (parsed.content) {
            displayText = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
          } else {
            displayText =
              parsed.text ??
              parsed.message ??
              (typeof parsed === 'string' ? parsed : line);
          }
          if (displayText) onLine(displayText);
        } catch {
          onLine(line);
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const errText = chunk.toString('utf8').trim();
      if (errText) {
        stderrLines.push(errText);
        onLine(`[agent info] ${errText}`);
      }
    });

    child.on('error', (err) => {
      reject(
        new Error(
          `Failed to start agy (${agyBin}): ${err.message}. Ensure Antigravity CLI is installed and in PATH.`
        )
      );
    });

    child.on('close', (code) => {
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const text = parsed.text ?? parsed.message ?? parsed.content ?? buffer.trim();
          onLine(text);
        } catch {
          onLine(buffer.trim());
        }
      }

      if (code === 0) {
        resolve();
      } else {
        const errorDetails = stderrLines.slice(-3).join(' ') || 'No stderr details';
        reject(new Error(`agy exited with status code ${code}: ${errorDetails}`));
      }
    });
  });
}
