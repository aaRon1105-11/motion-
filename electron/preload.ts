import { contextBridge, ipcRenderer } from 'electron';

export type AgentEvent =
  | { type: 'log'; text: string }
  | { type: 'status'; text: string };

export type AgentDone = { success: boolean; error?: string };
export type RenderProgress = { percent: number };
export type RenderResult = { success: boolean; outputPath?: string; error?: string };

contextBridge.exposeInMainWorld('motionStudio', {
  // Agent
  runAgent: (prompt: string, compositionId?: string) =>
    ipcRenderer.invoke('agent:run', { prompt, compositionId }),
  onAgentEvent: (cb: (event: AgentEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: AgentEvent) => cb(data);
    ipcRenderer.on('agent:event', handler);
    return () => ipcRenderer.removeListener('agent:event', handler);
  },
  onAgentDone: (cb: (result: AgentDone) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: AgentDone) => cb(data);
    ipcRenderer.once('agent:done', handler);
    return () => ipcRenderer.removeListener('agent:done', handler);
  },

  // Render
  startRender: (compositionId: string, props: Record<string, unknown>): Promise<RenderResult> =>
    ipcRenderer.invoke('render:start', { compositionId, props }),
  onRenderProgress: (cb: (p: RenderProgress) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: RenderProgress) => cb(data);
    ipcRenderer.on('render:progress', handler);
    return () => ipcRenderer.removeListener('render:progress', handler);
  },

  // Compositions & Studio
  listCompositions: (): Promise<string[]> =>
    ipcRenderer.invoke('compositions:list'),
  getStudioUrl: (): Promise<string> =>
    ipcRenderer.invoke('app:getStudioUrl'),
  checkStudioStatus: (): Promise<{ online: boolean }> =>
    ipcRenderer.invoke('studio:status'),

  // Workspace & Shell
  undo: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('workspace:undo'),
  getHistory: (): Promise<string[]> =>
    ipcRenderer.invoke('workspace:history'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url),
  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath),
});
