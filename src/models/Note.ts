import { INote, INoteData } from '../interfaces/INote';

export class Note implements INote {
  private id: string;
  private title: string;
  private content: string;
  private tags: string[];
  private createdAt: Date;
  private updatedAt: Date;

  constructor(title: string, content: string, tags: string[] = [], id?: string) {
    this.id = id || this.generateId();
    this.title = title;
    this.content = content;
    this.tags = [...tags];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getId(): string {
    return this.id;
  }

  public getTitle(): string {
    return this.title;
  }

  public getContent(): string {
    return this.content;
  }

  public getTags(): string[] {
    return [...this.tags];
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  public setTitle(title: string): void {
    this.title = title;
    this.updateTimestamp();
  }

  public setContent(content: string): void {
    this.content = content;
    this.updateTimestamp();
  }

  public addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updateTimestamp();
    }
  }

  public removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index !== -1) {
      this.tags.splice(index, 1);
      this.updateTimestamp();
    }
  }

  public setTags(tags: string[]): void {
    this.tags = [...tags];
    this.updateTimestamp();
  }

  public hasTag(tag: string): boolean {
    return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  public matches(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return (
      this.title.toLowerCase().includes(lowerQuery) ||
      this.content.toLowerCase().includes(lowerQuery) ||
      this.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  private updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  public toJSON(): INoteData {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      tags: [...this.tags],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public static fromJSON(data: INoteData): Note {
    const note = new Note(data.title, data.content, data.tags, data.id);
    note.createdAt = new Date(data.createdAt);
    note.updatedAt = new Date(data.updatedAt);
    return note;
  }
}
