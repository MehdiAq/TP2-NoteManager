import { ICommand } from './ICommand';
import { IAttachmentService } from '../interfaces/IAttachmentService';

export class AttachFileCommand implements ICommand {
  constructor(private attachmentService: IAttachmentService | undefined) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    if (!this.attachmentService) {
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    const noteId = args.noteId as string;
    const filePath = args.filePath as string;

    try {
      const attachment = await this.attachmentService.attachFile(noteId, filePath);
      console.log('✓ Fichier attaché avec succès!');
      console.log(`ID: ${attachment.id}`);
      console.log(`Nom: ${attachment.fileName}`);
      console.log(`Type: ${attachment.type}`);
      console.log(`Taille: ${(attachment.size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'attachement: ${error}`);
    }
  }
}

export class ListAttachmentsCommand implements ICommand {
  constructor(private attachmentService: IAttachmentService | undefined) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    if (!this.attachmentService) {
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    const noteId = args.noteId as string;
    const attachments = this.attachmentService.listAttachments(noteId);

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
}

export class DetachFileCommand implements ICommand {
  constructor(private attachmentService: IAttachmentService | undefined) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    if (!this.attachmentService) {
      console.log('✗ Le service d\'attachements n\'est pas configuré.');
      return;
    }

    const noteId = args.noteId as string;
    const attachmentId = args.attachmentId as string;

    try {
      const detached = await this.attachmentService.detachFile(noteId, attachmentId);

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
