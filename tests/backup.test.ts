import { BackupService } from '../src/services/BackupService';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('BackupService - Reliability Tests', () => {
  let backupService: BackupService;
  const testDataDir = './test-data-backup';
  const testDataFile = path.join(testDataDir, 'notes.json');
  const backupsDir = path.join(testDataDir, 'backups');

  beforeEach(() => {
    // Créer les répertoires de test
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Créer un fichier de notes de test
    const testNotes = [
      { id: '1', title: 'Note 1', content: 'Content 1', tags: ['test'] },
      { id: '2', title: 'Note 2', content: 'Content 2', tags: ['test'] }
    ];
    fs.writeFileSync(testDataFile, JSON.stringify(testNotes, null, 2));

    backupService = new BackupService(testDataFile, backupsDir);
  });

  afterEach(() => {
    // Nettoyer
    backupService.clearAllBackups();
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('1. Création de backups', () => {
    it('devrait créer un backup avec succès', async () => {
      const metadata = await backupService.createBackup();

      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      expect(metadata.checksum).toBeDefined();
      expect(metadata.notesCount).toBe(2);
      expect(fs.existsSync(metadata.filePath)).toBe(true);
    });

    it('devrait créer plusieurs backups avec des IDs uniques', async () => {
      const backup1 = await backupService.createBackup();
      await new Promise(resolve => setTimeout(resolve, 10)); // Petit délai
      const backup2 = await backupService.createBackup();

      expect(backup1.id).not.toBe(backup2.id);
      expect(backup1.checksum).toBe(backup2.checksum); // Même contenu
    });

    it('devrait lever une erreur si le fichier de données n\'existe pas', async () => {
      const nonExistentFile = path.join(testDataDir, 'nonexistent.json');
      const service = new BackupService(nonExistentFile, backupsDir);

      await expect(service.createBackup()).rejects.toThrow();
    });
  });

  describe('2. Vérification de l\'intégrité (checksums)', () => {
    it('devrait vérifier l\'intégrité d\'un backup valide', async () => {
      const metadata = await backupService.createBackup();
      const isValid = await backupService.verifyBackupIntegrity(metadata.id);

      expect(isValid).toBe(true);
    });

    it('devrait détecter un backup corrompu', async () => {
      const metadata = await backupService.createBackup();

      // Corrompre le fichier
      fs.appendFileSync(metadata.filePath, 'corrupted data');

      const isValid = await backupService.verifyBackupIntegrity(metadata.id);

      expect(isValid).toBe(false);
    });

    it('devrait retourner false pour un backup inexistant', async () => {
      const isValid = await backupService.verifyBackupIntegrity('nonexistent-id');

      expect(isValid).toBe(false);
    });

    it('devrait retourner false si le fichier de backup est supprimé', async () => {
      const metadata = await backupService.createBackup();
      fs.unlinkSync(metadata.filePath);

      const isValid = await backupService.verifyBackupIntegrity(metadata.id);

      expect(isValid).toBe(false);
    });
  });

  describe('3. Restauration de backups', () => {
    it('devrait restaurer un backup avec succès', async () => {
      const originalData = fs.readFileSync(testDataFile, 'utf-8');
      const metadata = await backupService.createBackup();

      // Modifier le fichier de données
      fs.writeFileSync(testDataFile, JSON.stringify([{ id: '3', title: 'Modified' }]));

      // Restaurer
      const restored = await backupService.restoreBackup(metadata.id);

      expect(restored).toBe(true);
      const restoredData = fs.readFileSync(testDataFile, 'utf-8');
      expect(restoredData).toBe(originalData);
    });

    it('devrait lever une erreur pour un backup inexistant', async () => {
      await expect(backupService.restoreBackup('nonexistent-id')).rejects.toThrow();
    });

    it('devrait lever une erreur pour un backup corrompu', async () => {
      const metadata = await backupService.createBackup();
      
      // Corrompre le backup
      fs.appendFileSync(metadata.filePath, 'corrupted');

      await expect(backupService.restoreBackup(metadata.id)).rejects.toThrow('corrompu');
    });

    it('devrait conserver le fichier original en cas d\'échec de restauration', async () => {
      const originalData = fs.readFileSync(testDataFile, 'utf-8');
      const metadata = await backupService.createBackup();
      
      // Corrompre le backup
      fs.appendFileSync(metadata.filePath, 'corrupted');

      try {
        await backupService.restoreBackup(metadata.id);
      } catch (error) {
        // Erreur attendue
      }

      // Le fichier original doit être intact
      const currentData = fs.readFileSync(testDataFile, 'utf-8');
      expect(currentData).toBe(originalData);
    });
  });

  describe('4. Gestion des backups (conservation des N derniers)', () => {
    it('devrait lister tous les backups', async () => {
      await backupService.createBackup();
      await new Promise(resolve => setTimeout(resolve, 10));
      await backupService.createBackup();
      await new Promise(resolve => setTimeout(resolve, 10));
      await backupService.createBackup();

      const backups = backupService.listBackups();

      expect(backups.length).toBe(3);
    });

    it('devrait trier les backups par date décroissante', async () => {
      const backup1 = await backupService.createBackup();
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup2 = await backupService.createBackup();
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup3 = await backupService.createBackup();

      const backups = backupService.listBackups();

      expect(backups[0].id).toBe(backup3.id); // Plus récent en premier
      expect(backups[1].id).toBe(backup2.id);
      expect(backups[2].id).toBe(backup1.id);
    });

    it('devrait conserver seulement les N derniers backups', async () => {
      // Créer 5 backups
      for (let i = 0; i < 5; i++) {
        await backupService.createBackup();
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(backupService.listBackups().length).toBe(5);

      // Nettoyer pour ne garder que les 3 derniers
      backupService.cleanOldBackups(3);

      const remainingBackups = backupService.listBackups();
      expect(remainingBackups.length).toBe(3);
    });

    it('devrait supprimer les fichiers des anciens backups', async () => {
      const backups = [];
      for (let i = 0; i < 5; i++) {
        backups.push(await backupService.createBackup());
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      backupService.cleanOldBackups(3);

      // Les 2 premiers backups (les plus anciens) doivent être supprimés
      expect(fs.existsSync(backups[0].filePath)).toBe(false);
      expect(fs.existsSync(backups[1].filePath)).toBe(false);
      
      // Les 3 derniers doivent exister
      expect(fs.existsSync(backups[2].filePath)).toBe(true);
      expect(fs.existsSync(backups[3].filePath)).toBe(true);
      expect(fs.existsSync(backups[4].filePath)).toBe(true);
    });

    it('ne devrait rien faire si le nombre de backups est inférieur à la limite', async () => {
      await backupService.createBackup();
      await backupService.createBackup();

      backupService.cleanOldBackups(5);

      expect(backupService.listBackups().length).toBe(2);
    });
  });

  describe('5. Compteur de modifications', () => {
    it('devrait suivre le nombre de modifications', () => {
      expect(backupService.getModificationsSinceLastBackup()).toBe(0);

      backupService.incrementModificationCount();
      expect(backupService.getModificationsSinceLastBackup()).toBe(1);

      backupService.incrementModificationCount();
      backupService.incrementModificationCount();
      expect(backupService.getModificationsSinceLastBackup()).toBe(3);
    });

    it('devrait réinitialiser le compteur après un backup', async () => {
      backupService.incrementModificationCount();
      backupService.incrementModificationCount();
      expect(backupService.getModificationsSinceLastBackup()).toBe(2);

      await backupService.createBackup();

      expect(backupService.getModificationsSinceLastBackup()).toBe(0);
    });

    it('devrait réinitialiser le compteur manuellement', () => {
      backupService.incrementModificationCount();
      backupService.incrementModificationCount();
      expect(backupService.getModificationsSinceLastBackup()).toBe(2);

      backupService.resetModificationCount();

      expect(backupService.getModificationsSinceLastBackup()).toBe(0);
    });
  });

  describe('6. Tests de robustesse (gestion d\'erreurs)', () => {
    it('devrait gérer les permissions de fichier insuffisantes', async () => {
      // Créer un backup
      const metadata = await backupService.createBackup();

      // Rendre le fichier en lecture seule
      fs.chmodSync(metadata.filePath, 0o444);

      // Tenter de corrompre le fichier devrait échouer
      expect(() => {
        fs.writeFileSync(metadata.filePath, 'data');
      }).toThrow();

      // Restaurer les permissions
      fs.chmodSync(metadata.filePath, 0o644);
    });

    it('devrait gérer des fichiers JSON invalides lors de la création', async () => {
      fs.writeFileSync(testDataFile, 'invalid json{');

      // La création devrait réussir mais notesCount devrait être 0
      const metadata = await backupService.createBackup();
      
      expect(metadata.notesCount).toBe(0);
    });

    it('devrait gérer les backups en parallèle', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(backupService.createBackup());
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      expect(new Set(results.map(r => r.id)).size).toBe(5); // Tous uniques
    });
  });
});
