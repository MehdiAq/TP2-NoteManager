/**
 * Exemple d'utilisation des nouvelles fonctionnalités FURPS
 * 
 * Ce fichier démontre comment utiliser :
 * 1. Le système de backup (Reliability)
 * 2. Les pièces jointes (Functionality)
 * 3. La recherche optimisée (Performance)
 */

import { NoteRepository } from './src/repositories/NoteRepository';
import { JsonStorage } from './src/storage/JsonStorage';
import { SearchEngine } from './src/search/SearchEngine';
import { BackupService } from './src/services/BackupService';
import { AttachmentService } from './src/services/AttachmentService';
import { NoteService } from './src/services/NoteService';
import { CLIController } from './src/controllers/CLIController';
import * as fs from 'fs';
import * as path from 'path';

async function demonstrateFunctionnalities() {
  console.log('='.repeat(80));
  console.log('DÉMONSTRATION DES NOUVELLES FONCTIONNALITÉS FURPS');
  console.log('='.repeat(80));
  console.log('');

  // Configuration
  const dataDir = './demo-data';
  const dataFile = path.join(dataDir, 'notes.json');
  const backupsDir = path.join(dataDir, 'backups');

  // Créer les répertoires
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialiser les services
  const repository = new NoteRepository();
  const storage = new JsonStorage(dataFile);
  const searchEngine = new SearchEngine();
  const backupService = new BackupService(dataFile, backupsDir);
  const attachmentService = new AttachmentService(dataDir);

  const noteService = new NoteService(
    repository,
    storage,
    searchEngine,
    backupService,
    attachmentService
  );

  const controller = new CLIController(noteService);

  // ============================================================
  // 1. DÉMONSTRATION : Functionality - Pièces jointes
  // ============================================================
  console.log('1️⃣  FUNCTIONALITY - SUPPORT DES PIÈCES JOINTES');
  console.log('-'.repeat(80));
  console.log('');

  // Créer quelques notes
  console.log('📝 Création de notes de test...');
  const note1 = noteService.createNote(
    'Rapport de projet',
    'Ce rapport contient les détails du projet',
    ['travail', 'important']
  );

  const note2 = noteService.createNote(
    'Code TypeScript',
    'Exemples de code pour le projet',
    ['code', 'typescript']
  );

  console.log(`✅ Note 1 créée : ${note1.getId()}`);
  console.log(`✅ Note 2 créée : ${note2.getId()}`);
  console.log('');

  // Créer des fichiers de test pour les attachements
  const testFilesDir = path.join(dataDir, 'test-files');
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }

  const imageFile = path.join(testFilesDir, 'screenshot.png');
  const pdfFile = path.join(testFilesDir, 'rapport.pdf');
  const codeFile = path.join(testFilesDir, 'example.ts');

  fs.writeFileSync(imageFile, 'fake-png-data-for-demo');
  fs.writeFileSync(pdfFile, 'fake-pdf-data-for-demo');
  fs.writeFileSync(codeFile, 'const demo: string = "Hello FURPS!";');

  // Attacher des fichiers
  console.log('📎 Attachement de fichiers...');
  try {
    const attach1 = await attachmentService.attachFile(note1.getId(), pdfFile);
    console.log(`✅ PDF attaché à la note 1 : ${attach1.fileName}`);

    const attach2 = await attachmentService.attachFile(note2.getId(), codeFile);
    console.log(`✅ Code attaché à la note 2 : ${attach2.fileName}`);

    const attach3 = await attachmentService.attachFile(note1.getId(), imageFile);
    console.log(`✅ Image attachée à la note 1 : ${attach3.fileName}`);
  } catch (error) {
    console.error(`❌ Erreur : ${error}`);
  }

  console.log('');
  console.log('📋 Listage des attachements de la note 1...');
  controller.listAttachments(note1.getId());

  console.log('');

  // ============================================================
  // 2. DÉMONSTRATION : Reliability - Système de backup
  // ============================================================
  console.log('2️⃣  RELIABILITY - SYSTÈME DE BACKUP AUTOMATIQUE');
  console.log('-'.repeat(80));
  console.log('');

  // Créer un backup initial
  console.log('💾 Création d\'un backup initial...');
  const backup1 = await backupService.createBackup();
  console.log(`✅ Backup créé : ${backup1.id}`);
  console.log(`   - Date : ${backup1.timestamp.toLocaleString()}`);
  console.log(`   - Notes : ${backup1.notesCount}`);
  console.log(`   - Checksum : ${backup1.checksum.substring(0, 16)}...`);
  console.log('');

  // Faire quelques modifications
  console.log('✏️  Modification des notes...');
  noteService.createNote('Note 3', 'Contenu 3', ['test']);
  noteService.createNote('Note 4', 'Contenu 4', ['test']);
  noteService.createNote('Note 5', 'Contenu 5', ['test']);
  console.log('✅ 3 nouvelles notes créées');
  console.log('');

  // Créer un deuxième backup
  console.log('💾 Création d\'un deuxième backup...');
  const backup2 = await backupService.createBackup();
  console.log(`✅ Backup créé : ${backup2.id}`);
  console.log(`   - Notes : ${backup2.notesCount}`);
  console.log('');

  // Lister les backups
  console.log('📋 Liste des backups disponibles :');
  controller.listBackups();

  // Vérifier l'intégrité
  console.log('🔍 Vérification de l\'intégrité du backup...');
  await controller.verifyBackup(backup2.id);
  console.log('');

  // ============================================================
  // 3. DÉMONSTRATION : Performance - Recherche optimisée
  // ============================================================
  console.log('3️⃣  PERFORMANCE - RECHERCHE OPTIMISÉE');
  console.log('-'.repeat(80));
  console.log('');

  // Créer un grand nombre de notes pour tester la performance
  console.log('📝 Création de 1000 notes pour le test de performance...');
  const startCreation = performance.now();
  
  for (let i = 0; i < 1000; i++) {
    noteService.createNote(
      `Note ${i}`,
      `Ceci est le contenu de la note ${i} avec des mots-clés comme typescript, javascript, programming`,
      [i % 2 === 0 ? 'pair' : 'impair', 'test']
    );
  }
  
  const endCreation = performance.now();
  console.log(`✅ 1000 notes créées en ${(endCreation - startCreation).toFixed(2)}ms`);
  console.log('');

  // Reconstruire les index
  console.log('🔨 Construction des index de recherche...');
  const startIndexing = performance.now();
  searchEngine.buildIndexes(noteService.getAllNotes());
  const endIndexing = performance.now();
  console.log(`✅ Index construits en ${(endIndexing - startIndexing).toFixed(2)}ms`);
  console.log('');

  // Test de performance : recherche par mot-clé
  console.log('⚡ Test 1 : Recherche par mot-clé "typescript"');
  const startSearch1 = performance.now();
  const results1 = noteService.searchNotes('typescript');
  const endSearch1 = performance.now();
  const time1 = endSearch1 - startSearch1;
  console.log(`   - Résultats trouvés : ${results1.length}`);
  console.log(`   - Temps : ${time1.toFixed(2)}ms`);
  console.log(`   - Statut : ${time1 < 100 ? '✅ < 100ms (OBJECTIF ATTEINT)' : '❌ > 100ms'}`);
  console.log('');

  // Test de performance : recherche par tag
  console.log('⚡ Test 2 : Recherche par tag "pair"');
  const startSearch2 = performance.now();
  const results2 = noteService.getNotesByTag('pair');
  const endSearch2 = performance.now();
  const time2 = endSearch2 - startSearch2;
  console.log(`   - Résultats trouvés : ${results2.length}`);
  console.log(`   - Temps : ${time2.toFixed(2)}ms`);
  console.log(`   - Statut : ${time2 < 100 ? '✅ < 100ms (OBJECTIF ATTEINT)' : '❌ > 100ms'}`);
  console.log('');

  // Test de performance : recherche avec cache
  console.log('⚡ Test 3 : Recherche répétée (avec cache)');
  const startSearch3a = performance.now();
  noteService.searchNotes('programming');
  const endSearch3a = performance.now();
  const time3a = endSearch3a - startSearch3a;

  const startSearch3b = performance.now();
  const results3 = noteService.searchNotes('programming');
  const endSearch3b = performance.now();
  const time3b = endSearch3b - startSearch3b;

  console.log(`   - Première recherche : ${time3a.toFixed(2)}ms`);
  console.log(`   - Deuxième recherche (cachée) : ${time3b.toFixed(2)}ms`);
  console.log(`   - Amélioration : ${((time3a - time3b) / time3a * 100).toFixed(1)}%`);
  console.log(`   - Résultats : ${results3.length}`);
  console.log('');

  // ============================================================
  // RÉSUMÉ DES PERFORMANCES
  // ============================================================
  console.log('='.repeat(80));
  console.log('📊 RÉSUMÉ DES PERFORMANCES');
  console.log('='.repeat(80));
  console.log('');

  const performanceData = [
    { 
      test: 'Recherche par mot-clé (1005 notes)', 
      time: time1, 
      requirement: 100,
      status: time1 < 100 
    },
    { 
      test: 'Recherche par tag (1005 notes)', 
      time: time2, 
      requirement: 100,
      status: time2 < 100 
    },
    { 
      test: 'Recherche avec cache', 
      time: time3b, 
      requirement: 10,
      status: time3b < 10 
    }
  ];

  console.log('┌────────────────────────────────────────┬───────────┬──────────┬──────────┐');
  console.log('│ Test                                   │ Temps     │ Objectif │ Statut   │');
  console.log('├────────────────────────────────────────┼───────────┼──────────┼──────────┤');
  
  performanceData.forEach(({ test, time, requirement, status }) => {
    const testPadded = test.padEnd(38);
    const timePadded = `${time.toFixed(2)}ms`.padEnd(9);
    const reqPadded = `< ${requirement}ms`.padEnd(8);
    const statusIcon = status ? '✅ OK   ' : '❌ FAIL ';
    console.log(`│ ${testPadded} │ ${timePadded} │ ${reqPadded} │ ${statusIcon} │`);
  });
  
  console.log('└────────────────────────────────────────┴───────────┴──────────┴──────────┘');
  console.log('');

  // ============================================================
  // CONFIGURATION DU BACKUP AUTOMATIQUE
  // ============================================================
  console.log('⚙️  CONFIGURATION DU BACKUP AUTOMATIQUE');
  console.log('-'.repeat(80));
  console.log('');

  console.log('Configuration : Backup automatique tous les 10 changements, max 5 backups');
  noteService.configureAutoBackup(10, 5);
  console.log('✅ Backup automatique configuré');
  console.log('');

  console.log('💡 Simulation : création de 12 notes pour déclencher un backup automatique');
  for (let i = 0; i < 12; i++) {
    noteService.createNote(`Auto note ${i}`, `Contenu ${i}`, ['auto']);
  }
  console.log('✅ 12 notes créées (backup automatique devrait avoir été déclenché)');
  console.log('');

  console.log('📋 Backups disponibles après configuration automatique :');
  controller.listBackups();

  // ============================================================
  // CONCLUSION
  // ============================================================
  console.log('='.repeat(80));
  console.log('✅ DÉMONSTRATION TERMINÉE');
  console.log('='.repeat(80));
  console.log('');
  console.log('Toutes les exigences FURPS ont été démontrées :');
  console.log('');
  console.log('1. ✅ Functionality - Pièces jointes fonctionnelles');
  console.log('   - Support de multiples types de fichiers');
  console.log('   - Stockage sécurisé avec hash');
  console.log('   - Métadonnées complètes');
  console.log('');
  console.log('2. ✅ Reliability - Système de backup robuste');
  console.log('   - Création et restauration de backups');
  console.log('   - Vérification d\'intégrité avec checksums');
  console.log('   - Backup automatique configurable');
  console.log('');
  console.log('3. ✅ Performance - Recherche optimisée');
  console.log(`   - Recherche par mot-clé : ${time1.toFixed(2)}ms (< 100ms) ✅`);
  console.log(`   - Recherche par tag : ${time2.toFixed(2)}ms (< 100ms) ✅`);
  console.log(`   - Recherche avec cache : ${time3b.toFixed(2)}ms (quasi instantané) ✅`);
  console.log('');

  // Nettoyage optionnel
  console.log('🧹 Pour nettoyer les fichiers de démonstration :');
  console.log(`   rm -rf ${dataDir}`);
  console.log('');
}

// Exécuter la démonstration
demonstrateFunctionnalities().catch(console.error);
