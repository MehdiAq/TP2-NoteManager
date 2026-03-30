import { ICommand } from './ICommand';
import { IBackupService } from '../interfaces/IBackupService';

export class CreateBackupCommand implements ICommand {
  constructor(private backupService: IBackupService | undefined) {}

  async execute(_args: Record<string, unknown>): Promise<void> {
    if (!this.backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    try {
      const metadata = await this.backupService.createBackup();
      console.log('✓ Backup créé avec succès!');
      console.log(`ID: ${metadata.id}`);
      console.log(`Date: ${metadata.timestamp.toLocaleString()}`);
      console.log(`Notes sauvegardées: ${metadata.notesCount}`);
      console.log(`Checksum: ${metadata.checksum.substring(0, 16)}...`);
    } catch (error) {
      console.error(`✗ Erreur lors de la création du backup: ${error}`);
    }
  }
}

export class ListBackupsCommand implements ICommand {
  constructor(private backupService: IBackupService | undefined) {}

  async execute(_args: Record<string, unknown>): Promise<void> {
    if (!this.backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    const backups = this.backupService.listBackups();

    if (backups.length === 0) {
      console.log('Aucun backup trouvé.');
      return;
    }

    console.log(`\n${backups.length} backup(s) disponible(s):\n`);

    backups.forEach((backup, index) => {
      console.log(`[${index + 1}] ${backup.timestamp.toLocaleString()}`);
      console.log(`    ID: ${backup.id}`);
      console.log(`    Notes: ${backup.notesCount}`);
      console.log(`    Checksum: ${backup.checksum.substring(0, 16)}...`);
      console.log('');
    });
  }
}

export class RestoreBackupCommand implements ICommand {
  constructor(private backupService: IBackupService | undefined) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    if (!this.backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    const backupId = args.backupId as string;

    try {
      const restored = await this.backupService.restoreBackup(backupId);

      if (restored) {
        console.log('✓ Backup restauré avec succès!');
        console.log('Les notes ont été rechargées depuis le backup.');
      }
    } catch (error) {
      console.error(`✗ Erreur lors de la restauration: ${error}`);
    }
  }
}

export class VerifyBackupCommand implements ICommand {
  constructor(private backupService: IBackupService | undefined) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    if (!this.backupService) {
      console.log('✗ Le service de backup n\'est pas configuré.');
      return;
    }

    const backupId = args.backupId as string;

    try {
      const isValid = await this.backupService.verifyBackupIntegrity(backupId);

      if (isValid) {
        console.log('✓ L\'intégrité du backup est validée.');
      } else {
        console.log('✗ Le backup est corrompu ou introuvable.');
      }
    } catch (error) {
      console.error(`✗ Erreur lors de la vérification: ${error}`);
    }
  }
}
