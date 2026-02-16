import { ISearchEngine } from '../interfaces/ISearchEngine';
import { INote } from '../interfaces/INote';

/**
 * SearchEngine optimisé avec des index pour améliorer les performances.
 * 
 * Optimisations:
 * - Index inversé pour les mots-clés (recherche de contenu)
 * - HashMap pour les tags (recherche par tag)
 * - HashMap pour les titres (recherche par titre)
 * - Cache des résultats de recherche récents
 */
export class SearchEngine implements ISearchEngine {
  private tagIndex: Map<string, Set<string>>; // tag -> Set of note IDs
  private wordIndex: Map<string, Set<string>>; // word -> Set of note IDs
  private titleIndex: Map<string, Set<string>>; // title word -> Set of note IDs
  private notesMap: Map<string, INote>; // noteId -> Note
  private searchCache: Map<string, INote[]>; // cache key -> results
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.tagIndex = new Map();
    this.wordIndex = new Map();
    this.titleIndex = new Map();
    this.notesMap = new Map();
    this.searchCache = new Map();
  }

  /**
   * Construit les index à partir d'une liste de notes.
   * Cette méthode doit être appelée chaque fois que les notes changent.
   */
  public buildIndexes(notes: INote[]): void {
    // Réinitialiser les index
    this.tagIndex.clear();
    this.wordIndex.clear();
    this.titleIndex.clear();
    this.notesMap.clear();
    this.searchCache.clear();

    notes.forEach(note => {
      const noteId = note.getId();
      this.notesMap.set(noteId, note);

      // Indexer les tags
      note.getTags().forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        if (!this.tagIndex.has(normalizedTag)) {
          this.tagIndex.set(normalizedTag, new Set());
        }
        this.tagIndex.get(normalizedTag)!.add(noteId);
      });

      // Indexer les mots du contenu
      const contentWords = this.extractWords(note.getContent());
      contentWords.forEach(word => {
        if (!this.wordIndex.has(word)) {
          this.wordIndex.set(word, new Set());
        }
        this.wordIndex.get(word)!.add(noteId);
      });

      // Indexer les mots du titre
      const titleWords = this.extractWords(note.getTitle());
      titleWords.forEach(word => {
        if (!this.titleIndex.has(word)) {
          this.titleIndex.set(word, new Set());
        }
        this.titleIndex.get(word)!.add(noteId);
      });
    });
  }

  /**
   * Extrait les mots d'un texte (normalisation et tokenisation)
   */
  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Obtient une clé de cache pour une recherche
   */
  private getCacheKey(type: string, query: string): string {
    return `${type}:${query}`;
  }

  /**
   * Ajoute un résultat au cache
   */
  private addToCache(key: string, results: INote[]): void {
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      // Supprimer la première entrée (FIFO simple)
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey !== undefined) {
        this.searchCache.delete(firstKey);
      }
    }
    this.searchCache.set(key, results);
  }

  /**
   * Recherche générale (titre, contenu, tags)
   */
  public search(notes: INote[], query: string): INote[] {
    const cacheKey = this.getCacheKey('general', query);
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Si les index ne sont pas construits, les construire
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const lowerQuery = query.toLowerCase();
    const queryWords = this.extractWords(query);
    const matchedNoteIds = new Set<string>();

    // Recherche par mots-clés dans le contenu et le titre
    queryWords.forEach(word => {
      // Chercher dans le contenu
      if (this.wordIndex.has(word)) {
        this.wordIndex.get(word)!.forEach(id => matchedNoteIds.add(id));
      }
      // Chercher dans le titre
      if (this.titleIndex.has(word)) {
        this.titleIndex.get(word)!.forEach(id => matchedNoteIds.add(id));
      }
    });

    // Chercher dans les tags
    this.tagIndex.forEach((noteIds, tag) => {
      if (tag.includes(lowerQuery)) {
        noteIds.forEach(id => matchedNoteIds.add(id));
      }
    });

    // Convertir les IDs en notes
    const results = Array.from(matchedNoteIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => note !== undefined);

    this.addToCache(cacheKey, results);
    return results;
  }

  /**
   * Recherche par tag (optimisée avec l'index)
   */
  public searchByTag(notes: INote[], tag: string): INote[] {
    const cacheKey = this.getCacheKey('tag', tag);
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Si les index ne sont pas construits, les construire
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const normalizedTag = tag.toLowerCase();
    const noteIds = this.tagIndex.get(normalizedTag) || new Set();
    
    const results = Array.from(noteIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => note !== undefined);

    this.addToCache(cacheKey, results);
    return results;
  }

  /**
   * Recherche par titre (optimisée avec l'index)
   */
  public searchByTitle(notes: INote[], title: string): INote[] {
    const cacheKey = this.getCacheKey('title', title);
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Si les index ne sont pas construits, les construire
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const titleWords = this.extractWords(title);
    const matchedNoteIds = new Set<string>();

    titleWords.forEach(word => {
      if (this.titleIndex.has(word)) {
        this.titleIndex.get(word)!.forEach(id => matchedNoteIds.add(id));
      }
    });

    // Filtrer pour ne garder que les notes dont le titre contient vraiment la requête
    const lowerTitle = title.toLowerCase();
    const results = Array.from(matchedNoteIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => 
        note !== undefined && note.getTitle().toLowerCase().includes(lowerTitle)
      );

    this.addToCache(cacheKey, results);
    return results;
  }

  /**
   * Recherche par contenu (optimisée avec l'index)
   */
  public searchByContent(notes: INote[], content: string): INote[] {
    const cacheKey = this.getCacheKey('content', content);
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Si les index ne sont pas construits, les construire
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const contentWords = this.extractWords(content);
    const matchedNoteIds = new Set<string>();

    contentWords.forEach(word => {
      if (this.wordIndex.has(word)) {
        this.wordIndex.get(word)!.forEach(id => matchedNoteIds.add(id));
      }
    });

    // Filtrer pour ne garder que les notes dont le contenu contient vraiment la requête
    const lowerContent = content.toLowerCase();
    const results = Array.from(matchedNoteIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => 
        note !== undefined && note.getContent().toLowerCase().includes(lowerContent)
      );

    this.addToCache(cacheKey, results);
    return results;
  }

  /**
   * Recherche par plusieurs tags (optimisée avec l'index)
   */
  public searchMultipleTags(notes: INote[], tags: string[], matchAll: boolean = false): INote[] {
    const cacheKey = this.getCacheKey(
      `multitag-${matchAll ? 'all' : 'any'}`,
      tags.join(',')
    );
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Si les index ne sont pas construits, les construire
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }

    const normalizedTags = tags.map(t => t.toLowerCase());
    const tagSets = normalizedTags
      .map(tag => this.tagIndex.get(tag) || new Set<string>());

    let matchedNoteIds: Set<string>;

    if (matchAll) {
      // Intersection de tous les sets
      if (tagSets.length === 0) {
        matchedNoteIds = new Set();
      } else {
        matchedNoteIds = new Set(tagSets[0]);
        for (let i = 1; i < tagSets.length; i++) {
          matchedNoteIds = new Set(
            Array.from(matchedNoteIds).filter(id => tagSets[i].has(id))
          );
        }
      }
    } else {
      // Union de tous les sets
      matchedNoteIds = new Set();
      tagSets.forEach(set => {
        set.forEach(id => matchedNoteIds.add(id));
      });
    }

    const results = Array.from(matchedNoteIds)
      .map(id => this.notesMap.get(id))
      .filter((note): note is INote => note !== undefined);

    this.addToCache(cacheKey, results);
    return results;
  }

  /**
   * Invalide le cache (à appeler après modification des notes)
   */
  public invalidateCache(): void {
    this.searchCache.clear();
  }
}