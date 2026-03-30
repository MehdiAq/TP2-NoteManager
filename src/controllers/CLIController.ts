import { ICommand } from '../commands/ICommand';

export class CLIController {
  private commands: Map<string, ICommand> = new Map();

  registerCommand(name: string, command: ICommand): void {
    this.commands.set(name, command);
  }

  async dispatch(name: string, args: Record<string, unknown>): Promise<void> {
    const command = this.commands.get(name);
    if (!command) {
      console.log(`✗ Commande inconnue: "${name}"`);
      return;
    }
    await command.execute(args);
  }
}
