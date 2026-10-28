import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { runAgent } from './agent';
import { runTsc } from './validate';
import { runRender } from './render';
import { git, gitCommitAll, gitRollback, gitUndo, gitHistory, ensureWorkspaceGit } from './git';
import { startStudio, stopStudio } from './studio';

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  for (const element of fs.readdirSync(from)) {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

function getWorkspaceDir(): string {
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), 'workspace');
  }
  const resourcesWorkspace = path.join(process.resourcesPath, 'workspace');
  try {
    const testFile = path.join(resourcesWorkspace, '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return resourcesWorkspace;
  } catch {
    const userDataWorkspace = path.join(app.getPath('userData'), 'workspace');
    if (!fs.existsSync(userDataWorkspace)) {
      copyFolderSync(resourcesWorkspace, userDataWorkspace);
    }
    return userDataWorkspace;
  }
}

const WORKSPACE_DIR = getWorkspaceDir();
const STUDIO_PORT = 3010;
const UI_DEV_URL = 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

// ─── Window creation with retry for dev server ──────────────────────────────

async function loadDevServer(win: BrowserWindow, url: string) {
  let attempts = 0;
  while (attempts < 40) {
    try {
      await win.loadURL(url);
      return;
    } catch {
      attempts++;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    win.loadFile(distPath);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    loadDevServer(mainWindow, UI_DEV_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC: agent:run ──────────────────────────────────────────────────────────

ipcMain.handle(
  'agent:run',
  async (event, { prompt, compositionId }: { prompt: string; compositionId?: string }) => {
    const send = (channel: string, data: unknown) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        event.sender.send(channel, data);
      }
    };

    try {
      // Ensure autocrlf is false in the workspace git config to avoid CRLF warnings on Windows
      await git(['config', 'core.autocrlf', 'false'], WORKSPACE_DIR).catch(() => {});

      let finalPrompt = prompt;
      if (compositionId && !prompt.toLowerCase().includes(compositionId.toLowerCase())) {
        finalPrompt = `[Context: Active composition is "${compositionId}" in src/compositions/${compositionId}.tsx]\n${prompt}`;
      }

      send('agent:event', { type: 'status', text: '⚡ Running agent in workspace…' });
      await runAgent(finalPrompt, WORKSPACE_DIR, (line) =>
        send('agent:event', { type: 'log', text: line })
      );

      // Validation + retry loop (max 2 retries)
      for (let attempt = 0; attempt < 2; attempt++) {
        send('agent:event', { type: 'status', text: '🔍 Validating TypeScript (tsc --noEmit)…' });
        const errors = await runTsc(WORKSPACE_DIR);
        if (!errors) {
          send('agent:event', { type: 'status', text: '✨ TypeScript check passed!' });
          break;
        }

        if (attempt < 1) {
          send('agent:event', {
            type: 'status',
            text: `⚠️ TS errors detected. Auto-repair attempt ${attempt + 1}/2…`,
          });
          send('agent:event', { type: 'log', text: `[TypeScript Errors]\n${errors}` });
          await runAgent(
            `Fix these TypeScript errors in the workspace compositions:\n${errors}\nFollow AGENTS.md rules strictly.`,
            WORKSPACE_DIR,
            (line) => send('agent:event', { type: 'log', text: line })
          );
        } else {
          const finalErrors = await runTsc(WORKSPACE_DIR);
          if (finalErrors) {
            send('agent:event', { type: 'status', text: '🔄 Max retries exceeded. Rolling back changes…' });
            await gitRollback(WORKSPACE_DIR);
            const err = `Generation failed after 2 retries:\n${finalErrors}`;
            send('agent:done', { success: false, error: err });
            return { success: false, error: err };
          }
        }
      }

      // Final validation check
      const remainingErrors = await runTsc(WORKSPACE_DIR);
      if (remainingErrors) {
        await gitRollback(WORKSPACE_DIR);
        const err = `TypeScript validation failed:\n${remainingErrors}`;
        send('agent:done', { success: false, error: err });
        return { success: false, error: err };
      }

      const shortPrompt = prompt.replace(/\r?\n+/g, ' ').slice(0, 50).trim();
      const commitResult = await gitCommitAll(`agent: ${shortPrompt}`, WORKSPACE_DIR);
      if (commitResult.committed) {
        send('agent:event', { type: 'status', text: '✅ Generation committed. Studio will hot-reload.' });
      } else {
        send('agent:event', {
          type: 'status',
          text: 'ℹ️ Agent finished (no workspace file changes needed to be committed).',
        });
      }
      send('agent:done', { success: true });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      send('agent:event', { type: 'status', text: `❌ Error: ${msg}` });
      send('agent:done', { success: false, error: msg });
      return { success: false, error: msg };
    }
  }
);

// ─── IPC: render:start ───────────────────────────────────────────────────────

ipcMain.handle(
  'render:start',
  async (
    event,
    { compositionId, props }: { compositionId: string; props: Record<string, unknown> }
  ) => {
    const send = (channel: string, data: unknown) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        event.sender.send(channel, data);
      }
    };

    try {
      send('agent:event', { type: 'status', text: `🎬 Rendering MP4 for "${compositionId}"…` });
      const outputPath = await runRender(
        compositionId,
        props,
        WORKSPACE_DIR,
        (pct) => send('render:progress', { percent: pct })
      );
      send('agent:event', { type: 'status', text: `🎉 Render complete: ${outputPath}` });
      return { success: true, outputPath };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      send('agent:event', { type: 'status', text: `❌ Render failed: ${msg}` });
      return { success: false, error: msg };
    }
  }
);

// ─── IPC: compositions:list ──────────────────────────────────────────────────

ipcMain.handle('compositions:list', async () => {
  try {
    const compDir = path.join(WORKSPACE_DIR, 'src', 'compositions');
    if (!fs.existsSync(compDir)) return [];
    const files = fs.readdirSync(compDir);
    return files
      .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
      .map((f) => path.basename(f, path.extname(f)));
  } catch (err) {
    console.error('Failed to list compositions:', err);
    return ['TitleCard', 'LowerThird', 'KineticText', 'LogoReveal', 'Countdown'];
  }
});

// ─── IPC: workspace:undo & history ───────────────────────────────────────────

ipcMain.handle('workspace:undo', async () => {
  try {
    await gitUndo(WORKSPACE_DIR);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('workspace:history', async () => {
  return gitHistory(8, WORKSPACE_DIR);
});

// ─── IPC: studio:status & misc ───────────────────────────────────────────────

ipcMain.handle('studio:status', async () => {
  return new Promise<{ online: boolean }>((resolve) => {
    const req = http.get(`http://localhost:${STUDIO_PORT}`, { timeout: 1500 }, (res) => {
      resolve({ online: res.statusCode !== undefined });
    });
    req.on('error', () => resolve({ online: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ online: false });
    });
  });
});

ipcMain.handle('app:getStudioUrl', () => `http://localhost:${STUDIO_PORT}`);
ipcMain.handle('shell:openExternal', (_, url: string) => shell.openExternal(url));
ipcMain.handle('shell:showItemInFolder', (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await ensureWorkspaceGit(WORKSPACE_DIR).catch(() => {});
  startStudio(WORKSPACE_DIR, STUDIO_PORT);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  stopStudio();
});

app.on('window-all-closed', () => {
  stopStudio();
  if (process.platform !== 'darwin') app.quit();
});
