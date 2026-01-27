import { IRepository } from '../interfaces/IRepository';
import { INote } from '../interfaces/INote';

export class NoteRepository implements IRepository {
  private notes: Map<string, INote>;

  constructor() {
    this.notes = new Map<string, INote>();
  }

  public add(note: INote): void {
    this.notes.set(note.getId(), note);
  }

  public remove(id: string): boolean {
    return this.notes.delete(id);
  }

  public findById(id: string): INote | undefined {
    return this.notes.get(id);
  }

  public findAll(): INote[] {
    return Array.from(this.notes.values());
  }

  public update(id: string, note: INote): boolean {
    if (!this.notes.has(id)) {
      return false;
    }
    this.notes.set(id, note);
    return true;
  }

  public clear(): void {
    this.notes.clear();
  }

  public count(): number {
    return this.notes.size;
  }

  public exists(id: string): boolean {
    return this.notes.has(id);
  }
}
