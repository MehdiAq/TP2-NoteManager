import { SearchEngine } from '../src/search/SearchEngine';
import { Note } from '../src/models/Note';
import { INote } from '../src/interfaces/INote';

describe('SearchEngine - Performance Tests', () => {
  let searchEngine: SearchEngine;
  let notes: INote[];

  /**
   * Génère un grand nombre de notes pour les tests de performance
   */
  const generateNotes = (count: number): INote[] => {
    const generatedNotes: INote[] = [];
    const tags = ['javascript', 'typescript', 'python', 'java', 'react', 'nodejs', 'angular', 'vue'];
    const words = ['code', 'test', 'function', 'class', 'method', 'variable', 'constant', 'module'];

    for (let i = 0; i < count; i++) {
      const title = `Note ${i} - ${words[i % words.length]} ${tags[i % tags.length]}`;
      const content = `This is the content of note ${i}. It contains various keywords like ${words[(i + 1) % words.length]}, ${words[(i + 2) % words.length]}, and ${words[(i + 3) % words.length]}. The note discusses topics related to programming and software development.`;
      const noteTags = [
        tags[i % tags.length],
        tags[(i + 1) % tags.length]
      ];

      generatedNotes.push(new Note(title, content, noteTags, `note-${i}`));
    }

    return generatedNotes;
  };

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  const measureExecutionTime = (fn: () => void): number => {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  };

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('1. Performance avec 100 notes (baseline)', () => {
    beforeEach(() => {
      notes = generateNotes(100);
      searchEngine.buildIndexes(notes);
    });

    it('devrait rechercher par mot-clé en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        searchEngine.search(notes, 'code');
      });

      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher par tag en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        searchEngine.searchByTag(notes, 'javascript');
      });

      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher par contenu en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        searchEngine.searchByContent(notes, 'programming');
      });

      expect(time).toBeLessThan(100);
    });
  });

  describe('2. Performance avec 1000 notes (exigence)', () => {
    beforeEach(() => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);
    });

    it('devrait rechercher par mot-clé en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.search(notes, 'code');
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche par mot-clé (1000 notes): ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher par tag en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.searchByTag(notes, 'javascript');
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche par tag (1000 notes): ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher par contenu en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.searchByContent(notes, 'programming');
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche par contenu (1000 notes): ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher par titre en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.searchByTitle(notes, 'Note');
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche par titre (1000 notes): ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });

    it('devrait rechercher avec plusieurs tags en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.searchMultipleTags(notes, ['javascript', 'typescript'], false);
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche multi-tags (1000 notes): ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });
  });

  describe('3. Performance avec 5000 notes (test de charge)', () => {
    beforeEach(() => {
      notes = generateNotes(5000);
      searchEngine.buildIndexes(notes);
    });

    it('devrait construire les index en temps raisonnable', () => {
      const newSearchEngine = new SearchEngine();
      
      const time = measureExecutionTime(() => {
        newSearchEngine.buildIndexes(notes);
      });

      console.log(`Construction des index (5000 notes): ${time.toFixed(2)}ms`);
      // L'indexation peut prendre plus de temps, mais doit rester raisonnable
      expect(time).toBeLessThan(500);
    });

    it('devrait rechercher rapidement même avec un grand nombre de notes', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.search(notes, 'function');
        expect(results.length).toBeGreaterThan(0);
      });

      console.log(`Recherche (5000 notes): ${time.toFixed(2)}ms`);
      // Avec 5000 notes, on tolère un peu plus de temps
      expect(time).toBeLessThan(150);
    });
  });

  describe('4. Efficacité du cache', () => {
    beforeEach(() => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);
    });

    it('devrait être plus rapide lors d\'une recherche répétée (cache)', () => {
      // Première recherche (non cachée)
      const time1 = measureExecutionTime(() => {
        searchEngine.search(notes, 'programming');
      });

      // Deuxième recherche (cachée)
      const time2 = measureExecutionTime(() => {
        searchEngine.search(notes, 'programming');
      });

      console.log(`Première recherche: ${time1.toFixed(2)}ms, Deuxième (cachée): ${time2.toFixed(2)}ms`);
      // La recherche cachée devrait être beaucoup plus rapide
      expect(time2).toBeLessThan(time1);
      expect(time2).toBeLessThan(10); // Devrait être quasi instantanée
    });

    it('devrait retourner les mêmes résultats avec le cache', () => {
      const results1 = searchEngine.search(notes, 'code');
      const results2 = searchEngine.search(notes, 'code');

      expect(results1.length).toBe(results2.length);
      expect(results1.map(n => n.getId())).toEqual(results2.map(n => n.getId()));
    });
  });

  describe('5. Comparaison avant/après optimisation', () => {
    beforeEach(() => {
      notes = generateNotes(1000);
    });

    it('devrait démontrer l\'amélioration avec les index', () => {
      // Recherche sans index (simulation avec filter)
      const timeWithoutIndex = measureExecutionTime(() => {
        notes.filter(note => note.matches('code'));
      });

      // Recherche avec index
      searchEngine.buildIndexes(notes);
      const timeWithIndex = measureExecutionTime(() => {
        searchEngine.search(notes, 'code');
      });

      console.log(`Sans index: ${timeWithoutIndex.toFixed(2)}ms, Avec index: ${timeWithIndex.toFixed(2)}ms`);
      console.log(`Amélioration: ${((timeWithoutIndex - timeWithIndex) / timeWithoutIndex * 100).toFixed(1)}%`);

      // L'optimisation devrait apporter un gain
      expect(timeWithIndex).toBeLessThan(timeWithoutIndex);
    });
  });

  describe('6. Tests de recherche par tag optimisée', () => {
    beforeEach(() => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);
    });

    it('devrait être O(1) pour la recherche par tag avec index', () => {
      // Plusieurs recherches pour différents tags
      const times: number[] = [];

      ['javascript', 'typescript', 'python', 'java', 'react'].forEach(tag => {
        const time = measureExecutionTime(() => {
          searchEngine.searchByTag(notes, tag);
        });
        times.push(time);
      });

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Temps moyen de recherche par tag: ${avgTime.toFixed(2)}ms`);

      // Toutes les recherches devraient être rapides et similaires (O(1))
      times.forEach(time => {
        expect(time).toBeLessThan(100);
      });
    });
  });

  describe('7. Tests de scalabilité', () => {
    it('devrait maintenir de bonnes performances avec différentes tailles de dataset', () => {
      const sizes = [100, 500, 1000, 2000];
      const results: { size: number; time: number }[] = [];

      sizes.forEach(size => {
        const testNotes = generateNotes(size);
        const engine = new SearchEngine();
        engine.buildIndexes(testNotes);

        const time = measureExecutionTime(() => {
          engine.search(testNotes, 'code');
        });

        results.push({ size, time });
        console.log(`${size} notes: ${time.toFixed(2)}ms`);
      });

      // Avec les index, la croissance du temps devrait être sous-linéaire
      results.forEach(result => {
        expect(result.time).toBeLessThan(100);
      });
    });
  });

  describe('8. Tests de robustesse avec recherches complexes', () => {
    beforeEach(() => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);
    });

    it('devrait gérer des recherches avec plusieurs mots en moins de 100ms', () => {
      const time = measureExecutionTime(() => {
        searchEngine.search(notes, 'code function test');
      });

      console.log(`Recherche multi-mots: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100);
    });

    it('devrait gérer des recherches vides efficacement', () => {
      const time = measureExecutionTime(() => {
        searchEngine.search(notes, '');
      });

      expect(time).toBeLessThan(100);
    });

    it('devrait gérer des recherches qui ne correspondent à rien', () => {
      const time = measureExecutionTime(() => {
        const results = searchEngine.search(notes, 'xyzabc123nonexistent');
        expect(results.length).toBe(0);
      });

      expect(time).toBeLessThan(100);
    });
  });

  describe('9. Validation de l\'exigence de performance', () => {
    it('EXIGENCE: Recherche par mot-clé < 100ms pour 1000 notes', () => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const time = measureExecutionTime(() => {
          searchEngine.search(notes, 'code');
        });
        times.push(time);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Moyenne sur ${iterations} recherches: ${avgTime.toFixed(2)}ms`);
      console.log(`Temps maximum: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(100);
    });

    it('EXIGENCE: Recherche par tag < 100ms pour 1000 notes', () => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const time = measureExecutionTime(() => {
          searchEngine.searchByTag(notes, 'javascript');
        });
        times.push(time);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Moyenne sur ${iterations} recherches par tag: ${avgTime.toFixed(2)}ms`);
      console.log(`Temps maximum: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(100);
    });

    it('EXIGENCE: Recherche par contenu < 100ms pour 1000 notes', () => {
      notes = generateNotes(1000);
      searchEngine.buildIndexes(notes);

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const time = measureExecutionTime(() => {
          searchEngine.searchByContent(notes, 'programming');
        });
        times.push(time);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Moyenne sur ${iterations} recherches par contenu: ${avgTime.toFixed(2)}ms`);
      console.log(`Temps maximum: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(100);
    });
  });
});
