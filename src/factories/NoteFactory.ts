import { Note } from '../models/Note';
import { INote } from '../interfaces/INote';

export class NoteFactory {
  public static createNote(title: string, content: string, tags: string[] = []): INote {
    return new Note(title, content, tags);
  }

  public static createNoteWithId(
    id: string,
    title: string,
    content: string,
    tags: string[] = []
  ): INote {
    return new Note(title, content, tags, id);
  }

  public static createEmptyNote(): INote {
    return new Note('', '');
  }
}
