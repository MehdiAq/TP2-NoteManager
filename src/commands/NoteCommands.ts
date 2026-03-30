import { ICommand } from './ICommand';
import { NoteService } from '../services/NoteService';

export class CreateNoteCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const title = args.title as string;
    const content = args.content as string;
    const tags = (args.tags as string[]) || [];

    const note = this.noteService.createNote(title, content, tags);
    console.log('✓ Note créée avec succès!');
    console.log(`ID: ${note.getId()}`);
    console.log(`Titre: ${note.getTitle()}`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
  }
}

export class ListNotesCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const verbose = args.verbose as boolean || false;
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
}

export class ShowNoteCommand implements ICommand {
  constructor(
    private noteService: NoteService
  ) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const id = args.id as string;
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

    const attachmentService = this.noteService.getAttachmentService();
    if (attachmentService) {
      const attachments = attachmentService.listAttachments(id);
      if (attachments.length > 0) {
        console.log(`\nPièces jointes (${attachments.length}):`);
        attachments.forEach((attach, idx) => {
          console.log(`  [${idx + 1}] ${attach.fileName} (${attach.type}, ${(attach.size / 1024).toFixed(2)} KB)`);
          console.log(`      ID: ${attach.id}`);
        });
      }
    }
    console.log('');
  }
}

export class SearchNotesCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const query = args.query as string;
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
}

export class FilterByTagCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const tag = args.tag as string;
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
}

export class DeleteNoteCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const id = args.id as string;
    const deleted = await this.noteService.deleteNote(id);

    if (deleted) {
      console.log('✓ Note supprimée avec succès!');
    } else {
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
    }
  }
}

export class ExportNotesCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const path = args.path as string;
    try {
      this.noteService.exportNotes(path);
      console.log(`✓ Notes exportées avec succès vers ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'export: ${error}`);
    }
  }
}

export class ImportNotesCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const path = args.path as string;
    const merge = args.merge as boolean || false;
    try {
      this.noteService.importNotes(path, merge);
      console.log(`✓ Notes importées avec succès depuis ${path}`);
    } catch (error) {
      console.error(`✗ Erreur lors de l'import: ${error}`);
    }
  }
}
