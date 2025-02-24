"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCodes = exports.ErrCodes = exports.HttpException = void 0;
class HttpException extends Error {
    constructor(msg, errorCode, statusCode, errors) {
        super(msg); // Appelle le constructeur de la classe "Error" (parent de la classe HttpException) et initie le message d'erreur
        this.msg = msg;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
exports.HttpException = HttpException;
var ErrCodes;
(function (ErrCodes) {
    ErrCodes[ErrCodes["BAD_REQUEST"] = 1000] = "BAD_REQUEST";
    ErrCodes[ErrCodes["USER_NOT_FOUND"] = 1001] = "USER_NOT_FOUND";
    ErrCodes[ErrCodes["USER_ALREADY_EXISTS"] = 1002] = "USER_ALREADY_EXISTS";
    ErrCodes[ErrCodes["INCORRECT_PASSWORD"] = 1003] = "INCORRECT_PASSWORD";
    ErrCodes[ErrCodes["INVALID_EMAIL"] = 1004] = "INVALID_EMAIL";
    ErrCodes[ErrCodes["UNAUTHORIZED_ACCESS"] = 1005] = "UNAUTHORIZED_ACCESS";
    ErrCodes[ErrCodes["ACCOUNT_LOCKED"] = 1006] = "ACCOUNT_LOCKED";
    ErrCodes[ErrCodes["SESSION_EXPIRED"] = 1007] = "SESSION_EXPIRED";
    ErrCodes[ErrCodes["TOKEN_INVALID"] = 1008] = "TOKEN_INVALID";
    ErrCodes[ErrCodes["DATABASE_ERROR"] = 1009] = "DATABASE_ERROR";
    ErrCodes[ErrCodes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    ErrCodes[ErrCodes["INVALID_IDENTIFIER"] = 2002] = "INVALID_IDENTIFIER";
    ErrCodes[ErrCodes["FRIENDS_NOT_FOUND"] = 3001] = "FRIENDS_NOT_FOUND";
    ErrCodes[ErrCodes["FRIEND_ALREADY_EXISTS"] = 3002] = "FRIEND_ALREADY_EXISTS";
    ErrCodes[ErrCodes["IS_GUEST"] = 3003] = "IS_GUEST";
})(ErrCodes || (exports.ErrCodes = ErrCodes = {}));
var statusCodes;
(function (statusCodes) {
    statusCodes[statusCodes["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    statusCodes[statusCodes["NOT_FOUND"] = 404] = "NOT_FOUND";
    statusCodes[statusCodes["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    statusCodes[statusCodes["FORBIDDEN"] = 403] = "FORBIDDEN";
    statusCodes[statusCodes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    statusCodes[statusCodes["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
    statusCodes[statusCodes["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
    statusCodes[statusCodes["OK"] = 200] = "OK";
    statusCodes[statusCodes["CREATED"] = 201] = "CREATED";
    statusCodes[statusCodes["NO_CONTENT"] = 204] = "NO_CONTENT";
    statusCodes[statusCodes["ACCEPTED"] = 202] = "ACCEPTED"; // Requête acceptée, mais non traitée
})(statusCodes || (exports.statusCodes = statusCodes = {}));
//# sourceMappingURL=exceptions.js.map