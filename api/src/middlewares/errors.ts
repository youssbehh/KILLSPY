import { Request, Response, NextFunction } from "express";
import { HttpException } from "../utils/exceptions";

export const errorMiddleware = (error: HttpException, req:Request, res:Response, next:NextFunction) => {

    if(!error.message){
        error.message = "fatal error : errorMiddleware no error message attributed"
    }
    if(!error.errorCode){
        error.message = "fatal error : errorMiddleware no error errorCode attributed"
    }
    if(!error.statusCode){
        error.message = "fatal error : errorMiddleware no error statusCode attributed"
    }

    res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    })
}