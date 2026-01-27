/**
 * DTO для создания коллекции
 */
export declare class CreateCollectionDto {
    name: string;
    description?: string;
}
/**
 * DTO для обновления коллекции
 */
export declare class UpdateCollectionDto {
    name?: string;
    description?: string;
}
/**
 * Entity интерфейс для коллекции
 */
export interface ICollection {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    requests?: any[];
}
//# sourceMappingURL=index.d.ts.map