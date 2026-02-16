import { IAttachmentService, IAttachment, IAttachmentData } from '../interfaces/IAttachmentService';
import { Attachment } from '../models/Attachment';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class AttachmentService implements IAttachmentService {
  private attachments: Map<string, Attachment>;
  private attachmentsDir: string;
  private metadataFile: string;

  constructor(baseDir: string = './data') {
    this.attachmentsDir = path.join(baseDir, 'attachments');
    this.metadataFile = path.join(baseDir, 'attachments-metadata.json');
    this.attachments = new Map();
    this.ensureDirectories();
    this.loadMetadata();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.attachmentsDir)) {
      fs.mkdirSync(this.attachmentsDir, { recursive: true });
    }
  }

  private loadMetadata(): void {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const data = fs.readFileSync(this.metadataFile, 'utf-8');
        const attachmentsData: IAttachmentData[] = JSON.parse(data);
        attachmentsData.forEach(data => {
          const attachment = Attachment.fromJSON(data);
          this.attachments.set(attachment.id, attachment);
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées des attachements:', error);
    }
  }

  private saveMetadata(): void {
    try {
      const attachmentsData = Array.from(this.attachments.values()).map(a => a.toJSON());
      fs.writeFileSync(this.metadataFile, JSON.stringify(attachmentsData, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des métadonnées des attachements:', error);
      throw error;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.cpp': 'text/x-c++',
      '.c': 'text/x-c',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private isSupportedFileType(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    const supportedExtensions = [
      // Images
      '.png', '.jpg', '.jpeg', '.gif', '.webp',
      // Documents
      '.pdf', '.txt', '.md',
      // Code
      '.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'
    ];
    return supportedExtensions.includes(ext);
  }

  public async attachFile(noteId: string, filePath: string): Promise<IAttachment> {
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier "${filePath}" n'existe pas`);
    }

    const fileName = path.basename(filePath);

    // Vérifier le type de fichier
    if (!this.isSupportedFileType(fileName)) {
      throw new Error(`Type de fichier non supporté: ${path.extname(fileName)}`);
    }

    // Obtenir les informations du fichier
    const stats = fs.statSync(filePath);
    const mimeType = this.getMimeType(filePath);

    // Générer un nom unique pour le stockage avec timestamp pour garantir l'unicité
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const hash = crypto.createHash('md5').update(noteId + fileName + timestamp + random).digest('hex');
    const ext = path.extname(fileName);
    const storedFileName = `${hash}${ext}`;
    const storedPath = path.join(this.attachmentsDir, storedFileName);

    // Copier le fichier
    fs.copyFileSync(filePath, storedPath);

    // Créer l'attachement
    const attachment = new Attachment(
      noteId,
      fileName,
      filePath,
      storedPath,
      stats.size,
      mimeType
    );

    this.attachments.set(attachment.id, attachment);
    this.saveMetadata();

    return attachment;
  }

  public async detachFile(noteId: string, attachmentId: string): Promise<boolean> {
    const attachment = this.attachments.get(attachmentId);
    
    if (!attachment || attachment.noteId !== noteId) {
      return false;
    }

    // Supprimer le fichier physique
    try {
      if (fs.existsSync(attachment.storedPath)) {
        fs.unlinkSync(attachment.storedPath);
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du fichier: ${error}`);
    }

    // Supprimer de la map
    this.attachments.delete(attachmentId);
    this.saveMetadata();

    return true;
  }

  public listAttachments(noteId: string): IAttachment[] {
    return Array.from(this.attachments.values())
      .filter(a => a.noteId === noteId);
  }

  public getAttachment(attachmentId: string): IAttachment | undefined {
    return this.attachments.get(attachmentId);
  }

  public async deleteNoteAttachments(noteId: string): Promise<void> {
    const noteAttachments = this.listAttachments(noteId);
    
    for (const attachment of noteAttachments) {
      await this.detachFile(noteId, attachment.id);
    }
  }

  // Méthode utilitaire pour les tests
  public getAttachmentsDir(): string {
    return this.attachmentsDir;
  }

  // Méthode utilitaire pour nettoyer (tests)
  public clearAll(): void {
    // Supprimer tous les fichiers
    Array.from(this.attachments.values()).forEach(attachment => {
      try {
        if (fs.existsSync(attachment.storedPath)) {
          fs.unlinkSync(attachment.storedPath);
        }
      } catch (error) {
        // Ignorer les erreurs de suppression
      }
    });

    this.attachments.clear();
    
    // Supprimer le fichier de métadonnées
    if (fs.existsSync(this.metadataFile)) {
      fs.unlinkSync(this.metadataFile);
    }
  }
}