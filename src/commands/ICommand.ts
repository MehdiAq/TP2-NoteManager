export interface ICommand {
  execute(args: Record<string, unknown>): Promise<void>;
}
