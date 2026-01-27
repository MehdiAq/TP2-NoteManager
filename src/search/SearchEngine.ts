import { ISearchEngine } from '../interfaces/ISearchEngine';
import { INote } from '../interfaces/INote';

export class SearchEngine implements ISearchEngine {
  public search(notes: INote[], query: string): INote[] {
    const lowerQuery = query.toLowerCase();
    return notes.filter(note => note.matches(lowerQuery));
  }

  public searchByTag(notes: INote[], tag: string): INote[] {
    return notes.filter(note => note.hasTag(tag));
  }

  public searchByTitle(notes: INote[], title: string): INote[] {
    const lowerTitle = title.toLowerCase();
    return notes.filter(note => 
      note.getTitle().toLowerCase().includes(lowerTitle)
    );
  }

  public searchByContent(notes: INote[], content: string): INote[] {
    const lowerContent = content.toLowerCase();
    return notes.filter(note => 
      note.getContent().toLowerCase().includes(lowerContent)
    );
  }

  public searchMultipleTags(notes: INote[], tags: string[], matchAll: boolean = false): INote[] {
    if (matchAll) {
      return notes.filter(note => 
        tags.every(tag => note.hasTag(tag))
      );
    } else {
      return notes.filter(note => 
        tags.some(tag => note.hasTag(tag))
      );
    }
  }
}
