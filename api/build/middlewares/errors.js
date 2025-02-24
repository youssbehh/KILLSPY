"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (error, req, res, next) => {
    if (!error.message) {
        error.message = "fatal error : errorMiddleware no error message attributed";
    }
    if (!error.errorCode) {
        error.message = "fatal error : errorMiddleware no error errorCode attributed";
    }
    if (!error.statusCode) {
        error.message = "fatal error : errorMiddleware no error statusCode attributed";
    }
    res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errors.js.map