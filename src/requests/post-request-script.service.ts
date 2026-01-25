import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentEntity } from '../environments/environment.entity';

interface PostRequestContext {
  response: {
    status: number;
    headers: Record<string, any>;
    data: any;
    json: () => any;
    text: () => string;
  };
  environment: {
    set: (key: string, value: any) => Promise<void>;
    get: (key: string) => any;
  };
}

@Injectable()
export class PostRequestScriptService {
  constructor(
    @InjectRepository(EnvironmentEntity)
    private readonly envRepo: Repository<EnvironmentEntity>,
  ) {}

  async executeScript(
    script: string,
    responseStatus: number,
    responseHeaders: Record<string, any>,
    responseBody: any,
    environment?: EnvironmentEntity,
  ): Promise<{ success: boolean; error?: string; updatedVariables?: Record<string, string> }> {
    if (!script || script.trim() === '') {
      return { success: true };
    }

    try {
      // Create pm context object (Postman-like API)
      const pm: PostRequestContext = {
        response: {
          status: responseStatus,
          headers: responseHeaders,
          data: responseBody,
          json: () => responseBody,
          text: () => JSON.stringify(responseBody),
        },
        environment: {
          set: async (key: string, value: any) => {
            if (!environment) {
              throw new Error('No environment selected. Please select an environment to use pm.environment.set()');
            }

            // Update environment variables
            const variables = environment.variables || {};
            variables[key] = String(value);

            // Save to database
            await this.envRepo.update(environment.id, {
              variables,
            });

            // Update local reference
            environment.variables = variables;
          },
          get: (key: string) => {
            if (!environment) {
              return undefined;
            }
            return environment.variables?.[key];
          },
        },
      };

      // Execute script in safe context
      // Using AsyncFunction to support async/await in user scripts
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const userFunction = new AsyncFunction('pm', script);

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Script execution timeout (5 seconds)')), 5000);
      });

      await Promise.race([
        userFunction(pm),
        timeoutPromise,
      ]);

      return {
        success: true,
        updatedVariables: environment?.variables,
      };
    } catch (error: any) {
      console.error('Post-request script execution error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during script execution',
      };
    }
  }
}
