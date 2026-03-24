import { NoteService } from '../services/NoteService';
import { INote } from '../interfaces/INote';

export class CLIController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  public createNote(title: string, content: string, tags: string[]): void {
    const note = this.noteService.createNote(title, content, tags);
    this.printSuccess('Note créée avec succès!');
    this.printLine(`ID: ${note.getId()}`);
    this.printLine(`Titre: ${note.getTitle()}`);
    this.printLine(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
  }

  public listNotes(verbose: boolean = false): void {
    const notes = this.noteService.getAllNotes();

    if (notes.length === 0) {
      this.printLine('Aucune note trouvée.');
      return;
    }

    this.printLine(`\n${notes.length} note(s) trouvée(s):\n`);

    notes.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);

      if (verbose) {
        console.log(`    Contenu: ${note.getContent()}`);
        console.log(`    Tags: ${note.getTags().join(', ') || 'Aucun'}`);
        console.log(`    Créée le: ${note.getCreatedAt().toLocaleString()}`);
        console.log(`    Modifiée le: ${note.getUpdatedAt().toLocaleString()}`);
      } else {
        const content = note.getContent();
        const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
        console.log(`    ${preview}`);
        const tags = note.getTags();
        if (tags.length > 0) {
          console.log(`    Tags: ${tags.join(', ')}`);
        }
      }
      console.log('');
    });
  }

  public showNote(id: string): void {
    const note = this.noteService.getNoteById(id);

    if (!note) {
      this.printError(`Aucune note trouvée avec l'ID "${id}".`);
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(note.getTitle());
    console.log('='.repeat(60));
    console.log(`\n${note.getContent()}\n`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
    console.log(`ID: ${note.getId()}`);
    console.log(`Créée: ${note.getCreatedAt().toLocaleString()}`);
    console.log(`Modifiée: ${note.getUpdatedAt().toLocaleString()}`);

    // Afficher les attachements s'il y en a
    const attachmentService = this.noteService.getAttachmentService();
    if (attachmentService) {
      const attachments = attachmentService.listAttachments(id);
      if (attachments.length > 0) {
        console.log(`\nPièces jointes (${attachments.length}):`);
        attachments.forEach((attach, idx) => {
          console.log(`  [${idx + 1}] ${attach.fileName} (${attach.type}, ${(attach.size / 1024).toFixed(2)} KB)`);
          console.log(`      ID: ${attach.id}`);
        });
      }
    }
    console.log('');
  }

  public searchNotes(query: string): void {
    const results = this.noteService.searchNotes(query);

    if (results.length === 0) {
      this.printLine(`Aucune note trouvée pour "${query}".`);
      return;
    }

    console.log(`\n${results.length} note(s) trouvée(s) pour "${query}":\n`);

    results.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);
      const content = note.getContent();
      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      console.log(`    ${preview}`);
      const tags = note.getTags();
      if (tags.length > 0) {
        console.log(`    Tags: ${tags.join(', ')}`);
      }
      console.log('');
    });
  }

  public filterByTag(tag: string): void {
    const results = this.noteService.getNotesByTag(tag);

    if (results.length === 0) {
      this.printLine(`Aucune note avec l'étiquette "${tag}".`);
      return;
    }

    console.log(`\n${results.length} note(s) avec l'étiquette "${tag}":\n`);

    results.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);
      const content = note.getContent();
      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      console.log(`    ${preview}`);
      console.log('');
    });
  }

  public async deleteNote(id: string): Promise<void> {
    const deleted = await this.noteService.deleteNote(id);

    if (deleted) {
      this.printSuccess('Note supprimée avec succès!');
    } else {
      this.printError(`Aucune note trouvée avec l'ID "${id}".`);
    }
  }

  public exportNotes(path: string): void {
    this.executeSync(
      () => {
      this.noteService.exportNotes(path);
        this.printSuccess(`Notes exportées avec succès vers ${path}`);
      },
      'Erreur lors de l\'export'
    );
  }

  public importNotes(path: string, merge: boolean): void {
    this.executeSync(
      () => {
      this.noteService.importNotes(path, merge);
        this.printSuccess(`Notes importées avec succès depuis ${path}`);
      },
      'Erreur lors de l\'import'
    );
  }

  // ========== Commandes pour les backups ==========

  public async createBackup(): Promise<void> {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      this.printError('Le service de backup n\'est pas configuré.');
      return;
    }

    await this.executeAsync(
      async () => {
      const metadata = await backupService.createBackup();
        this.printSuccess('Backup créé avec succès!');
        this.printLine(`ID: ${metadata.id}`);
        this.printLine(`Date: ${metadata.timestamp.toLocaleString()}`);
        this.printLine(`Notes sauvegardées: ${metadata.notesCount}`);
        this.printLine(`Checksum: ${metadata.checksum.substring(0, 16)}...`);
      },
      'Erreur lors de la création du backup'
    );
  }

  public listBackups(): void {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      this.printError('Le service de backup n\'est pas configuré.');
      return;
    }

    const backups = backupService.listBackups();

    if (backups.length === 0) {
      this.printLine('Aucun backup trouvé.');
      return;
    }

    console.log(`\n${backups.length} backup(s) disponible(s):\n`);

    backups.forEach((backup, index) => {
      console.log(`[${index + 1}] ${backup.timestamp.toLocaleString()}`);
      console.log(`    ID: ${backup.id}`);
      console.log(`    Notes: ${backup.notesCount}`);
      console.log(`    Checksum: ${backup.checksum.substring(0, 16)}...`);
      console.log('');
    });
  }

  public async restoreBackup(backupId: string): Promise<void> {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      this.printError('Le service de backup n\'est pas configuré.');
      return;
    }

    await this.executeAsync(
      async () => {
      const restored = await backupService.restoreBackup(backupId);
      
      if (restored) {
          this.printSuccess('Backup restauré avec succès!');
          this.printLine('Les notes ont été rechargées depuis le backup.');
      }
      },
      'Erreur lors de la restauration'
    );
  }

  public async verifyBackup(backupId: string): Promise<void> {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      this.printError('Le service de backup n\'est pas configuré.');
      return;
    }

    await this.executeAsync(
      async () => {
      const isValid = await backupService.verifyBackupIntegrity(backupId);
      
      if (isValid) {
          this.printSuccess('L\'intégrité du backup est validée.');
      } else {
          this.printError('Le backup est corrompu ou introuvable.');
      }
      },
      'Erreur lors de la vérification'
    );
  }

  // ========== Commandes pour les attachements ==========

  public async attachFile(noteId: string, filePath: string): Promise<void> {
    const attachmentService = this.noteService.getAttachmentService();
    
    if (!attachmentService) {
      this.printError('Le service d\'attachements n\'est pas configuré.');
      return;
    }

    await this.executeAsync(
      async () => {
      const attachment = await attachmentService.attachFile(noteId, filePath);
        this.printSuccess('Fichier attaché avec succès!');
        this.printLine(`ID: ${attachment.id}`);
        this.printLine(`Nom: ${attachment.fileName}`);
        this.printLine(`Type: ${attachment.type}`);
        this.printLine(`Taille: ${(attachment.size / 1024).toFixed(2)} KB`);
      },
      'Erreur lors de l\'attachement'
    );
  }

  public listAttachments(noteId: string): void {
    const attachmentService = this.noteService.getAttachmentService();
    
    if (!attachmentService) {
      this.printError('Le service d\'attachements n\'est pas configuré.');
      return;
    }

    const attachments = attachmentService.listAttachments(noteId);

    if (attachments.length === 0) {
      this.printLine(`Aucune pièce jointe pour la note "${noteId}".`);
      return;
    }

    console.log(`\n${attachments.length} pièce(s) jointe(s) pour la note "${noteId}":\n`);

    attachments.forEach((attach, index) => {
      console.log(`[${index + 1}] ${attach.fileName}`);
      console.log(`    ID: ${attach.id}`);
      console.log(`    Type: ${attach.type}`);
      console.log(`    Taille: ${(attach.size / 1024).toFixed(2)} KB`);
      console.log(`    Ajouté le: ${attach.createdAt.toLocaleString()}`);
      console.log('');
    });
  }

  public async detachFile(noteId: string, attachmentId: string): Promise<void> {
    const attachmentService = this.noteService.getAttachmentService();
    
    if (!attachmentService) {
      this.printError('Le service d\'attachements n\'est pas configuré.');
      return;
    }

    await this.executeAsync(
      async () => {
      const detached = await attachmentService.detachFile(noteId, attachmentId);
      
      if (detached) {
          this.printSuccess('Fichier détaché avec succès!');
      } else {
          this.printError('Attachement introuvable ou ID de note incorrect.');
      }
      },
      'Erreur lors du détachement'
    );
  }

  private printLine(message: string): void {
    console.log(message);
  }

  private printSuccess(message: string): void {
    this.printLine(`✓ ${message}`);
  }

  private printError(message: string): void {
    console.log(`✗ ${message}`);
  }

  private executeSync(action: () => void, context: string): void {
    try {
      action();
    } catch (error) {
      console.error(`✗ ${context}: ${error}`);
    }
  }

  private async executeAsync(action: () => Promise<void>, context: string): Promise<void> {
    try {
      await action();
    } catch (error) {
      console.error(`✗ ${context}: ${error}`);
    }
  }
}
