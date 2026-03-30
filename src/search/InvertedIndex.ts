export class InvertedIndex {
  private index: Map<string, Set<string>> = new Map();

  addEntry(key: string, noteId: string): void {
    if (!this.index.has(key)) {
      this.index.set(key, new Set());
    }
    this.index.get(key)!.add(noteId);
  }

  getNoteIds(key: string): Set<string> {
    return this.index.get(key) || new Set();
  }

  getMatchingIds(predicate: (key: string) => boolean): Set<string> {
    const ids = new Set<string>();
    this.index.forEach((noteIds, key) => {
      if (predicate(key)) {
        noteIds.forEach(id => ids.add(id));
      }
    });
    return ids;
  }

  clear(): void {
    this.index.clear();
  }
}
