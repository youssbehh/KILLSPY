"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../utils/exceptions");
const jwt = __importStar(require("jsonwebtoken"));
const secrets_1 = require("../secrets");
const __1 = require("..");
// Roles :
// 1 = USER
// 0 = ADMIN
// -1 = BANN
const authMiddleware = (role) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.headers.authorization;
        if (!token) {
            return next(new exceptions_1.HttpException("Token indisponible", exceptions_1.ErrCodes.TOKEN_INVALID, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        try {
            const payload = jwt.verify(token, secrets_1.JWT_SECRET);
            const user = yield __1.prisma_client.users.findFirst({ where: { ID_User: payload.userId } });
            if (!user) {
                return next(new exceptions_1.HttpException("Non autorisé!", exceptions_1.ErrCodes.UNAUTHORIZED_ACCESS, exceptions_1.statusCodes.BAD_REQUEST, null));
            }
            //if (payload.role != role) return next(new HttpException("Droit requis!", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.UNAUTHORIZED, null))
            req.user = user;
            return next();
        }
        catch (e) {
            console.log(e.message);
            return next(new exceptions_1.HttpException("Erreur dans la vérification d'authentification.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
        }
    });
};
exports.default = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map