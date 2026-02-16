import { INote } from '../interfaces/INote';
import { IRepository } from '../interfaces/IRepository';
import { IStorage } from '../interfaces/IStorage';
import { ISearchEngine } from '../interfaces/ISearchEngine';
import { IBackupService } from '../interfaces/IBackupService';
import { IAttachmentService } from '../interfaces/IAttachmentService';
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
    
    // Construire les index de recherche après le chargement
    this.rebuildSearchIndexes();
  }

  private persist(): void {
    const notes = this.repository.findAll();
    this.storage.save(notes);
    
    // Incrémenter le compteur de modifications pour le backup automatique
    if (this.backupService && this.autoBackupConfig.enabled) {
      this.backupService.incrementModificationCount();
      
      // Vérifier si un backup automatique est nécessaire
      if (this.backupService.getModificationsSinceLastBackup() >= this.autoBackupConfig.maxModifications) {
        this.createAutoBackup();
      }
    }
    
    // Invalider le cache de recherche et reconstruire les index
    this.rebuildSearchIndexes();
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

  /**
   * Reconstruit les index de recherche pour optimiser les performances
   */
  private rebuildSearchIndexes(): void {
    const allNotes = this.repository.findAll();
    // Le SearchEngine optimisé utilise buildIndexes pour construire ses index
    if ('buildIndexes' in this.searchEngine) {
      (this.searchEngine as any).buildIndexes(allNotes);
    }
  }

  /**
   * Configure le backup automatique
   */
  public configureAutoBackup(maxModifications: number, maxBackups: number): void {
    this.autoBackupConfig.enabled = true;
    this.autoBackupConfig.maxModifications = maxModifications;
    this.autoBackupConfig.maxBackups = maxBackups;
  }

  /**
   * Désactive le backup automatique
   */
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
    // Supprimer les attachements associés
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
      // En mode fusion, créer de nouvelles notes avec de nouveaux IDs
      // pour éviter les collisions
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

  // Méthodes pour le BackupService
  public getBackupService(): IBackupService | undefined {
    return this.backupService;
  }

  // Méthodes pour l'AttachmentService
  public getAttachmentService(): IAttachmentService | undefined {
    return this.attachmentService;
  }
}