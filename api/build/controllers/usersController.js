"use strict";
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
exports.deleteUser = exports.updateUsername = exports.getUsersById = exports.addUser = void 0;
const __1 = require("..");
const exceptions_1 = require("../utils/exceptions");
const bcrypt_1 = require("bcrypt");
const addUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return next(new exceptions_1.HttpException("Tous les champs sont requis.", exceptions_1.ErrCodes.BAD_REQUEST, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        const sanitizedUsername = (username.replace(/\s+/g, '')).toUpperCase();
        let user = yield __1.prisma_client.users.findFirst({
            where: {
                OR: [
                    { Username: sanitizedUsername }
                ]
            }
        });
        if (user) {
            return next(new exceptions_1.HttpException("Utilisateur déjà créé!", exceptions_1.ErrCodes.USER_ALREADY_EXISTS, exceptions_1.statusCodes.UNAUTHORIZED, null));
        }
        user = yield __1.prisma_client.users.create({
            data: {
                ID_User: req.user.id,
                Username: sanitizedUsername,
                Email: email,
                Password: (0, bcrypt_1.hashSync)(password, 10),
                MMR: 0
            }
        });
        res.status(200).json({ msg: "Utilisateur bien créé!" });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la création d'un utilisateur.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.addUser = addUser;
const getUsersById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield __1.prisma_client.users.findMany({ where: { ID_User: req.user.id } });
        if (!users)
            return next(new exceptions_1.HttpException("Aucun utilisateur trouvé.", exceptions_1.ErrCodes.UNAUTHORIZED_ACCESS, exceptions_1.statusCodes.NOT_FOUND, null));
        res.status(200).json({ msg: "Utilisateurs bien trouvés.", users });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la récupération des utilisateurs.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.getUsersById = getUsersById;
const updateUsername = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { oldUser } = req.params; // Le nouveau nom d'utilisateur doit être passé dans les paramètres
        const { newUsername } = req.body; // Le nouveau nom d'utilisateur doit être passé dans le corps de la requête
        if (!oldUser || !newUsername) {
            return next(new exceptions_1.HttpException("Nom d'utilisateur actuel et nouveau nom d'utilisateur requis.", exceptions_1.ErrCodes.BAD_REQUEST, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        // Vérifiez si l'utilisateur existe
        const user = yield __1.prisma_client.users.findUnique({
            where: { ID_User: req.user.ID_User } // Assurez-vous que l'utilisateur est authentifié
        });
        if (!user) {
            return next(new exceptions_1.HttpException("Utilisateur introuvable.", exceptions_1.ErrCodes.UNAUTHORIZED_ACCESS, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        // Vérifiez si l'utilisateur est un invité
        if (user.isGuest) {
            return next(new exceptions_1.HttpException("Les utilisateurs invités ne peuvent pas changer leur nom d'utilisateur.", exceptions_1.ErrCodes.IS_GUEST, exceptions_1.statusCodes.FORBIDDEN, null));
        }
        // Mettre à jour le nom d'utilisateur
        const updatedUser = yield __1.prisma_client.users.update({
            where: { ID_User: req.user.ID_User },
            data: { Username: newUsername }
        });
        res.status(200).json({ msg: "Nom d'utilisateur mis à jour avec succès.", user: updatedUser });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur lors de la mise à jour du nom d'utilisateur.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.updateUsername = updateUsername;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        // Vérifiez si l'utilisateur existe
        const user = yield __1.prisma_client.users.findUnique({
            where: { ID_User: userId }
        });
        if (!user) {
            return next(new exceptions_1.HttpException("Utilisateur introuvable.", exceptions_1.ErrCodes.UNAUTHORIZED_ACCESS, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        // Marquer l'utilisateur comme supprimé
        yield __1.prisma_client.users.update({
            where: { ID_User: req.user.ID_User },
            data: {
                archived: true,
                deletionDate: new Date() // Enregistrer la date de la demande de suppression
            }
        });
        res.status(200).json({ msg: "Demande de suppression de compte enregistrée. Votre compte sera supprimé dans 30 jours." });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur lors de la demande de suppression du compte.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.deleteUser = deleteUser;
//# sourceMappingURL=usersController.js.map