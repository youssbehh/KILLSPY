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
exports.logout = exports.guest = exports.login = exports.signup = void 0;
const __1 = require("..");
const bcrypt_1 = require("bcrypt");
const jwt = __importStar(require("jsonwebtoken"));
const secrets_1 = require("../secrets");
const exceptions_1 = require("../utils/exceptions");
const signup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        let user = yield __1.prisma_client.users.findFirst({ where: { Email: email } });
        if (user) {
            return next(new exceptions_1.HttpException("Utilisateur déjà existant!", exceptions_1.ErrCodes.USER_ALREADY_EXISTS, exceptions_1.statusCodes.UNAUTHORIZED, null));
        }
        user = yield __1.prisma_client.users.create({
            data: {
                Username: username,
                Email: email,
                Password: (0, bcrypt_1.hashSync)(password, 10),
                MMR: 0,
                isGuest: false,
                CreatedAt: new Date()
            }
        });
        res.status(200).json({ user: {
                id: user.ID_User,
                username: user.Username,
                email: user.Email,
                mmr: user.MMR,
            } });
    }
    catch (e) {
        return next(new exceptions_1.HttpException("Erreur durant l'inscription", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.signup = signup;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, password } = req.body;
        // Validation de l'identifiant
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(identifier);
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const isUsername = usernameRegex.test(identifier);
        if (!isEmail && !isUsername) {
            return next(new exceptions_1.HttpException("Identifiant invalide!", exceptions_1.ErrCodes.INVALID_IDENTIFIER, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        // Recherche de l'utilisateur par email ou nom d'utilisateur
        let user = yield __1.prisma_client.users.findFirst({
            where: {
                OR: [
                    { Email: isEmail ? identifier : undefined },
                    { Username: isUsername ? identifier : undefined }
                ]
            }
        });
        if (!user) {
            return next(new exceptions_1.HttpException("Utilisateur introuvable !", exceptions_1.ErrCodes.USER_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        if (!(0, bcrypt_1.compare)(password, user.Password)) {
            return next(new exceptions_1.HttpException("Mot de passe incorrect !", exceptions_1.ErrCodes.INCORRECT_PASSWORD, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        if (user.archived) {
            return next(new exceptions_1.HttpException("Utilisateur Supprimé !", exceptions_1.ErrCodes.USER_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        // Vérifie si une session existe déjà pour cet utilisateur
        const existingSession = yield __1.prisma_client.session.findFirst({
            where: { ID_User: user.ID_User }
        });
        if (existingSession) {
            // 🔥 Mettre à jour la session existante
            yield __1.prisma_client.session.update({
                where: { ID_Session: existingSession.ID_Session },
                data: { Connected: true, LastConnection: new Date(), TotalLoginCount: existingSession.TotalLoginCount + 1 }
            });
        }
        else {
            // 🔥 Créer une nouvelle session si elle n'existe pas
            yield __1.prisma_client.session.create({
                data: { ID_User: user.ID_User, Connected: true, LastConnection: new Date(), TotalLoginCount: +1 }
            });
        }
        const token = jwt.sign({
            id: user.ID_User,
        }, secrets_1.JWT_SECRET);
        console.log(token);
        res.json({ user: {
                id: user.ID_User,
                username: user.Username,
                email: user.Email,
                mmr: user.MMR,
                guest: user.isGuest
            },
            token
        });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur durant la connexion.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.login = login;
const generateGuestUsername = () => __awaiter(void 0, void 0, void 0, function* () {
    while (true) {
        const randomNum = Math.floor(Math.random() * 100000);
        const guestUsername = `Guest${randomNum}`;
        const existingUser = yield __1.prisma_client.users.findFirst({
            where: { Username: guestUsername }
        });
        if (!existingUser)
            return guestUsername;
    }
});
const guest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = yield generateGuestUsername();
        const guest = yield __1.prisma_client.users.create({
            data: {
                Username: username,
                Email: username + "@killspy.com",
                Password: (0, bcrypt_1.hashSync)("guest", 10),
                MMR: 0,
                isGuest: true,
                CreatedAt: new Date(),
                archived: false,
                deletionDate: null
            }
        });
        // 🔥 Crée une session pour l'invité avec `Connected = true`
        yield __1.prisma_client.session.create({
            data: {
                ID_User: guest.ID_User,
                Connected: true,
                LastConnection: new Date(),
                TotalLoginCount: +1
            }
        });
        const token = jwt.sign({
            id: guest.ID_User,
        }, secrets_1.JWT_SECRET);
        console.log(token);
        res.json({ user: {
                id: guest.ID_User,
                username: guest.Username,
                mmr: guest.MMR,
                guest: guest.isGuest
            },
            token
        });
    }
    catch (e) {
        return next(new exceptions_1.HttpException("Erreur compte invité", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.guest = guest;
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        if (!id) {
            return next(new exceptions_1.HttpException("Utilisateur non authentifié.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.UNAUTHORIZED, null));
        }
        const user = yield __1.prisma_client.users.findUnique({ where: { ID_User: userId } });
        if (!user) {
            return next(new exceptions_1.HttpException("Utilisateur introuvable.", exceptions_1.ErrCodes.USER_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        if (user.isGuest) {
            try {
                yield __1.prisma_client.session.deleteMany({ where: { ID_User: userId } });
                yield __1.prisma_client.users.delete({ where: { ID_User: userId } });
                console.log(`🗑️ Utilisateur invité supprimé : ${user.Username}`);
                res.status(200).json({ message: "Utilisateur invité supprimé." });
            }
            catch (error) {
                console.error("Erreur lors de la suppression de l'utilisateur invité :", error);
                return next(new exceptions_1.HttpException("Erreur lors de la suppression de l'invité.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, error));
            }
        }
        else {
            yield __1.prisma_client.session.updateMany({
                where: { ID_User: userId },
                data: { Connected: false, LastConnection: new Date() }
            });
            res.status(200).json({ message: "Déconnexion réussie." });
        }
    }
    catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
        return next(new exceptions_1.HttpException("Erreur de déconnexion.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, error));
    }
});
exports.logout = logout;
//# sourceMappingURL=authController.js.map