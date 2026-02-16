import { AttachmentService } from '../src/services/AttachmentService';
import { AttachmentType } from '../src/interfaces/IAttachmentService';
import * as fs from 'fs';
import * as path from 'path';

describe('AttachmentService - Functionality Tests', () => {
  let attachmentService: AttachmentService;
  const testDataDir = './test-data-attachments';
  const testFilesDir = path.join(testDataDir, 'test-files');

  // Fichiers de test
  const imageFile = path.join(testFilesDir, 'test-image.png');
  const pdfFile = path.join(testFilesDir, 'test-doc.pdf');
  const codeFile = path.join(testFilesDir, 'test-code.js');
  const txtFile = path.join(testFilesDir, 'test.txt');

  beforeEach(() => {
    // Créer les répertoires
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Créer des fichiers de test
    fs.writeFileSync(imageFile, 'fake-png-data');
    fs.writeFileSync(pdfFile, 'fake-pdf-data');
    fs.writeFileSync(codeFile, 'console.log("test");');
    fs.writeFileSync(txtFile, 'Test text content');

    attachmentService = new AttachmentService(testDataDir);
  });

  afterEach(() => {
    // Nettoyer
    attachmentService.clearAll();
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('1. Attachement de fichiers', () => {
    it('devrait attacher une image à une note', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);

      expect(attachment).toBeDefined();
      expect(attachment.noteId).toBe('note-1');
      expect(attachment.fileName).toBe('test-image.png');
      expect(attachment.type).toBe(AttachmentType.IMAGE);
      expect(fs.existsSync(attachment.storedPath)).toBe(true);
    });

    it('devrait attacher un document PDF', async () => {
      const attachment = await attachmentService.attachFile('note-1', pdfFile);

      expect(attachment.type).toBe(AttachmentType.DOCUMENT);
      expect(attachment.mimeType).toBe('application/pdf');
    });

    it('devrait attacher un fichier de code', async () => {
      const attachment = await attachmentService.attachFile('note-1', codeFile);

      expect(attachment.type).toBe(AttachmentType.CODE);
      expect(attachment.mimeType).toBe('application/javascript');
    });

    it('devrait attacher un fichier texte', async () => {
      const attachment = await attachmentService.attachFile('note-1', txtFile);

      expect(attachment.type).toBe(AttachmentType.DOCUMENT);
      expect(attachment.mimeType).toBe('text/plain');
    });

    it('devrait générer un ID unique pour chaque attachement', async () => {
      const attach1 = await attachmentService.attachFile('note-1', imageFile);
      const attach2 = await attachmentService.attachFile('note-1', pdfFile);

      expect(attach1.id).not.toBe(attach2.id);
    });

    it('devrait copier le fichier dans le dossier d\'attachements', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);

      expect(fs.existsSync(attachment.storedPath)).toBe(true);
      expect(attachment.storedPath).toContain(attachmentService.getAttachmentsDir());
    });

    it('devrait enregistrer la taille du fichier', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);
      const actualSize = fs.statSync(imageFile).size;

      expect(attachment.size).toBe(actualSize);
    });

    it('devrait lever une erreur pour un fichier inexistant', async () => {
      await expect(
        attachmentService.attachFile('note-1', './nonexistent.png')
      ).rejects.toThrow('n\'existe pas');
    });

    it('devrait lever une erreur pour un type de fichier non supporté', async () => {
      const unsupportedFile = path.join(testFilesDir, 'test.exe');
      fs.writeFileSync(unsupportedFile, 'data');

      await expect(
        attachmentService.attachFile('note-1', unsupportedFile)
      ).rejects.toThrow('Type de fichier non supporté');
    });
  });

  describe('2. Listage des attachements', () => {
    it('devrait lister les attachements d\'une note', async () => {
      await attachmentService.attachFile('note-1', imageFile);
      await attachmentService.attachFile('note-1', pdfFile);
      await attachmentService.attachFile('note-2', codeFile);

      const attachments = attachmentService.listAttachments('note-1');

      expect(attachments.length).toBe(2);
      expect(attachments.every(a => a.noteId === 'note-1')).toBe(true);
    });

    it('devrait retourner un tableau vide pour une note sans attachements', () => {
      const attachments = attachmentService.listAttachments('note-999');

      expect(attachments).toEqual([]);
    });

    it('devrait supporter plusieurs notes avec des attachements', async () => {
      await attachmentService.attachFile('note-1', imageFile);
      await attachmentService.attachFile('note-2', pdfFile);
      await attachmentService.attachFile('note-3', codeFile);

      expect(attachmentService.listAttachments('note-1').length).toBe(1);
      expect(attachmentService.listAttachments('note-2').length).toBe(1);
      expect(attachmentService.listAttachments('note-3').length).toBe(1);
    });
  });

  describe('3. Récupération d\'un attachement', () => {
    it('devrait récupérer un attachement par son ID', async () => {
      const created = await attachmentService.attachFile('note-1', imageFile);
      const retrieved = attachmentService.getAttachment(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('devrait retourner undefined pour un ID inexistant', () => {
      const attachment = attachmentService.getAttachment('nonexistent-id');

      expect(attachment).toBeUndefined();
    });
  });

  describe('4. Détachement de fichiers', () => {
    it('devrait détacher un fichier d\'une note', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);
      const detached = await attachmentService.detachFile('note-1', attachment.id);

      expect(detached).toBe(true);
      expect(attachmentService.listAttachments('note-1').length).toBe(0);
    });

    it('devrait supprimer le fichier physique lors du détachement', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);
      const storedPath = attachment.storedPath;

      expect(fs.existsSync(storedPath)).toBe(true);

      await attachmentService.detachFile('note-1', attachment.id);

      expect(fs.existsSync(storedPath)).toBe(false);
    });

    it('devrait retourner false pour un attachement inexistant', async () => {
      const detached = await attachmentService.detachFile('note-1', 'nonexistent-id');

      expect(detached).toBe(false);
    });

    it('devrait retourner false si l\'ID de note ne correspond pas', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);
      const detached = await attachmentService.detachFile('note-2', attachment.id);

      expect(detached).toBe(false);
      expect(attachmentService.listAttachments('note-1').length).toBe(1);
    });
  });

  describe('5. Suppression de tous les attachements d\'une note', () => {
    it('devrait supprimer tous les attachements d\'une note', async () => {
      await attachmentService.attachFile('note-1', imageFile);
      await attachmentService.attachFile('note-1', pdfFile);
      await attachmentService.attachFile('note-1', codeFile);

      expect(attachmentService.listAttachments('note-1').length).toBe(3);

      await attachmentService.deleteNoteAttachments('note-1');

      expect(attachmentService.listAttachments('note-1').length).toBe(0);
    });

    it('devrait supprimer tous les fichiers physiques', async () => {
      const attach1 = await attachmentService.attachFile('note-1', imageFile);
      const attach2 = await attachmentService.attachFile('note-1', pdfFile);

      await attachmentService.deleteNoteAttachments('note-1');

      expect(fs.existsSync(attach1.storedPath)).toBe(false);
      expect(fs.existsSync(attach2.storedPath)).toBe(false);
    });

    it('ne devrait pas affecter les attachements d\'autres notes', async () => {
      await attachmentService.attachFile('note-1', imageFile);
      await attachmentService.attachFile('note-2', pdfFile);

      await attachmentService.deleteNoteAttachments('note-1');

      expect(attachmentService.listAttachments('note-2').length).toBe(1);
    });
  });

  describe('6. Persistance des métadonnées', () => {
    it('devrait persister les métadonnées après ajout', async () => {
      await attachmentService.attachFile('note-1', imageFile);

      // Créer une nouvelle instance
      const newService = new AttachmentService(testDataDir);

      const attachments = newService.listAttachments('note-1');
      expect(attachments.length).toBe(1);
    });

    it('devrait persister les métadonnées après suppression', async () => {
      const attachment = await attachmentService.attachFile('note-1', imageFile);
      await attachmentService.detachFile('note-1', attachment.id);

      // Créer une nouvelle instance
      const newService = new AttachmentService(testDataDir);

      expect(newService.listAttachments('note-1').length).toBe(0);
    });
  });

  describe('7. Types de fichiers supportés', () => {
    const testCases = [
      { ext: '.png', type: AttachmentType.IMAGE },
      { ext: '.jpg', type: AttachmentType.IMAGE },
      { ext: '.jpeg', type: AttachmentType.IMAGE },
      { ext: '.gif', type: AttachmentType.IMAGE },
      { ext: '.webp', type: AttachmentType.IMAGE },
      { ext: '.pdf', type: AttachmentType.DOCUMENT },
      { ext: '.txt', type: AttachmentType.DOCUMENT },
      { ext: '.md', type: AttachmentType.DOCUMENT },
      { ext: '.js', type: AttachmentType.CODE },
      { ext: '.ts', type: AttachmentType.CODE },
      { ext: '.py', type: AttachmentType.CODE },
      { ext: '.java', type: AttachmentType.CODE },
      { ext: '.cpp', type: AttachmentType.CODE },
      { ext: '.c', type: AttachmentType.CODE },
    ];

    testCases.forEach(({ ext, type }) => {
      it(`devrait supporter les fichiers ${ext} comme ${type}`, async () => {
        const testFile = path.join(testFilesDir, `test${ext}`);
        fs.writeFileSync(testFile, 'test data');

        const attachment = await attachmentService.attachFile('note-1', testFile);

        expect(attachment.type).toBe(type);
      });
    });
  });

  describe('8. Gestion des erreurs et cas limites', () => {
    it('devrait gérer les fichiers vides', async () => {
      const emptyFile = path.join(testFilesDir, 'empty.txt');
      fs.writeFileSync(emptyFile, '');

      const attachment = await attachmentService.attachFile('note-1', emptyFile);

      expect(attachment.size).toBe(0);
    });

    it('devrait gérer les fichiers avec des caractères spéciaux dans le nom', async () => {
      const specialFile = path.join(testFilesDir, 'file with spaces & special.txt');
      fs.writeFileSync(specialFile, 'content');

      const attachment = await attachmentService.attachFile('note-1', specialFile);

      expect(attachment.fileName).toBe('file with spaces & special.txt');
      expect(fs.existsSync(attachment.storedPath)).toBe(true);
    });

    it('devrait gérer plusieurs attachements du même fichier', async () => {
      const attach1 = await attachmentService.attachFile('note-1', imageFile);
      const attach2 = await attachmentService.attachFile('note-1', imageFile);

      expect(attach1.id).not.toBe(attach2.id);
      expect(attach1.storedPath).not.toBe(attach2.storedPath);
      expect(attachmentService.listAttachments('note-1').length).toBe(2);
    });
  });
});
