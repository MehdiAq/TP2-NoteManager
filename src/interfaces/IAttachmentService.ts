export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  CODE = 'code',
  OTHER = 'other'
}

export interface IAttachment {
  id: string;
  noteId: string;
  fileName: string;
  originalPath: string;
  storedPath: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface IAttachmentData {
  id: string;
  noteId: string;
  fileName: string;
  originalPath: string;
  storedPath: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface IAttachmentService {
  /**
   * Attache un fichier à une note
   * @param noteId L'ID de la note
   * @param filePath Le chemin du fichier à attacher
   * @returns L'attachement créé
   */
  attachFile(noteId: string, filePath: string): Promise<IAttachment>;

  /**
   * Détache un fichier d'une note
   * @param noteId L'ID de la note
   * @param attachmentId L'ID de l'attachement
   * @returns true si le détachement a réussi
   */
  detachFile(noteId: string, attachmentId: string): Promise<boolean>;

  /**
   * Liste toutes les pièces jointes d'une note
   * @param noteId L'ID de la note
   * @returns La liste des attachements
   */
  listAttachments(noteId: string): IAttachment[];

  /**
   * Obtient un attachement par son ID
   * @param attachmentId L'ID de l'attachement
   * @returns L'attachement ou undefined
   */
  getAttachment(attachmentId: string): IAttachment | undefined;

  /**
   * Supprime tous les attachements d'une note
   * @param noteId L'ID de la note
   */
  deleteNoteAttachments(noteId: string): Promise<void>;
}
