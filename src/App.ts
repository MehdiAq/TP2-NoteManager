import * as path from 'path';
import { NoteRepository } from './repositories/NoteRepository';
import { JsonStorage } from './storage/JsonStorage';
import { SearchEngine } from './search/SearchEngine';
import { NoteService } from './services/NoteService';
import { CLIController } from './controllers/CLIController';

export class App {
  private static instance: App;
  private controller: CLIController;
  //commentaire
  private constructor() {
    const dataPath = path.join(process.cwd(), 'notes.json');
    
    const repository = new NoteRepository();
    const storage = new JsonStorage(dataPath);
    const searchEngine = new SearchEngine();
    
    const noteService = new NoteService(repository, storage, searchEngine);
    
    this.controller = new CLIController(noteService);
  }

  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  public getController(): CLIController {
    return this.controller;
  }
}