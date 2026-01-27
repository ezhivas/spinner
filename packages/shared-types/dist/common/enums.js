"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunStatus = exports.BodyType = exports.HttpMethod = void 0;
/**
 * HTTP методы, поддерживаемые API клиентом
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PATCH"] = "PATCH";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["OPTIONS"] = "OPTIONS";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
/**
 * Типы тела запроса
 */
var BodyType;
(function (BodyType) {
    BodyType["JSON"] = "json";
    BodyType["TEXT"] = "text";
    BodyType["FORM_DATA"] = "form-data";
    BodyType["X_WWW_FORM_URLENCODED"] = "x-www-form-urlencoded";
    BodyType["RAW"] = "raw";
    BodyType["BINARY"] = "binary";
})(BodyType || (exports.BodyType = BodyType = {}));
/**
 * Статусы выполнения запроса
 */
var RunStatus;
(function (RunStatus) {
    RunStatus["PENDING"] = "pending";
    RunStatus["RUNNING"] = "running";
    RunStatus["COMPLETED"] = "completed";
    RunStatus["FAILED"] = "failed";
})(RunStatus || (exports.RunStatus = RunStatus = {}));
