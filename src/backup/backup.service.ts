import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { CollectionEntity } from '../collections/collection.entity';
import { EnvironmentEntity } from '../environments/environment.entity';

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    collections: any[];
    requests: any[];
    environments?: any[];
  };
}

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(RequestEntity)
    private requestRepo: Repository<RequestEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepo: Repository<CollectionEntity>,
    @InjectRepository(EnvironmentEntity)
    private environmentRepo: Repository<EnvironmentEntity>,
  ) {}

  async exportAll(includeEnvironments: boolean = true): Promise<BackupData> {
    // Fetch all data (excluding runs/history)
    const collections = await this.collectionRepo.find({
      relations: ['requests'],
    });
    const requests = await this.requestRepo.find({
      relations: ['collection'],
    });

    // Prepare export data with metadata
    const backup: BackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        collections: collections.map((c) => ({
          id: c.id,
          name: c.name,
          createdAt: c.createdAt,
        })),
        requests: requests.map((r) => ({
          id: r.id,
          name: r.name,
          method: r.method,
          url: r.url,
          headers: r.headers,
          queryParams: r.queryParams,
          body: r.body,
          preRequestScript: r.preRequestScript,
          postRequestScript: r.postRequestScript,
          collectionId: r.collectionId,
          createdAt: r.createdAt,
        })),
      },
    };

    // Only include environments if requested
    if (includeEnvironments) {
      const environments = await this.environmentRepo.find();
      backup.data.environments = environments.map((e) => ({
        id: e.id,
        name: e.name,
        variables: e.variables,
        createdAt: e.createdAt,
      }));
    }

    return backup;
  }

  async importAll(backup: BackupData): Promise<{
    imported: {
      collections: number;
      requests: number;
      environments: number;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const imported = {
      collections: 0,
      requests: 0,
      environments: 0,
    };

    // Maps for ID translation (old ID -> new ID)
    const collectionIdMap = new Map<number, number>();
    const requestIdMap = new Map<number, number>();
    const environmentIdMap = new Map<number, number>();

    try {
      // 1. Import Collections
      for (const collectionData of backup.data.collections) {
        try {
          const collection = this.collectionRepo.create({
            name: collectionData.name,
          });
          const saved = await this.collectionRepo.save(collection);
          collectionIdMap.set(collectionData.id, saved.id);
          imported.collections++;
        } catch (err) {
          errors.push(`Collection "${collectionData.name}": ${err.message}`);
        }
      }

      // 2. Import Environments (if present)
      if (backup.data.environments && Array.isArray(backup.data.environments)) {
        for (const envData of backup.data.environments) {
          try {
            const environment = this.environmentRepo.create({
              name: envData.name,
              variables: envData.variables,
            });
            const saved = await this.environmentRepo.save(environment);
            environmentIdMap.set(envData.id, saved.id);
            imported.environments++;
          } catch (err) {
            errors.push(`Environment "${envData.name}": ${err.message}`);
          }
        }
      }

      // 3. Import Requests
      for (const reqData of backup.data.requests) {
        try {
          const newCollectionId = reqData.collectionId
            ? collectionIdMap.get(reqData.collectionId)
            : undefined;

          const request = this.requestRepo.create({
            name: reqData.name,
            method: reqData.method,
            url: reqData.url,
            headers: reqData.headers,
            queryParams: reqData.queryParams,
            body: reqData.body,
            preRequestScript: reqData.preRequestScript,
            postRequestScript: reqData.postRequestScript,
            collectionId: newCollectionId,
          });
          const saved = await this.requestRepo.save(request);
          requestIdMap.set(reqData.id, saved.id);
          imported.requests++;
        } catch (err) {
          errors.push(`Request "${reqData.name}": ${err.message}`);
        }
      }
    } catch (err) {
      errors.push(`Critical error: ${err.message}`);
    }

    return { imported, errors };
  }
}
