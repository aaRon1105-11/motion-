import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

/**
 * Ensures the workspace directory is an initialized Git repository.
 * If .git does not exist (e.g. after a fresh git clone), initializes it and commits the starter templates.
 */
export async function ensureWorkspaceGit(cwd: string): Promise<void> {
  const gitDir = path.join(cwd, '.git');
  if (!fs.existsSync(gitDir)) {
    try {
      await execFileAsync('git', ['init'], { cwd });
      await execFileAsync('git', ['config', 'core.autocrlf', 'false'], { cwd });
      await execFileAsync('git', ['config', 'user.name', 'Motion Studio Agent'], { cwd });
      await execFileAsync('git', ['config', 'user.email', 'agent@motionstudio.local'], { cwd });
      await execFileAsync('git', ['add', '-A'], { cwd });
      await execFileAsync('git', ['commit', '-m', 'chore: initial workspace state'], { cwd });
    } catch (err) {
      console.warn('Workspace git auto-initialization note:', err);
    }
  }
}

/**
 * Runs a git command with an array of arguments in the given directory.
 * Uses native execFile to avoid Windows shell quoting issues.
 */
export async function git(args: string | string[], cwd: string): Promise<string> {
  const argArray = Array.isArray(args) ? args : args.split(' ').filter(Boolean);
  try {
    const { stdout, stderr } = await execFileAsync('git', argArray, { cwd });
    return (stdout + stderr).trim();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Git error (${argArray.join(' ')}): ${errorMsg}`);
  }
}

/**
 * Stages all changes (including untracked files) and commits them.
 * If working tree is clean, safely returns { committed: false } instead of failing.
 */
export async function gitCommitAll(
  message: string,
  cwd: string
): Promise<{ committed: boolean; message: string }> {
  await ensureWorkspaceGit(cwd);
  // 1. Stage all changes (new files, modified files, deleted files)
  await execFileAsync('git', ['add', '-A'], { cwd });

  // 2. Check if anything is actually staged
  const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], { cwd });
  if (!statusOut.trim()) {
    return {
      committed: false,
      message: 'No file changes detected to commit.',
    };
  }

  // 3. Commit with safe argument passing (no shell quote breaks)
  const cleanMessage = message.replace(/\r?\n/g, ' ').trim();
  const { stdout, stderr } = await execFileAsync('git', ['commit', '-m', cleanMessage], { cwd });
  return {
    committed: true,
    message: (stdout + stderr).trim(),
  };
}

/**
 * Hard rollback: resets tracked changes AND removes untracked files created during generation.
 */
export async function gitRollback(cwd: string): Promise<void> {
  await ensureWorkspaceGit(cwd);
  try {
    await execFileAsync('git', ['reset', '--hard'], { cwd });
  } catch (err) {
    console.error('git reset --hard failed:', err);
  }
  try {
    await execFileAsync('git', ['clean', '-fd'], { cwd });
  } catch (err) {
    console.error('git clean -fd failed:', err);
  }
}

/**
 * Undoes the last commit (HEAD~1) and cleans any untracked files.
 */
export async function gitUndo(cwd: string): Promise<void> {
  await ensureWorkspaceGit(cwd);
  await execFileAsync('git', ['reset', '--hard', 'HEAD~1'], { cwd });
  await execFileAsync('git', ['clean', '-fd'], { cwd });
}

/**
 * Retrieves the last N commits.
 */
export async function gitHistory(limit: number = 8, cwd: string): Promise<string[]> {
  await ensureWorkspaceGit(cwd);
  try {
    const { stdout } = await execFileAsync('git', ['log', `-n`, String(limit), '--oneline'], { cwd });
    return stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
