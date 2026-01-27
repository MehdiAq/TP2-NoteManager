import * as fs from 'fs';
import * as path from 'path';
import { Note } from '../src/models/Note';
import { NoteRepository } from '../src/repositories/NoteRepository';
import { JsonStorage } from '../src/storage/JsonStorage';
import { SearchEngine } from '../src/search/SearchEngine';
import { NoteService } from '../src/services/NoteService';
import { NoteFactory } from '../src/factories/NoteFactory';

describe('Architecture Orientée Objet - Tests Fonctionnels', () => {
  const testDataPath = path.join(__dirname, 'test-notes.json');
  const exportPath = path.join(__dirname, 'export-notes.json');
  let service: NoteService;

  beforeEach(() => {
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }

    const repository = new NoteRepository();
    const storage = new JsonStorage(testDataPath);
    const searchEngine = new SearchEngine();
    service = new NoteService(repository, storage, searchEngine);
  });

  afterEach(() => {
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  describe('Fonctionnalité: Créer des notes', () => {
    test('Doit créer une note avec titre et contenu', () => {
      const note = service.createNote('Ma première note', 'Contenu de la note');

      expect(note).toBeDefined();
      expect(note.getId()).toBeDefined();
      expect(note.getTitle()).toBe('Ma première note');
      expect(note.getContent()).toBe('Contenu de la note');
      expect(note.getTags()).toEqual([]);
      expect(note.getCreatedAt()).toBeInstanceOf(Date);
      expect(note.getUpdatedAt()).toBeInstanceOf(Date);
    });

    test('Doit créer une note avec des tags', () => {
      const note = service.createNote('Note avec tags', 'Contenu', ['travail', 'important']);

      expect(note.getTags()).toEqual(['travail', 'important']);
      expect(note.getTags().length).toBe(2);
    });

    test('Doit créer plusieurs notes avec des IDs uniques', () => {
      const note1 = service.createNote('Note 1', 'Contenu 1');
      const note2 = service.createNote('Note 2', 'Contenu 2');
      const note3 = service.createNote('Note 3', 'Contenu 3');

      expect(note1.getId()).not.toBe(note2.getId());
      expect(note2.getId()).not.toBe(note3.getId());
      expect(note1.getId()).not.toBe(note3.getId());
    });

    test('Doit persister les notes créées', () => {
      service.createNote('Note persistée', 'Contenu persisté');

      expect(fs.existsSync(testDataPath)).toBe(true);

      const repository = new NoteRepository();
      const storage = new JsonStorage(testDataPath);
      const searchEngine = new SearchEngine();
      const newService = new NoteService(repository, storage, searchEngine);
      const notes = newService.getAllNotes();

      expect(notes.length).toBe(1);
      expect(notes[0].getTitle()).toBe('Note persistée');
    });
  });

  describe('Fonctionnalité: Afficher (lister) des notes', () => {
    test('Doit retourner une liste vide quand aucune note existe', () => {
      const notes = service.getAllNotes();

      expect(notes).toEqual([]);
      expect(notes.length).toBe(0);
    });

    test('Doit lister toutes les notes créées', () => {
      service.createNote('Note 1', 'Contenu 1');
      service.createNote('Note 2', 'Contenu 2');
      service.createNote('Note 3', 'Contenu 3');

      const notes = service.getAllNotes();

      expect(notes.length).toBe(3);
      expect(notes[0].getTitle()).toBe('Note 1');
      expect(notes[1].getTitle()).toBe('Note 2');
      expect(notes[2].getTitle()).toBe('Note 3');
    });

    test('Doit récupérer une note spécifique par son ID', () => {
      const created = service.createNote('Note spécifique', 'Contenu spécifique');
      const found = service.getNoteById(created.getId());

      expect(found).toBeDefined();
      expect(found?.getId()).toBe(created.getId());
      expect(found?.getTitle()).toBe('Note spécifique');
    });

    test('Doit retourner undefined pour un ID inexistant', () => {
      const found = service.getNoteById('id_inexistant');

      expect(found).toBeUndefined();
    });
  });

  describe('Fonctionnalité: Associer des étiquettes (tags)', () => {
    test('Doit créer une note avec plusieurs tags', () => {
      const note = service.createNote('Note taggée', 'Contenu', ['urgent', 'travail', 'projet-x']);

      expect(note.getTags()).toContain('urgent');
      expect(note.getTags()).toContain('travail');
      expect(note.getTags()).toContain('projet-x');
      expect(note.getTags().length).toBe(3);
    });

    test('Doit filtrer les notes par tag', () => {
      service.createNote('Note 1', 'Contenu 1', ['urgent']);
      service.createNote('Note 2', 'Contenu 2', ['travail']);
      service.createNote('Note 3', 'Contenu 3', ['urgent', 'travail']);

      const urgentNotes = service.getNotesByTag('urgent');
      const travailNotes = service.getNotesByTag('travail');

      expect(urgentNotes.length).toBe(2);
      expect(travailNotes.length).toBe(2);
    });

    test('Doit être insensible à la casse lors de la recherche par tag', () => {
      service.createNote('Note', 'Contenu', ['Urgent']);

      const results = service.getNotesByTag('urgent');

      expect(results.length).toBe(1);
    });

    test('Doit retourner une liste vide pour un tag inexistant', () => {
      service.createNote('Note', 'Contenu', ['tag1']);

      const results = service.getNotesByTag('tag_inexistant');

      expect(results.length).toBe(0);
    });

    test('Doit pouvoir modifier les tags d\'une note existante', () => {
      const note = service.createNote('Note', 'Contenu', ['tag1']);
      const updated = service.updateNote(note.getId(), { tags: ['tag2', 'tag3'] });

      expect(updated).toBeDefined();
      expect(updated?.getTags()).toEqual(['tag2', 'tag3']);
      expect(updated?.getTags()).not.toContain('tag1');
    });
  });

  describe('Fonctionnalité: Rechercher des notes', () => {
    beforeEach(() => {
      service.createNote('Réunion client', 'Discuter du projet X', ['travail', 'client']);
      service.createNote('Liste de courses', 'Acheter du pain et du lait', ['personnel']);
      service.createNote('Idée projet', 'Créer une app mobile', ['travail', 'projet']);
    });

    test('Doit rechercher dans les titres', () => {
      const results = service.searchNotes('projet');

      expect(results.length).toBe(2);
      expect(results.some(n => n.getTitle().includes('projet'))).toBe(true);
    });

    test('Doit rechercher dans le contenu', () => {
      const results = service.searchNotes('pain');

      expect(results.length).toBe(1);
      expect(results[0].getContent()).toContain('pain');
    });

    test('Doit rechercher dans les tags', () => {
      const results = service.searchNotes('travail');

      expect(results.length).toBe(2);
    });

    test('Doit être insensible à la casse', () => {
      const results1 = service.searchNotes('PROJET');
      const results2 = service.searchNotes('projet');

      expect(results1.length).toBe(results2.length);
    });

    test('Doit retourner une liste vide si aucune correspondance', () => {
      const results = service.searchNotes('xyz123nonexistant');

      expect(results.length).toBe(0);
    });

    test('Doit rechercher des mots partiels', () => {
      const results = service.searchNotes('cour');

      expect(results.length).toBe(1);
      expect(results[0].getTitle()).toContain('courses');
    });
  });

  describe('Fonctionnalité: Sauvegarder (exporter) les notes', () => {
    beforeEach(() => {
      service.createNote('Note 1', 'Contenu 1', ['tag1']);
      service.createNote('Note 2', 'Contenu 2', ['tag2']);
    });

    test('Doit exporter les notes dans un fichier JSON', () => {
      service.exportNotes(exportPath);

      expect(fs.existsSync(exportPath)).toBe(true);

      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      expect(exported.notes).toBeDefined();
      expect(exported.notes.length).toBe(2);
    });

    test('Les notes exportées doivent contenir toutes les propriétés', () => {
      service.exportNotes(exportPath);

      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      const note = exported.notes[0];

      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('title');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('tags');
      expect(note).toHaveProperty('createdAt');
      expect(note).toHaveProperty('updatedAt');
    });

    test('Doit pouvoir importer des notes depuis un fichier exporté', () => {
      service.exportNotes(exportPath);

      const repository = new NoteRepository();
      const storage = new JsonStorage(path.join(__dirname, 'new-test.json'));
      const searchEngine = new SearchEngine();
      const newService = new NoteService(repository, storage, searchEngine);
      newService.importNotes(exportPath);

      const importedNotes = newService.getAllNotes();

      expect(importedNotes.length).toBe(2);
      expect(importedNotes[0].getTitle()).toBe('Note 1');
      expect(importedNotes[1].getTitle()).toBe('Note 2');

      fs.unlinkSync(path.join(__dirname, 'new-test.json'));
    });

    test('Doit pouvoir fusionner des notes importées', () => {
      service.exportNotes(exportPath);

      service.createNote('Note 3', 'Contenu 3');
      service.importNotes(exportPath, true);

      const notes = service.getAllNotes();

      // Avec la fusion améliorée, les notes importées reçoivent de nouveaux IDs
      // Donc: 2 notes initiales + 1 note ajoutée + 2 notes importées = 5 notes
      expect(notes.length).toBe(5);
    });

    test('L\'import sans fusion doit remplacer toutes les notes', () => {
      service.exportNotes(exportPath);

      service.createNote('Note 3', 'Contenu 3');
      service.createNote('Note 4', 'Contenu 4');

      service.importNotes(exportPath, false);

      const notes = service.getAllNotes();

      expect(notes.length).toBe(2);
    });
  });

  describe('Tests des classes individuelles', () => {
    test('Note: Doit gérer les tags correctement', () => {
      const note = new Note('Test', 'Contenu');

      note.addTag('tag1');
      expect(note.getTags()).toContain('tag1');

      note.addTag('tag2');
      expect(note.getTags().length).toBe(2);

      note.removeTag('tag1');
      expect(note.getTags()).not.toContain('tag1');
      expect(note.getTags().length).toBe(1);
    });

    test('Note: hasTag doit être insensible à la casse', () => {
      const note = new Note('Test', 'Contenu', ['Important']);

      expect(note.hasTag('important')).toBe(true);
      expect(note.hasTag('IMPORTANT')).toBe(true);
    });

    test('Note: matches doit rechercher dans tous les champs', () => {
      const note = new Note('Mon titre', 'Mon contenu', ['mon-tag']);

      expect(note.matches('titre')).toBe(true);
      expect(note.matches('contenu')).toBe(true);
      expect(note.matches('mon-tag')).toBe(true);
      expect(note.matches('inexistant')).toBe(false);
    });

    test('NoteFactory: Doit créer des notes', () => {
      const note = NoteFactory.createNote('Titre', 'Contenu', ['tag']);

      expect(note.getTitle()).toBe('Titre');
      expect(note.getContent()).toBe('Contenu');
      expect(note.getTags()).toEqual(['tag']);
    });

    test('SearchEngine: searchByTitle doit fonctionner', () => {
      const searchEngine = new SearchEngine();
      const notes = [
        new Note('Projet A', 'Description A'),
        new Note('Projet B', 'Description B'),
        new Note('Tâche C', 'Description C')
      ];

      const results = searchEngine.searchByTitle(notes, 'projet');

      expect(results.length).toBe(2);
    });

    test('SearchEngine: searchByContent doit fonctionner', () => {
      const searchEngine = new SearchEngine();
      const notes = [
        new Note('Note 1', 'Contenu important'),
        new Note('Note 2', 'Autre contenu'),
        new Note('Note 3', 'Important aussi')
      ];

      const results = searchEngine.searchByContent(notes, 'important');

      expect(results.length).toBe(2);
    });
  });

  describe('Fonctionnalités supplémentaires', () => {
    test('Doit pouvoir supprimer une note', () => {
      const note = service.createNote('Note à supprimer', 'Contenu');
      const deleted = service.deleteNote(note.getId());

      expect(deleted).toBe(true);
      expect(service.getAllNotes().length).toBe(0);
    });

    test('Doit retourner false lors de la suppression d\'une note inexistante', () => {
      const deleted = service.deleteNote('id_inexistant');

      expect(deleted).toBe(false);
    });

    test('Doit pouvoir modifier une note existante', () => {
      const note = service.createNote('Titre original', 'Contenu original');
      const updated = service.updateNote(note.getId(), {
        title: 'Nouveau titre',
        content: 'Nouveau contenu'
      });

      expect(updated).toBeDefined();
      expect(updated?.getTitle()).toBe('Nouveau titre');
      expect(updated?.getContent()).toBe('Nouveau contenu');
      expect(updated?.getId()).toBe(note.getId());
    });

    test('La date de modification doit être mise à jour', (done) => {
      const note = service.createNote('Note', 'Contenu');
      const originalUpdatedAt = note.getUpdatedAt();

      setTimeout(() => {
        const updated = service.updateNote(note.getId(), { content: 'Nouveau contenu' });

        expect(updated?.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        done();
      }, 10);
    });

    test('Doit retourner null lors de la modification d\'une note inexistante', () => {
      const updated = service.updateNote('id_inexistant', { title: 'Nouveau' });

      expect(updated).toBeNull();
    });
  });

  describe('Scénarios d\'utilisation complets', () => {
    test('Scénario: Gestion complète de notes de projet', () => {
      const note1 = service.createNote('Réunion initiale', 'Définir les objectifs', ['projet', 'reunion']);
      const note2 = service.createNote('Liste des tâches', 'Tâche 1, 2, 3', ['projet', 'todo']);
      const note3 = service.createNote('Budget', '5000€ alloués', ['projet', 'finance']);

      expect(service.getAllNotes().length).toBe(3);

      const projetNotes = service.getNotesByTag('projet');
      expect(projetNotes.length).toBe(3);

      const searchResults = service.searchNotes('tâche');
      expect(searchResults.length).toBe(1);

      service.exportNotes(exportPath);
      expect(fs.existsSync(exportPath)).toBe(true);

      service.deleteNote(note1.getId());
      expect(service.getAllNotes().length).toBe(2);
    });

    test('Scénario: Sauvegarde et récupération après redémarrage', () => {
      service.createNote('Note persistante', 'Ne pas oublier', ['important']);

      const repository = new NoteRepository();
      const storage = new JsonStorage(testDataPath);
      const searchEngine = new SearchEngine();
      const newService = new NoteService(repository, storage, searchEngine);
      const notes = newService.getAllNotes();

      expect(notes.length).toBe(1);
      expect(notes[0].getTitle()).toBe('Note persistante');
      expect(notes[0].getTags()).toContain('important');
    });
  });
});