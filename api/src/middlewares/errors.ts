import { Request, Response, NextFunction } from "express";
import { HttpException, ErrCodes, statusCodes } from "../utils/exceptions";

export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    const message = error.message || "Erreur interne du serveur";
    const errorCode = error.errorCode ?? ErrCodes.INTERNAL_SERVER_ERROR;
    const statusCode = error.statusCode ?? statusCodes.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json({
        message,
        errorCode,
        errors: error.errors ?? null
    });
}