import { BackupService, BackupData } from './backup.service';
import { Repository } from 'typeorm';

type RepoMock<T> = Partial<Repository<T>> & {
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const createRepoMock = <T>(): RepoMock<T> => ({
  find: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn(),
});

describe('BackupService', () => {
  let requestRepo: RepoMock<any>;
  let collectionRepo: RepoMock<any>;
  let environmentRepo: RepoMock<any>;
  let service: BackupService;

  beforeEach(() => {
    requestRepo = createRepoMock();
    collectionRepo = createRepoMock();
    environmentRepo = createRepoMock();
    service = new BackupService(
      requestRepo as unknown as Repository<any>,
      collectionRepo as unknown as Repository<any>,
      environmentRepo as unknown as Repository<any>,
    );
  });

  describe('exportAll', () => {
    it('exports collections and requests with metadata', async () => {
      const collectionCreated = new Date('2023-01-01T00:00:00.000Z');
      const requestCreated = new Date('2023-01-02T00:00:00.000Z');
      collectionRepo.find.mockResolvedValue([
        { id: 1, name: 'C1', createdAt: collectionCreated, requests: [] },
      ]);
      requestRepo.find.mockResolvedValue([
        {
          id: 10,
          name: 'R1',
          method: 'GET',
          url: 'http://example.com',
          headers: { h: 'v' },
          queryParams: { q: '1' },
          body: { a: 1 },
          preRequestScript: 'pre',
          postRequestScript: 'post',
          collectionId: 1,
          createdAt: requestCreated,
        },
      ]);
      environmentRepo.find.mockResolvedValue([]);

      const backup = await service.exportAll(true);

      expect(backup.version).toBe('1.0');
      expect(new Date(backup.exportedAt).toString()).not.toBe('Invalid Date');
      expect(backup.data.collections).toEqual([
        { id: 1, name: 'C1', createdAt: collectionCreated },
      ]);
      expect(backup.data.requests).toEqual([
        {
          id: 10,
          name: 'R1',
          method: 'GET',
          url: 'http://example.com',
          headers: { h: 'v' },
          queryParams: { q: '1' },
          body: { a: 1 },
          preRequestScript: 'pre',
          postRequestScript: 'post',
          collectionId: 1,
          createdAt: requestCreated,
        },
      ]);
      expect(environmentRepo.find).toHaveBeenCalledTimes(1);
    });

    it('omits environments when includeEnvironments=false', async () => {
      collectionRepo.find.mockResolvedValue([]);
      requestRepo.find.mockResolvedValue([]);

      const backup = await service.exportAll(false);

      expect(environmentRepo.find).not.toHaveBeenCalled();
      expect(backup.data.environments).toBeUndefined();
    });

    it('includes environments when requested', async () => {
      collectionRepo.find.mockResolvedValue([]);
      requestRepo.find.mockResolvedValue([]);
      const createdAt = new Date('2023-02-01T00:00:00.000Z');
      environmentRepo.find.mockResolvedValue([
        { id: 2, name: 'Env', variables: { X: '1' }, createdAt },
      ]);

      const backup = await service.exportAll(true);

      expect(backup.data.environments).toEqual([
        { id: 2, name: 'Env', variables: { X: '1' }, createdAt },
      ]);
    });
  });

  describe('importAll', () => {
    const baseBackup: BackupData = {
      version: '1.0',
      exportedAt: '2024-01-01T00:00:00.000Z',
      data: {
        collections: [],
        requests: [],
      },
    };

    it('imports collections and requests with remapped collection ids', async () => {
      collectionRepo.create.mockImplementation((dto) => ({ ...dto }));
      collectionRepo.save.mockResolvedValue({ id: 101, name: 'C1' });
      requestRepo.create.mockImplementation((dto) => ({ ...dto }));
      requestRepo.save.mockResolvedValue({ id: 201, name: 'R1' });

      const backup: BackupData = {
        ...baseBackup,
        data: {
          collections: [{ id: 1, name: 'C1', createdAt: new Date() }],
          requests: [
            {
              id: 10,
              name: 'R1',
              method: 'GET',
              url: 'http://example.com',
              headers: {},
              queryParams: {},
              body: {},
              preRequestScript: '',
              postRequestScript: '',
              collectionId: 1,
            },
          ],
        },
      };

      const result = await service.importAll(backup);

      expect(collectionRepo.create).toHaveBeenCalledWith({ name: 'C1' });
      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ collectionId: 101 }),
      );
      expect(result.imported).toEqual({ collections: 1, requests: 1, environments: 0 });
      expect(result.errors).toEqual([]);
    });

    it('imports requests without collection id when mapping missing', async () => {
      requestRepo.create.mockImplementation((dto) => ({ ...dto }));
      requestRepo.save.mockResolvedValue({ id: 5 });

      const backup: BackupData = {
        ...baseBackup,
        data: {
          collections: [],
          requests: [
            {
              id: 1,
              name: 'Orphan',
              method: 'GET',
              url: 'http://example.com',
              headers: {},
              queryParams: {},
              body: {},
              preRequestScript: '',
              postRequestScript: '',
              collectionId: 999,
            },
          ],
        },
      };

      const result = await service.importAll(backup);

      expect(requestRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ collectionId: undefined }),
      );
      expect(result.imported.requests).toBe(1);
    });

    it('imports environments when present', async () => {
      environmentRepo.create.mockImplementation((dto) => ({ ...dto }));
      environmentRepo.save.mockResolvedValue({ id: 301 });

      const backup: BackupData = {
        ...baseBackup,
        data: {
          collections: [],
          requests: [],
          environments: [{ id: 3, name: 'Env', variables: { A: 'B' } }],
        },
      };

      const result = await service.importAll(backup);

      expect(environmentRepo.create).toHaveBeenCalledWith({ name: 'Env', variables: { A: 'B' } });
      expect(result.imported.environments).toBe(1);
    });

    it('skips environments when array is missing', async () => {
      const backup: BackupData = {
        ...baseBackup,
        data: {
          collections: [],
          requests: [],
        },
      };

      const result = await service.importAll(backup);

      expect(environmentRepo.create).not.toHaveBeenCalled();
      expect(environmentRepo.save).not.toHaveBeenCalled();
      expect(result.imported.environments).toBe(0);
    });

    it('captures per-item errors and continues', async () => {
      collectionRepo.create.mockImplementation((dto) => ({ ...dto }));
      collectionRepo.save.mockRejectedValueOnce(new Error('fail-collection'));
      requestRepo.create.mockImplementation((dto) => ({ ...dto }));
      requestRepo.save.mockRejectedValueOnce(new Error('fail-request'));

      const backup: BackupData = {
        ...baseBackup,
        data: {
          collections: [{ id: 1, name: 'Broken' }],
          requests: [
            {
              id: 1,
              name: 'BrokenReq',
              method: 'GET',
              url: 'http://example.com',
              headers: {},
              queryParams: {},
              body: {},
              preRequestScript: '',
              postRequestScript: '',
              collectionId: undefined,
            },
          ],
        },
      };

      const result = await service.importAll(backup);

      expect(result.imported).toEqual({ collections: 0, requests: 0, environments: 0 });
      expect(result.errors).toEqual([
        'Collection "Broken": fail-collection',
        'Request "BrokenReq": fail-request',
      ]);
    });

    it('captures critical error and returns zeros', async () => {
      const badBackup = {
        version: '1.0',
        exportedAt: '',
        data: undefined as any,
      } as BackupData;

      const result = await service.importAll(badBackup);

      expect(result.imported).toEqual({ collections: 0, requests: 0, environments: 0 });
      expect(result.errors[0]).toContain('Critical error');
    });
  });
});
