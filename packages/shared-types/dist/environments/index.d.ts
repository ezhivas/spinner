/**
 * DTO для создания окружения
 */
export declare class CreateEnvironmentDto {
    name: string;
    variables?: Record<string, string>;
}
/**
 * DTO для обновления окружения
 */
export declare class UpdateEnvironmentDto {
    name?: string;
    variables?: Record<string, string>;
}
/**
 * Entity интерфейс для окружения
 */
export interface IEnvironment {
    id: number;
    name: string;
    variables: Record<string, string>;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map