import { ISearchEngine } from '../interfaces/ISearchEngine';
import { INote } from '../interfaces/INote';
import { InvertedIndex } from './InvertedIndex';
import { LRUCache } from './LRUCache';

export class SearchEngine implements ISearchEngine {
  private tagIndex = new InvertedIndex();
  private wordIndex = new InvertedIndex();
  private titleIndex = new InvertedIndex();
  private notesMap: Map<string, INote> = new Map();
  private cache = new LRUCache<string, INote[]>(100);

  public buildIndexes(notes: INote[]): void {
    this.tagIndex.clear();
    this.wordIndex.clear();
    this.titleIndex.clear();
    this.notesMap.clear();
    this.cache.clear();

    notes.forEach(note => {
      const noteId = note.getId();
      this.notesMap.set(noteId, note);

      note.getTags().forEach(tag =>
        this.tagIndex.addEntry(tag.toLowerCase(), noteId));

      this.extractWords(note.getContent()).forEach(word =>
        this.wordIndex.addEntry(word, noteId));

      this.extractWords(note.getTitle()).forEach(word =>
        this.titleIndex.addEntry(word, noteId));
    });
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private cachedSearch(
    cacheKey: string,
    notes: INote[],
    searchFn: () => Set<string>
  ): INote[] {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const matchedIds = searchFn();
    const results = Array.from(matchedIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => note !== undefined);

    this.cache.set(cacheKey, results);
    return results;
  }

  public search(notes: INote[], query: string): INote[] {
    return this.cachedSearch(`general:${query}`, notes, () => {
      const queryWords = this.extractWords(query);
      const lowerQuery = query.toLowerCase();
      const matchedIds = new Set<string>();

      queryWords.forEach(word => {
        this.wordIndex.getNoteIds(word).forEach(id => matchedIds.add(id));
        this.titleIndex.getNoteIds(word).forEach(id => matchedIds.add(id));
      });

      this.tagIndex.getMatchingIds(tag => tag.includes(lowerQuery))
        .forEach(id => matchedIds.add(id));

      return matchedIds;
    });
  }

  public searchByTag(notes: INote[], tag: string): INote[] {
    return this.cachedSearch(`tag:${tag}`, notes, () =>
      this.tagIndex.getNoteIds(tag.toLowerCase()));
  }

  public searchByTitle(notes: INote[], title: string): INote[] {
    return this.cachedSearch(`title:${title}`, notes, () => {
      const titleWords = this.extractWords(title);
      const matchedIds = new Set<string>();

      titleWords.forEach(word =>
        this.titleIndex.getNoteIds(word).forEach(id => matchedIds.add(id)));

      const lowerTitle = title.toLowerCase();
      const filtered = new Set<string>();
      matchedIds.forEach(id => {
        const note = this.notesMap.get(id);
        if (note && note.getTitle().toLowerCase().includes(lowerTitle)) {
          filtered.add(id);
        }
      });
      return filtered;
    });
  }

  public searchByContent(notes: INote[], content: string): INote[] {
    return this.cachedSearch(`content:${content}`, notes, () => {
      const contentWords = this.extractWords(content);
      const matchedIds = new Set<string>();

      contentWords.forEach(word =>
        this.wordIndex.getNoteIds(word).forEach(id => matchedIds.add(id)));

      const lowerContent = content.toLowerCase();
      const filtered = new Set<string>();
      matchedIds.forEach(id => {
        const note = this.notesMap.get(id);
        if (note && note.getContent().toLowerCase().includes(lowerContent)) {
          filtered.add(id);
        }
      });
      return filtered;
    });
  }

  public searchMultipleTags(notes: INote[], tags: string[], matchAll: boolean = false): INote[] {
    const cacheKey = `multitag-${matchAll ? 'all' : 'any'}:${tags.join(',')}`;

    return this.cachedSearch(cacheKey, notes, () => {
      const normalizedTags = tags.map(t => t.toLowerCase());
      const tagSets = normalizedTags.map(tag => this.tagIndex.getNoteIds(tag));

      if (matchAll) {
        if (tagSets.length === 0) return new Set<string>();
        let result = new Set(tagSets[0]);
        for (let i = 1; i < tagSets.length; i++) {
          result = new Set(Array.from(result).filter(id => tagSets[i].has(id)));
        }
        return result;
      } else {
        const result = new Set<string>();
        tagSets.forEach(set => set.forEach(id => result.add(id)));
        return result;
      }
    });
  }

  public invalidateCache(): void {
    this.cache.clear();
  }
}
