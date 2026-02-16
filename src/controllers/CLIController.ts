import { NoteService } from '../services/NoteService';
import { INote } from '../interfaces/INote';

export class CLIController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  public createNote(title: string, content: string, tags: string[]): void {
    const note = this.noteService.createNote(title, content, tags);
    console.log('✓ Note créée avec succès!');
    console.log(`ID: ${note.getId()}`);
    console.log(`Titre: ${note.getTitle()}`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
  }

  public listNotes(verbose: boolean = false): void {
    const notes = this.noteService.getAllNotes();

    if (notes.length === 0) {
      console.log('Aucune note trouvée.');
      return;
    }

    console.log(`\n${notes.length} note(s) trouvée(s):\n`);

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
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
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
      console.log(`Aucune note trouvée pour "${query}".`);
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
      console.log(`Aucune note avec l'étiquette "${tag}".`);
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
      console.log('✓ Note supprimée avec succès!');
    } else {
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
    }
  }

  public exportNotes(path: string): void {
    try {
      this.noteService.exportNotes(path);
      console.log(`✓ Notes exportées avec succès vers ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'export: ${error}`);
    }
  }

  public importNotes(path: string, merge: boolean): void {
    try {
      this.noteService.importNotes(path, merge);
      console.log(`✓ Notes importées avec succès depuis ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'import: ${error}`);
    }
  }

  // ========== Commandes pour les backups ==========

  public async createBackup(): Promise<void> {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    try {
      const metadata = await backupService.createBackup();
      console.log('✓ Backup créé avec succès!');
      console.log(`ID: ${metadata.id}`);
      console.log(`Date: ${metadata.timestamp.toLocaleString()}`);
      console.log(`Notes sauvegardées: ${metadata.notesCount}`);
      console.log(`Checksum: ${metadata.checksum.substring(0, 16)}...`);
    } catch (error) {
      console.error(`✗ Erreur lors de la création du backup: ${error}`);
    }
  }

  public listBackups(): void {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    const backups = backupService.listBackups();

    if (backups.length === 0) {
      console.log('Aucun backup trouvé.');
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
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    try {
      const restored = await backupService.restoreBackup(backupId);
      
      if (restored) {
        console.log('✓ Backup restauré avec succès!');
        console.log('Les notes ont été rechargées depuis le backup.');
      }
    } catch (error) {
      console.error(`✗ Erreur lors de la restauration: ${error}`);
    }
  }

  public async verifyBackup(backupId: string): Promise<void> {
    const backupService = this.noteService.getBackupService();
    
    if (!backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    try {
      const isValid = await backupService.verifyBackupIntegrity(backupId);
      
      if (isValid) {
        console.log('✓ L\'intégrité du backup est validée.');
      } else {
        console.log('✗ Le backup est corrompu ou introuvable.');
      }
    } catch (error) {
      console.error(`✗ Erreur lors de la vérification: ${error}`);
    }
  }

  // ========== Commandes pour les attachements ==========

  public async attachFile(noteId: string, filePath: string): Promise<void> {
    const attachmentService = this.noteService.getAttachmentService();
    
    if (!attachmentService) {
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    try {
      const attachment = await attachmentService.attachFile(noteId, filePath);
      console.log('✓ Fichier attaché avec succès!');
      console.log(`ID: ${attachment.id}`);
      console.log(`Nom: ${attachment.fileName}`);
      console.log(`Type: ${attachment.type}`);
      console.log(`Taille: ${(attachment.size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'attachement: ${error}`);
    }
  }

  public listAttachments(noteId: string): void {
    const attachmentService = this.noteService.getAttachmentService();
    
    if (!attachmentService) {
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    const attachments = attachmentService.listAttachments(noteId);

    if (attachments.length === 0) {
      console.log(`Aucune pièce jointe pour la note "${noteId}".`);
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
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    try {
      const detached = await attachmentService.detachFile(noteId, attachmentId);
      
      if (detached) {
        console.log('✓ Fichier détaché avec succès!');
      } else {
        console.log('✗ Attachement introuvable ou ID de note incorrect.');
      }
    } catch (error) {
      console.error(`✗ Erreur lors du détachement: ${error}`);
    }
  }
}