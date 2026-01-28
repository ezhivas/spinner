import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from './collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { RequestsService } from '../requests/requests.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
    private readonly requestsService: RequestsService,
  ) {}

  /**
   * Sanitize imported scripts by removing dangerous patterns
   */
  private sanitizeScript(script: string | undefined): string | undefined {
    if (!script) return undefined;

    let sanitized = script;
    let modified = false;

    // List of dangerous patterns to remove (matching the validation patterns)
    const dangerousPatterns = [
      { pattern: /\brequire\s*\(/gi, name: 'require()' },
      { pattern: /\bimport\s+/gi, name: 'import' },
      { pattern: /\bprocess\./gi, name: 'process.' },
      { pattern: /\bglobal\./gi, name: 'global.' },
      { pattern: /\b__dirname\b/gi, name: '__dirname' },
      { pattern: /\b__filename\b/gi, name: '__filename' },
      { pattern: /\beval\s*\(/gi, name: 'eval()' },
      { pattern: /\bFunction\s*\(/gi, name: 'Function()' },
      { pattern: /\bchild_process\b/gi, name: 'child_process' },
      { pattern: /\bfs\./gi, name: 'fs.' },
      { pattern: /\bexec\s*\(/gi, name: 'exec()' },
      { pattern: /\bspawn\s*\(/gi, name: 'spawn()' },
    ];

    // Remove each dangerous pattern
    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, `/* ${name} removed */`);
        modified = true;
      }
    }

    // Add a comment at the top if modifications were made
    if (modified) {
      sanitized =
        '// Note: Dangerous patterns have been removed for security\n' +
        sanitized;
    }

    return sanitized;
  }

  async create(dto: CreateCollectionDto): Promise<CollectionEntity> {
    const collection = this.collectionRepo.create(dto);
    return this.collectionRepo.save(collection);
  }

  async findAll(): Promise<CollectionEntity[]> {
    return this.collectionRepo.find({
      relations: ['requests', 'requests.collection'],
    });
  }

  async findOne(id: number): Promise<CollectionEntity | null> {
    return this.collectionRepo.findOne({
      where: { id },
      relations: ['requests', 'requests.collection'],
    });
  }

  async update(
    id: number,
    dto: Partial<CreateCollectionDto>,
  ): Promise<CollectionEntity | null> {
    await this.collectionRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.collectionRepo.delete(id);
  }

  async importFromPostman(postmanCollection: any): Promise<CollectionEntity> {
    const collection = await this.create({
      name: postmanCollection.info?.name || 'Imported Collection',
      description: postmanCollection.info?.description || '',
    });

    const requests: any[] = this.extractRequestsFromPostman(
      postmanCollection.item || [],
    );
    for (const req of requests) {
      await this.requestsService.create({
        ...req,
        collectionId: collection.id,
      });
    }

    const result = await this.findOne(collection.id);
    if (!result) throw new Error('Collection not found after creation');
    return result;
  }

  private extractRequestsFromPostman(items: any[]): any[] {
    const requests: any[] = [];
    for (const item of items) {
      if (item.request) {
        // It's a request
        const req = item.request;
        let body: string | null = null;
        if (req.body) {
          if (req.body.mode === 'raw') {
            body = req.body.raw;
          } else if (req.body.mode === 'formdata') {
            // Convert formdata to JSON object
            const formdata =
              req.body.formdata?.reduce((acc, f) => {
                acc[f.key] = f.value;
                return acc;
              }, {}) || {};
            body = JSON.stringify(formdata);
          } else if (req.body.mode === 'urlencoded') {
            // Similar to formdata
            const urlencoded =
              req.body.urlencoded?.reduce((acc, u) => {
                acc[u.key] = u.value;
                return acc;
              }, {}) || {};
            body = JSON.stringify(urlencoded);
          }
          // Other modes like file, graphql can be handled later
        }

        // Extract pre-request and post-request scripts
        let preRequestScript: string | undefined;
        let postRequestScript: string | undefined;

        if (item.event && Array.isArray(item.event)) {
          for (const event of item.event) {
            if (event.listen === 'prerequest' && event.script) {
              const scriptLines = Array.isArray(event.script.exec)
                ? event.script.exec
                : [event.script.exec];
              preRequestScript = scriptLines.join('\n');
            } else if (event.listen === 'test' && event.script) {
              const scriptLines = Array.isArray(event.script.exec)
                ? event.script.exec
                : [event.script.exec];
              postRequestScript = scriptLines.join('\n');
            }
          }
        }

        requests.push({
          name: item.name,
          method: req.method,
          url: typeof req.url === 'string' ? req.url : req.url?.raw || '',
          headers:
            req.header?.reduce(
              (acc, h) => ({ ...acc, [h.key]: h.value }),
              {},
            ) || {},
          queryParams:
            req.url?.query?.reduce(
              (acc, q) => ({ ...acc, [q.key]: q.value }),
              {},
            ) || {},
          body,
          preRequestScript,
          postRequestScript,
        });
      } else if (item.item) {
        // It's a folder, recurse
        requests.push(...this.extractRequestsFromPostman(item.item));
      }
    }
    return requests;
  }

  async exportToPostman(collection: CollectionEntity): Promise<any> {
    const items = collection.requests.map((req) => {
      const events: Array<{
        listen: string;
        script: {
          exec: string[];
          type: string;
        };
      }> = [];

      // Add pre-request script if exists
      if (req.preRequestScript) {
        events.push({
          listen: 'prerequest',
          script: {
            exec: req.preRequestScript.split('\n'),
            type: 'text/javascript',
          },
        });
      }

      // Add post-request (test) script if exists
      if (req.postRequestScript) {
        events.push({
          listen: 'test',
          script: {
            exec: req.postRequestScript.split('\n'),
            type: 'text/javascript',
          },
        });
      }

      return {
        name: req.name,
        event: events.length > 0 ? events : undefined,
        request: {
          method: req.method,
          header: Object.entries(req.headers || {}).map(([key, value]) => ({
            key,
            value,
          })),
          url: {
            raw: req.url,
            host: ['{{baseUrl}}'], // Placeholder
            path: req.url.split('/').filter((p) => p),
            query: Object.entries(req.queryParams || {}).map(
              ([key, value]) => ({
                key,
                value,
              }),
            ),
          },
          body: req.body
            ? {
                mode: 'raw',
                raw: req.body,
              }
            : undefined,
        },
      };
    });

    return {
      info: {
        name: collection.name,
        description: collection.description,
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: items,
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000',
        },
      ],
    };
  }
}
