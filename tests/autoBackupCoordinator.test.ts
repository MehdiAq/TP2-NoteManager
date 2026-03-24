import { AutoBackupCoordinator } from '../src/services/AutoBackupCoordinator';
import { IBackupMetadata, IBackupService } from '../src/interfaces/IBackupService';

const createBackupServiceMock = (): jest.Mocked<IBackupService> => ({
  createBackup: jest.fn<Promise<IBackupMetadata>, []>().mockResolvedValue({
    id: 'backup-1',
    timestamp: new Date(),
    filePath: '/tmp/backup.json',
    checksum: 'checksum',
    notesCount: 3
  }),
  restoreBackup: jest.fn(),
  verifyBackupIntegrity: jest.fn(),
  listBackups: jest.fn().mockReturnValue([]),
  cleanOldBackups: jest.fn(),
  getModificationsSinceLastBackup: jest.fn().mockReturnValue(0),
  incrementModificationCount: jest.fn(),
  resetModificationCount: jest.fn()
});

describe('AutoBackupCoordinator', () => {
  test('ne fait rien quand le backup auto est désactivé', () => {
    const backupService = createBackupServiceMock();
    const coordinator = new AutoBackupCoordinator(backupService);

    coordinator.notifyModification();

    expect(backupService.incrementModificationCount).not.toHaveBeenCalled();
    expect(backupService.createBackup).not.toHaveBeenCalled();
  });

  test('déclenche un backup auto quand le seuil est atteint', async () => {
    const backupService = createBackupServiceMock();
    backupService.getModificationsSinceLastBackup.mockReturnValue(2);

    const coordinator = new AutoBackupCoordinator(backupService);
    coordinator.configure(2, 4);

    coordinator.notifyModification();
    await Promise.resolve();

    expect(backupService.incrementModificationCount).toHaveBeenCalledTimes(1);
    expect(backupService.createBackup).toHaveBeenCalledTimes(1);
    expect(backupService.cleanOldBackups).toHaveBeenCalledWith(4);
  });

  test('désactive correctement le backup automatique', () => {
    const backupService = createBackupServiceMock();
    const coordinator = new AutoBackupCoordinator(backupService);
    coordinator.configure(1, 2);

    coordinator.disable();
    coordinator.notifyModification();

    expect(backupService.incrementModificationCount).not.toHaveBeenCalled();
  });
});
