import { Injectable } from '@nestjs/common';

@Injectable()
export class VariableResolverService {
  resolve(template: string, variables: Record<string, string>): string {
    if (!template) return template;

    return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
      return variables[key] ?? '';
    });
  }

  resolveObject<T extends Record<string, any>>(
    obj: T,
    variables: Record<string, string>,
  ): T {
    if (!obj) return obj;

    return JSON.parse(JSON.stringify(obj), (_, value) => {
      if (typeof value === 'string') {
        return this.resolve(value, variables);
      }
      return value;
    });
  }
}
