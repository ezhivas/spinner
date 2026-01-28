import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentEntity } from '../environments/environment.entity';
import * as vm from 'vm';

interface PostRequestContext {
  response: {
    status: number;
    headers: Record<string, any>;
    data: any;
    json: () => any;
    text: () => string;
  };
  environment: {
    set: (key: string, value: any) => void;
    get: (key: string) => any;
  };
}

@Injectable()
export class PostRequestScriptService {
  // Blacklist of dangerous patterns - disabled for Electron mode
  private readonly DANGEROUS_PATTERNS: RegExp[] = [
    // All patterns commented out for Electron mode to allow Postman scripts
    // /\brequire\s*\(/gi,
    // /\bimport\s+/gi,
    // /\bprocess\./gi,
    // /\bglobal\./gi,
    // /\b__dirname\b/gi,
    // /\b__filename\b/gi,
    // /\beval\s*\(/gi,
    // /\bFunction\s*\(/gi,
    // /\bchild_process\b/gi,
    // /\bfs\./gi,
    // /\bexec\s*\(/gi,
    // /\bspawn\s*\(/gi,
    // /\bsetTimeout\s*\(/gi,
    // /\bsetInterval\s*\(/gi,
  ];

  constructor(
    @InjectRepository(EnvironmentEntity)
    private readonly envRepo: Repository<EnvironmentEntity>,
  ) {}

  /**
   * Validate script for dangerous patterns (public method)
   */
  validateScript(script: string): void {
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(script)) {
        throw new Error(
          `Security violation: Script contains forbidden pattern: ${pattern.source}`,
        );
      }
    }

    // Check script length (prevent massive scripts)
    if (script.length > 10000) {
      throw new Error('Script too long (max 10000 characters)');
    }
  }

  /**
   * Execute script in a sandboxed VM context with strict security
   */
  async executeScript(
    script: string,
    responseStatus: number,
    responseHeaders: Record<string, any>,
    responseBody: any,
    environment?: EnvironmentEntity,
  ): Promise<{
    success: boolean;
    error?: string;
    updatedVariables?: Record<string, string>;
  }> {
    if (!script || script.trim() === '') {
      return { success: true };
    }

    try {
      // 1. Validate script for dangerous patterns
      this.validateScript(script);

      // 2. Track variables to update (avoid direct DB access in sandbox)
      const pendingVariables: Record<string, string> = {};

      // 3. Create sandboxed pm context (limited API)
      const pm: PostRequestContext = {
        response: {
          status: responseStatus,
          headers: responseHeaders,
          data: responseBody,
          json: () => responseBody,
          text: () => JSON.stringify(responseBody),
        },
        environment: {
          set: (key: string, value: any) => {
            if (!environment) {
              throw new Error(
                'Cannot set environment variable: No environment selected. Please select an environment before running this request.',
              );
            }
            // Validate key/value
            if (
              typeof key !== 'string' ||
              key.length === 0 ||
              key.length > 100
            ) {
              throw new Error(
                'Invalid variable key: must be a non-empty string (max 100 characters)',
              );
            }
            const strValue = String(value);
            if (strValue.length > 10000) {
              throw new Error('Variable value too long (max 10000 characters)');
            }
            // Store for later (don't access DB from sandbox)
            pendingVariables[key] = strValue;
          },
          get: (key: string) => {
            if (!environment) {
              return undefined;
            }
            return environment.variables?.[key];
          },
        },
      };

      // 4. Create sandboxed context with ONLY safe globals
      const sandbox = {
        pm,
        console: {
          log: (...args: any[]) => console.log('[Script]', ...args),
          error: (...args: any[]) => console.error('[Script]', ...args),
          warn: (...args: any[]) => console.warn('[Script]', ...args),
        },
        JSON,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Math,
        Date,
        // Explicitly block dangerous globals
        require: undefined,
        process: undefined,
        global: undefined,
        globalThis: undefined,
        Buffer: undefined,
        setImmediate: undefined,
        clearImmediate: undefined,
      };

      // 5. Create VM context with timeout
      const context = vm.createContext(sandbox);

      // 6. Wrap script in async IIFE with try-catch to handle errors gracefully
      const wrappedScript = `
        (async function() {
          try {
            ${script}
          } catch (error) {
            // Re-throw with better error message
            throw new Error('Script error: ' + (error.message || String(error)));
          }
        })();
      `;

      // 7. Execute with strict timeout and resource limits
      const scriptObj = new vm.Script(wrappedScript, {
        filename: 'post-request-script.js',
      });

      const executionPromise = scriptObj.runInContext(context, {
        timeout: 5000, // 5 seconds max
        breakOnSigint: true,
      });

      // 8. Race against timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Script execution timeout (5 seconds)')),
          5000,
        );
      });

      await Promise.race([executionPromise, timeoutPromise]);

      // 9. Update environment variables in DB (outside sandbox)
      if (environment && Object.keys(pendingVariables).length > 0) {
        const newVariables = { ...environment.variables, ...pendingVariables };

        await this.envRepo.update(environment.id, {
          variables: newVariables,
        });

        environment.variables = newVariables;
      }

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
