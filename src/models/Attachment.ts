import { IAttachment, IAttachmentData, AttachmentType } from '../interfaces/IAttachmentService';
import * as path from 'path';

export class Attachment implements IAttachment {
  public readonly id: string;
  public readonly noteId: string;
  public readonly fileName: string;
  public readonly originalPath: string;
  public readonly storedPath: string;
  public readonly type: AttachmentType;
  public readonly size: number;
  public readonly mimeType: string;
  public readonly createdAt: Date;

  constructor(
    noteId: string,
    fileName: string,
    originalPath: string,
    storedPath: string,
    size: number,
    mimeType: string,
    id?: string
  ) {
    this.id = id || this.generateId();
    this.noteId = noteId;
    this.fileName = fileName;
    this.originalPath = originalPath;
    this.storedPath = storedPath;
    this.type = this.determineType(fileName, mimeType);
    this.size = size;
    this.mimeType = mimeType;
    this.createdAt = new Date();
  }

  private generateId(): string {
    return `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineType(fileName: string, mimeType: string): AttachmentType {
    const ext = path.extname(fileName).toLowerCase();
    
    // Images
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) || 
        mimeType.startsWith('image/')) {
      return AttachmentType.IMAGE;
    }
    
    // Code - vérifier AVANT les documents
    if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.jsx', '.tsx'].includes(ext)) {
      return AttachmentType.CODE;
    }
    
    // Documents
    if (['.pdf', '.txt', '.doc', '.docx', '.md'].includes(ext) || 
        mimeType.includes('pdf') || mimeType.includes('text')) {
      return AttachmentType.DOCUMENT;
    }
    
    return AttachmentType.OTHER;
  }

  public toJSON(): IAttachmentData {
    return {
      id: this.id,
      noteId: this.noteId,
      fileName: this.fileName,
      originalPath: this.originalPath,
      storedPath: this.storedPath,
      type: this.type,
      size: this.size,
      mimeType: this.mimeType,
      createdAt: this.createdAt
    };
  }

  public static fromJSON(data: IAttachmentData): Attachment {
    const attachment = new Attachment(
      data.noteId,
      data.fileName,
      data.originalPath,
      data.storedPath,
      data.size,
      data.mimeType,
      data.id
    );
    (attachment as any).createdAt = new Date(data.createdAt);
    return attachment;
  }
}