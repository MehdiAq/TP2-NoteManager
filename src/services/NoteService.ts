import { INote } from '../interfaces/INote';
import { IRepository } from '../interfaces/IRepository';
import { IStorage } from '../interfaces/IStorage';
import { ISearchEngine } from '../interfaces/ISearchEngine';
import { IBackupService, IBackupMetadata } from '../interfaces/IBackupService';
import { IAttachmentService, IAttachment } from '../interfaces/IAttachmentService';
import { NoteFactory } from '../factories/NoteFactory';

export class NoteService {
  private repository: IRepository;
  private storage: IStorage;
  private searchEngine: ISearchEngine;
  private backupService?: IBackupService;
  private attachmentService?: IAttachmentService;
  private autoBackupConfig: {
    enabled: boolean;
    maxModifications: number;
    maxBackups: number;
  };

  constructor(
    repository: IRepository,
    storage: IStorage,
    searchEngine: ISearchEngine,
    backupService?: IBackupService,
    attachmentService?: IAttachmentService
  ) {
    this.repository = repository;
    this.storage = storage;
    this.searchEngine = searchEngine;
    this.backupService = backupService;
    this.attachmentService = attachmentService;
    this.autoBackupConfig = {
      enabled: false,
      maxModifications: 10,
      maxBackups: 5
    };
    this.loadNotes();
  }

  private loadNotes(): void {
    const notes = this.storage.load();
    notes.forEach(note => this.repository.add(note));
    this.searchEngine.buildIndexes(this.repository.findAll());
  }

  private persist(): void {
    const notes = this.repository.findAll();
    this.storage.save(notes);

    if (this.backupService && this.autoBackupConfig.enabled) {
      this.backupService.incrementModificationCount();

      if (this.backupService.getModificationsSinceLastBackup() >= this.autoBackupConfig.maxModifications) {
        this.createAutoBackup();
      }
    }

    this.searchEngine.buildIndexes(notes);
  }

  private async createAutoBackup(): Promise<void> {
    if (!this.backupService) return;

    try {
      await this.backupService.createBackup();
      this.backupService.cleanOldBackups(this.autoBackupConfig.maxBackups);
    } catch (error) {
      console.error('Erreur lors de la création du backup automatique:', error);
    }
  }

  public configureAutoBackup(maxModifications: number, maxBackups: number): void {
    this.autoBackupConfig.enabled = true;
    this.autoBackupConfig.maxModifications = maxModifications;
    this.autoBackupConfig.maxBackups = maxBackups;
  }

  public disableAutoBackup(): void {
    this.autoBackupConfig.enabled = false;
  }

  public createNote(title: string, content: string, tags: string[] = []): INote {
    const note = NoteFactory.createNote(title, content, tags);
    this.repository.add(note);
    this.persist();
    return note;
  }

  public async deleteNote(id: string): Promise<boolean> {
    if (this.attachmentService) {
      await this.attachmentService.deleteNoteAttachments(id);
    }

    const deleted = this.repository.remove(id);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  public updateNote(id: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
  }): INote | null {
    const note = this.repository.findById(id);
    if (!note) {
      return null;
    }

    if (updates.title !== undefined) {
      note.setTitle(updates.title);
    }
    if (updates.content !== undefined) {
      note.setContent(updates.content);
    }
    if (updates.tags !== undefined) {
      note.setTags(updates.tags);
    }

    this.repository.update(id, note);
    this.persist();
    return note;
  }

  public getNoteById(id: string): INote | undefined {
    return this.repository.findById(id);
  }

  public getAllNotes(): INote[] {
    return this.repository.findAll();
  }

  public searchNotes(query: string): INote[] {
    const allNotes = this.repository.findAll();
    return this.searchEngine.search(allNotes, query);
  }

  public getNotesByTag(tag: string): INote[] {
    const allNotes = this.repository.findAll();
    return this.searchEngine.searchByTag(allNotes, tag);
  }

  public exportNotes(path: string): void {
    const notes = this.repository.findAll();
    this.storage.export(path, notes);
  }

  public importNotes(path: string, merge: boolean = false): void {
    const importedNotes = this.storage.import(path);

    if (!merge) {
      this.repository.clear();
      importedNotes.forEach(note => this.repository.add(note));
    } else {
      importedNotes.forEach(note => {
        const newNote = NoteFactory.createNote(
          note.getTitle(),
          note.getContent(),
          note.getTags()
        );
        this.repository.add(newNote);
      });
    }

    this.persist();
  }

  public clearAllNotes(): void {
    this.repository.clear();
    this.persist();
  }

  public getNotesCount(): number {
    return this.repository.findAll().length;
  }

  // ========== Méthodes façade pour le BackupService ==========

  public hasBackupService(): boolean {
    return this.backupService !== undefined;
  }

  public async createBackup(): Promise<IBackupMetadata> {
    if (!this.backupService) {
      throw new Error('Le service de backup n\'est pas configuré.');
    }
    return this.backupService.createBackup();
  }

  public listBackups(): IBackupMetadata[] {
    if (!this.backupService) {
      throw new Error('Le service de backup n\'est pas configuré.');
    }
    return this.backupService.listBackups();
  }

  public async restoreBackup(backupId: string): Promise<boolean> {
    if (!this.backupService) {
      throw new Error('Le service de backup n\'est pas configuré.');
    }
    return this.backupService.restoreBackup(backupId);
  }

  public async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    if (!this.backupService) {
      throw new Error('Le service de backup n\'est pas configuré.');
    }
    return this.backupService.verifyBackupIntegrity(backupId);
  }

  // ========== Méthodes façade pour l'AttachmentService ==========

  public hasAttachmentService(): boolean {
    return this.attachmentService !== undefined;
  }

  public async attachFile(noteId: string, filePath: string): Promise<IAttachment> {
    if (!this.attachmentService) {
      throw new Error('Le service d\'attachements n\'est pas configuré.');
    }
    return this.attachmentService.attachFile(noteId, filePath);
  }

  public listAttachments(noteId: string): IAttachment[] {
    if (!this.attachmentService) {
      throw new Error('Le service d\'attachements n\'est pas configuré.');
    }
    return this.attachmentService.listAttachments(noteId);
  }

  public async detachFile(noteId: string, attachmentId: string): Promise<boolean> {
    if (!this.attachmentService) {
      throw new Error('Le service d\'attachements n\'est pas configuré.');
    }
    return this.attachmentService.detachFile(noteId, attachmentId);
  }
}
