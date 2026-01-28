import { HttpMethod, BodyType } from '../common/enums';
/**
 * DTO для создания нового запроса
 */
export declare class CreateRequestDto {
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    bodyType?: BodyType;
    postRequestScript?: string;
    collectionId?: number;
}
/**
 * DTO для обновления запроса
 */
export declare class UpdateRequestDto {
    name?: string;
    method?: HttpMethod;
    url?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    bodyType?: BodyType;
    postRequestScript?: string;
    collectionId?: number;
}
/**
 * Entity интерфейс для запроса (без TypeORM декораторов)
 */
export interface IRequest {
    id: number;
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    bodyType?: BodyType;
    collectionId?: number;
    postRequestScript?: string;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map