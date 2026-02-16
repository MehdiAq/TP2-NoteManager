import { IBackupService, IBackupMetadata } from '../interfaces/IBackupService';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class BackupService implements IBackupService {
  private backupsDir: string;
  private dataFile: string;
  private backupMetadataFile: string;
  private backups: IBackupMetadata[];
  private modificationCount: number;
  private lastBackupTime: Date;

  constructor(dataFile: string, backupsDir: string = './data/backups') {
    this.dataFile = dataFile;
    this.backupsDir = backupsDir;
    this.backupMetadataFile = path.join(backupsDir, 'backups-metadata.json');
    this.backups = [];
    this.modificationCount = 0;
    this.lastBackupTime = new Date();
    this.ensureDirectories();
    this.loadBackupMetadata();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  private loadBackupMetadata(): void {
    try {
      if (fs.existsSync(this.backupMetadataFile)) {
        const data = fs.readFileSync(this.backupMetadataFile, 'utf-8');
        const backupsData = JSON.parse(data);
        this.backups = backupsData.map((b: any) => ({
          ...b,
          timestamp: new Date(b.timestamp)
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées de backup:', error);
    }
  }

  private saveBackupMetadata(): void {
    try {
      fs.writeFileSync(this.backupMetadataFile, JSON.stringify(this.backups, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des métadonnées de backup:', error);
      throw error;
    }
  }

  private calculateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async createBackup(): Promise<IBackupMetadata> {
    if (!fs.existsSync(this.dataFile)) {
      throw new Error(`Le fichier de données "${this.dataFile}" n'existe pas`);
    }

    const backupId = this.generateBackupId();
    const backupFileName = `${backupId}.json`;
    const backupFilePath = path.join(this.backupsDir, backupFileName);

    // Copier le fichier de données
    fs.copyFileSync(this.dataFile, backupFilePath);

    // Calculer le checksum
    const checksum = this.calculateChecksum(backupFilePath);

    // Compter les notes
    let notesCount = 0;
    try {
      const data = fs.readFileSync(backupFilePath, 'utf-8');
      const notes = JSON.parse(data);
      notesCount = Array.isArray(notes) ? notes.length : 0;
    } catch (error) {
      console.warn('Impossible de compter les notes dans le backup');
    }

    // Créer les métadonnées
    const metadata: IBackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      checksum,
      notesCount,
      filePath: backupFilePath
    };

    this.backups.push(metadata);
    this.saveBackupMetadata();
    this.resetModificationCount();
    this.lastBackupTime = new Date();

    return metadata;
  }

  public async restoreBackup(backupId: string): Promise<boolean> {
    const backup = this.backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error(`Backup avec l'ID "${backupId}" introuvable`);
    }

    if (!fs.existsSync(backup.filePath)) {
      throw new Error(`Le fichier de backup "${backup.filePath}" n'existe pas`);
    }

    // Vérifier l'intégrité avant de restaurer
    const isValid = await this.verifyBackupIntegrity(backupId);
    if (!isValid) {
      throw new Error(`Le backup "${backupId}" est corrompu (échec de vérification du checksum)`);
    }

    // Sauvegarder le fichier actuel au cas où
    const tempFile = this.dataFile + '.tmp';
    if (fs.existsSync(this.dataFile)) {
      fs.copyFileSync(this.dataFile, tempFile);
    }

    try {
      // Restaurer le backup
      fs.copyFileSync(backup.filePath, this.dataFile);
      
      // Supprimer le fichier temporaire
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      this.resetModificationCount();
      return true;
    } catch (error) {
      // En cas d'erreur, restaurer le fichier temporaire
      if (fs.existsSync(tempFile)) {
        fs.copyFileSync(tempFile, this.dataFile);
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  }

  public listBackups(): IBackupMetadata[] {
    // Trier par timestamp décroissant (plus récent en premier)
    return [...this.backups].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    const backup = this.backups.find(b => b.id === backupId);
    
    if (!backup) {
      return false;
    }

    if (!fs.existsSync(backup.filePath)) {
      return false;
    }

    try {
      const currentChecksum = this.calculateChecksum(backup.filePath);
      return currentChecksum === backup.checksum;
    } catch (error) {
      console.error(`Erreur lors de la vérification du backup ${backupId}:`, error);
      return false;
    }
  }

  public cleanOldBackups(maxBackups: number): void {
    if (this.backups.length <= maxBackups) {
      return;
    }

    // Trier par timestamp (plus ancien en premier)
    const sortedBackups = [...this.backups].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Supprimer les plus anciens
    const backupsToDelete = sortedBackups.slice(0, sortedBackups.length - maxBackups);
    
    backupsToDelete.forEach(backup => {
      try {
        // Supprimer le fichier
        if (fs.existsSync(backup.filePath)) {
          fs.unlinkSync(backup.filePath);
        }
        
        // Retirer des métadonnées
        const index = this.backups.findIndex(b => b.id === backup.id);
        if (index !== -1) {
          this.backups.splice(index, 1);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du backup ${backup.id}:`, error);
      }
    });

    this.saveBackupMetadata();
  }

  public getModificationsSinceLastBackup(): number {
    return this.modificationCount;
  }

  public incrementModificationCount(): void {
    this.modificationCount++;
  }

  public resetModificationCount(): void {
    this.modificationCount = 0;
  }

  public getLastBackupTime(): Date {
    return this.lastBackupTime;
  }

  public getTimeSinceLastBackup(): number {
    return Date.now() - this.lastBackupTime.getTime();
  }

  // Méthode pour nettoyer tous les backups (utile pour les tests)
  public clearAllBackups(): void {
    this.backups.forEach(backup => {
      try {
        if (fs.existsSync(backup.filePath)) {
          fs.unlinkSync(backup.filePath);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    });
    
    this.backups = [];
    
    if (fs.existsSync(this.backupMetadataFile)) {
      fs.unlinkSync(this.backupMetadataFile);
    }
    
    this.modificationCount = 0;
    this.lastBackupTime = new Date();
  }
}
