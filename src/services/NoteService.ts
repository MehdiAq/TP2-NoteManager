import { INote } from '../interfaces/INote';
import { IRepository } from '../interfaces/IRepository';
import { IStorage } from '../interfaces/IStorage';
import { ISearchEngine } from '../interfaces/ISearchEngine';
import { NoteFactory } from '../factories/NoteFactory';

export class NoteService {
  private repository: IRepository;
  private storage: IStorage;
  private searchEngine: ISearchEngine;

  constructor(
    repository: IRepository,
    storage: IStorage,
    searchEngine: ISearchEngine
  ) {
    this.repository = repository;
    this.storage = storage;
    this.searchEngine = searchEngine;
    this.loadNotes();
  }

  private loadNotes(): void {
    const notes = this.storage.load();
    notes.forEach(note => this.repository.add(note));
  }

  private persist(): void {
    const notes = this.repository.findAll();
    this.storage.save(notes);
  }

  public createNote(title: string, content: string, tags: string[] = []): INote {
    const note = NoteFactory.createNote(title, content, tags);
    this.repository.add(note);
    this.persist();
    return note;
  }

  public deleteNote(id: string): boolean {
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
}