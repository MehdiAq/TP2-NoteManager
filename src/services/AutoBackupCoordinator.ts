import { IBackupService } from '../interfaces/IBackupService';

type AutoBackupConfig = {
  enabled: boolean;
  maxModifications: number;
  maxBackups: number;
};

export class AutoBackupCoordinator {
  private readonly backupService?: IBackupService;
  private config: AutoBackupConfig = {
    enabled: false,
    maxModifications: 10,
    maxBackups: 5
  };

  constructor(backupService?: IBackupService) {
    this.backupService = backupService;
  }

  public configure(maxModifications: number, maxBackups: number): void {
    this.config.enabled = true;
    this.config.maxModifications = maxModifications;
    this.config.maxBackups = maxBackups;
  }

  public disable(): void {
    this.config.enabled = false;
  }

  public notifyModification(): void {
    if (!this.backupService || !this.config.enabled) {
      return;
    }

    this.backupService.incrementModificationCount();

    if (this.backupService.getModificationsSinceLastBackup() >= this.config.maxModifications) {
      void this.createAutoBackup();
    }
  }

  private async createAutoBackup(): Promise<void> {
    if (!this.backupService) {
      return;
    }

    try {
      await this.backupService.createBackup();
      this.backupService.cleanOldBackups(this.config.maxBackups);
    } catch (error) {
      console.error('Erreur lors de la création du backup automatique:', error);
    }
  }
}
