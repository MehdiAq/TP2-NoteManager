import * as fs from 'fs';
import { IStorage } from '../interfaces/IStorage';
import { INote, INoteData } from '../interfaces/INote';
import { Note } from '../models/Note';

export class JsonStorage implements IStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public load(): INote[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }

      const data = fs.readFileSync(this.filePath, 'utf-8');
      const parsed: { notes: INoteData[] } = JSON.parse(data);
      
      return parsed.notes.map(noteData => Note.fromJSON(noteData));
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      return [];
    }
  }

  public save(notes: INote[]): void {
    try {
      const data = {
        notes: notes.map(note => note.toJSON())
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error}`);
    }
  }

  public export(path: string, notes: INote[]): void {
    try {
      const data = {
        notes: notes.map(note => note.toJSON())
      };
      fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Erreur lors de l'export: ${error}`);
    }
  }

  public import(path: string): INote[] {
    try {
      const data = fs.readFileSync(path, 'utf-8');
      const parsed: { notes: INoteData[] } = JSON.parse(data);
      
      return parsed.notes.map(noteData => Note.fromJSON(noteData));
    } catch (error) {
      throw new Error(`Erreur lors de l'import: ${error}`);
    }
  }

  public getFilePath(): string {
    return this.filePath;
  }
}
