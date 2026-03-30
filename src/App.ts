import * as path from 'path';
import { NoteRepository } from './repositories/NoteRepository';
import { JsonStorage } from './storage/JsonStorage';
import { SearchEngine } from './search/SearchEngine';
import { NoteService } from './services/NoteService';
import { CLIController } from './controllers/CLIController';
import {
  CreateNoteCommand,
  ListNotesCommand,
  ShowNoteCommand,
  SearchNotesCommand,
  FilterByTagCommand,
  DeleteNoteCommand,
  ExportNotesCommand,
  ImportNotesCommand
} from './commands/NoteCommands';
import {
  CreateBackupCommand,
  ListBackupsCommand,
  RestoreBackupCommand,
  VerifyBackupCommand
} from './commands/BackupCommands';
import {
  AttachFileCommand,
  ListAttachmentsCommand,
  DetachFileCommand
} from './commands/AttachmentCommands';

export class App {
  private static instance: App;
  private controller: CLIController;

  private constructor() {
    const dataPath = path.join(process.cwd(), 'notes.json');

    const repository = new NoteRepository();
    const storage = new JsonStorage(dataPath);
    const searchEngine = new SearchEngine();

    const noteService = new NoteService(repository, storage, searchEngine);

    this.controller = new CLIController();

    // Commandes de notes
    this.controller.registerCommand('create', new CreateNoteCommand(noteService));
    this.controller.registerCommand('list', new ListNotesCommand(noteService));
    this.controller.registerCommand('show', new ShowNoteCommand(noteService));
    this.controller.registerCommand('search', new SearchNotesCommand(noteService));
    this.controller.registerCommand('tag', new FilterByTagCommand(noteService));
    this.controller.registerCommand('delete', new DeleteNoteCommand(noteService));
    this.controller.registerCommand('export', new ExportNotesCommand(noteService));
    this.controller.registerCommand('import', new ImportNotesCommand(noteService));

    // Commandes de backup
    const backupService = noteService.getBackupService();
    this.controller.registerCommand('backup', new CreateBackupCommand(backupService));
    this.controller.registerCommand('backups', new ListBackupsCommand(backupService));
    this.controller.registerCommand('restore', new RestoreBackupCommand(backupService));
    this.controller.registerCommand('verify', new VerifyBackupCommand(backupService));

    // Commandes d'attachement
    const attachmentService = noteService.getAttachmentService();
    this.controller.registerCommand('attach', new AttachFileCommand(attachmentService));
    this.controller.registerCommand('attachments', new ListAttachmentsCommand(attachmentService));
    this.controller.registerCommand('detach', new DetachFileCommand(attachmentService));
  }

  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  public getController(): CLIController {
    return this.controller;
  }
}
