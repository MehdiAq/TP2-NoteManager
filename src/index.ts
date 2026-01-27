#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { App } from './App';

const program = new Command();
const app = App.getInstance();
const controller = app.getController();

program
  .name('notes')
  .description('Gestionnaire de notes orienté objet en ligne de commande')
  .version('2.0.0');

program
  .command('create')
  .description('Créer une nouvelle note')
  .requiredOption('-t, --title <title>', 'Titre de la note')
  .requiredOption('-c, --content <content>', 'Contenu de la note')
  .option('-g, --tags <tags>', 'Étiquettes séparées par des virgules', '')
  .action((options) => {
    const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
    controller.createNote(options.title, options.content, tags);
  });

program
  .command('list')
  .description('Lister toutes les notes')
  .option('-v, --verbose', 'Afficher tous les détails')
  .action((options) => {
    controller.listNotes(options.verbose);
  });

program
  .command('show')
  .description('Afficher une note par son ID')
  .requiredOption('-i, --id <id>', 'ID de la note')
  .action((options) => {
    controller.showNote(options.id);
  });

program
  .command('search')
  .description('Rechercher des notes')
  .requiredOption('-q, --query <query>', 'Terme de recherche')
  .action((options) => {
    controller.searchNotes(options.query);
  });

program
  .command('tag')
  .description('Filtrer les notes par étiquette')
  .requiredOption('-t, --tag <tag>', 'Étiquette à rechercher')
  .action((options) => {
    controller.filterByTag(options.tag);
  });

program
  .command('delete')
  .description('Supprimer une note')
  .requiredOption('-i, --id <id>', 'ID de la note à supprimer')
  .action((options) => {
    controller.deleteNote(options.id);
  });

program
  .command('export')
  .description('Exporter les notes')
  .requiredOption('-o, --output <path>', 'Chemin du fichier de sortie')
  .action((options) => {
    controller.exportNotes(path.resolve(options.output));
  });

program
  .command('import')
  .description('Importer des notes')
  .requiredOption('-i, --input <path>', 'Chemin du fichier à importer')
  .option('-m, --merge', 'Fusionner avec les notes existantes')
  .action((options) => {
    controller.importNotes(path.resolve(options.input), options.merge);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}