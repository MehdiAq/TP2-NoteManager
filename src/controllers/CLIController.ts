import { NoteService } from '../services/NoteService';
import { INote } from '../interfaces/INote';

export class CLIController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  public createNote(title: string, content: string, tags: string[]): void {
    const note = this.noteService.createNote(title, content, tags);
    console.log('✓ Note créée avec succès!');
    console.log(`ID: ${note.getId()}`);
    console.log(`Titre: ${note.getTitle()}`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
  }

  public listNotes(verbose: boolean = false): void {
    const notes = this.noteService.getAllNotes();

    if (notes.length === 0) {
      console.log('Aucune note trouvée.');
      return;
    }

    console.log(`\n${notes.length} note(s) trouvée(s):\n`);

    notes.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);

      if (verbose) {
        console.log(`    Contenu: ${note.getContent()}`);
        console.log(`    Tags: ${note.getTags().join(', ') || 'Aucun'}`);
        console.log(`    Créée le: ${note.getCreatedAt().toLocaleString()}`);
        console.log(`    Modifiée le: ${note.getUpdatedAt().toLocaleString()}`);
      } else {
        const content = note.getContent();
        const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
        console.log(`    ${preview}`);
        const tags = note.getTags();
        if (tags.length > 0) {
          console.log(`    Tags: ${tags.join(', ')}`);
        }
      }
      console.log('');
    });
  }

  public showNote(id: string): void {
    const note = this.noteService.getNoteById(id);

    if (!note) {
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(note.getTitle());
    console.log('='.repeat(60));
    console.log(`\n${note.getContent()}\n`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
    console.log(`ID: ${note.getId()}`);
    console.log(`Créée: ${note.getCreatedAt().toLocaleString()}`);
    console.log(`Modifiée: ${note.getUpdatedAt().toLocaleString()}`);
    console.log('');
  }

  public searchNotes(query: string): void {
    const results = this.noteService.searchNotes(query);

    if (results.length === 0) {
      console.log(`Aucune note trouvée pour "${query}".`);
      return;
    }

    console.log(`\n${results.length} note(s) trouvée(s) pour "${query}":\n`);

    results.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);
      const content = note.getContent();
      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      console.log(`    ${preview}`);
      const tags = note.getTags();
      if (tags.length > 0) {
        console.log(`    Tags: ${tags.join(', ')}`);
      }
      console.log('');
    });
  }

  public filterByTag(tag: string): void {
    const results = this.noteService.getNotesByTag(tag);

    if (results.length === 0) {
      console.log(`Aucune note avec l'étiquette "${tag}".`);
      return;
    }

    console.log(`\n${results.length} note(s) avec l'étiquette "${tag}":\n`);

    results.forEach((note, index) => {
      console.log(`[${index + 1}] ${note.getTitle()}`);
      console.log(`    ID: ${note.getId()}`);
      const content = note.getContent();
      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      console.log(`    ${preview}`);
      console.log('');
    });
  }

  public deleteNote(id: string): void {
    const deleted = this.noteService.deleteNote(id);

    if (deleted) {
      console.log('✓ Note supprimée avec succès!');
    } else {
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
    }
  }

  public exportNotes(path: string): void {
    try {
      this.noteService.exportNotes(path);
      console.log(`✓ Notes exportées avec succès vers ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'export: ${error}`);
    }
  }

  public importNotes(path: string, merge: boolean): void {
    try {
      this.noteService.importNotes(path, merge);
      console.log(`✓ Notes importées avec succès depuis ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'import: ${error}`);
    }
  }
}