export interface IBackupMetadata {
  id: string;
  timestamp: Date;
  checksum: string;
  notesCount: number;
  filePath: string;
}

export interface IBackupService {
  /**
   * Crée un backup des notes
   * @returns Les métadonnées du backup créé
   */
  createBackup(): Promise<IBackupMetadata>;

  /**
   * Restaure les notes à partir d'un backup
   * @param backupId L'ID du backup à restaurer
   * @returns true si la restauration a réussi
   */
  restoreBackup(backupId: string): Promise<boolean>;

  /**
   * Liste tous les backups disponibles
   * @returns La liste des métadonnées de backups
   */
  listBackups(): IBackupMetadata[];

  /**
   * Vérifie l'intégrité d'un backup
   * @param backupId L'ID du backup à vérifier
   * @returns true si l'intégrité est validée
   */
  verifyBackupIntegrity(backupId: string): Promise<boolean>;

  /**
   * Supprime les anciens backups au-delà de la limite
   * @param maxBackups Nombre maximum de backups à conserver
   */
  cleanOldBackups(maxBackups: number): void;

  /**
   * Obtient le nombre de modifications depuis le dernier backup
   */
  getModificationsSinceLastBackup(): number;

  /**
   * Incrémente le compteur de modifications
   */
  incrementModificationCount(): void;

  /**
   * Réinitialise le compteur de modifications
   */
  resetModificationCount(): void;
}
