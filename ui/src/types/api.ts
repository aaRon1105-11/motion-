export type AgentEvent =
  | { type: 'log'; text: string }
  | { type: 'status'; text: string };

export type AgentDone = { success: boolean; error?: string };
export type RenderProgress = { percent: number };
export type RenderResult = { success: boolean; outputPath?: string; error?: string };

declare global {
  interface Window {
    motionStudio: {
      runAgent(
        prompt: string,
        compositionId?: string
      ): Promise<{ success: boolean; error?: string }>;
      onAgentEvent(cb: (event: AgentEvent) => void): () => void;
      onAgentDone(cb: (result: AgentDone) => void): () => void;

      startRender(
        compositionId: string,
        props: Record<string, unknown>
      ): Promise<RenderResult>;
      onRenderProgress(cb: (p: RenderProgress) => void): () => void;

      listCompositions(): Promise<string[]>;
      getStudioUrl(): Promise<string>;
      checkStudioStatus(): Promise<{ online: boolean }>;

      undo(): Promise<{ success: boolean; error?: string }>;
      getHistory(): Promise<string[]>;
      openExternal(url: string): Promise<void>;
      showItemInFolder(filePath: string): Promise<void>;
    };
  }
}
