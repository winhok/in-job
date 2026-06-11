export interface PromptContext {
  toolCount: number;
  deferredToolCount: number;
  sessionMessageCount: number;
  sessionId: string;
}

export type PipeFn<C = PromptContext> = (ctx: C) => string | null;

export class PromptBuilder<C = PromptContext> {
  private pipes: Array<{ name: string; fn: PipeFn<C> }> = [];

  pipe(name: string, fn: PipeFn<C>): this {
    this.pipes.push({ name, fn });
    return this;
  }

  build(ctx: C): string {
    const sections: string[] = [];
    for (const { fn } of this.pipes) {
      const result = fn(ctx);
      if (result !== null) {
        sections.push(result);
      }
    }
    return sections.join('\n\n');
  }

  debug(ctx: C): void {
    console.log('\n=== Prompt Pipe Debug ===');
    for (const { name, fn } of this.pipes) {
      const result = fn(ctx);
      const status = result !== null ? `[ON] ${result.length} chars` : '[OFF]';
      console.log(`  ${name}: ${status}`);
    }
    console.log('========================\n');
  }
}
