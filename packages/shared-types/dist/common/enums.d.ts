/**
 * HTTP методы, поддерживаемые API клиентом
 */
export declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS"
}
/**
 * Типы тела запроса
 */
export declare enum BodyType {
    JSON = "json",
    TEXT = "text",
    FORM_DATA = "form-data",
    X_WWW_FORM_URLENCODED = "x-www-form-urlencoded",
    RAW = "raw",
    BINARY = "binary"
}
/**
 * Статусы выполнения запроса
 */
export declare enum RunStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    CANCELLED = "CANCELLED"
}
//# sourceMappingURL=enums.d.ts.map