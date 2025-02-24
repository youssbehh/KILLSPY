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
exports.getBlockedFriends = exports.getFriendsByUserId = exports.addFriend = void 0;
const __1 = require("..");
const exceptions_1 = require("../utils/exceptions");
const addFriend = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Username } = req.body;
        const myUserId = req.user.id;
        // Recherche l'utilisateur à ajouter par son username
        const friendToAdd = yield __1.prisma_client.users.findFirst({
            where: {
                Username: Username,
                NOT: {
                    ID_User: myUserId // Exclure l'utilisateur lui-même
                }
            }
        });
        if (!friendToAdd) {
            return next(new exceptions_1.HttpException("Utilisateur introuvable!", exceptions_1.ErrCodes.USER_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        }
        // Vérifie si l'amitié existe déjà
        const existingFriendship = yield __1.prisma_client.friends.findFirst({
            where: {
                AND: [
                    { ID_User: myUserId },
                    { ID_Friend: friendToAdd.ID_User }
                ]
            }
        });
        if (existingFriendship) {
            return next(new exceptions_1.HttpException("Cette amitié existe déjà!", exceptions_1.ErrCodes.FRIEND_ALREADY_EXISTS, exceptions_1.statusCodes.BAD_REQUEST, null));
        }
        // Crée la relation d'amitié
        const friend = yield __1.prisma_client.friends.create({
            data: {
                ID_User: myUserId,
                ID_Friend: friendToAdd.ID_User,
                Connected: false,
                Blocked: false
            }
        });
        res.status(200).json({ message: `L'utilisateur "${Username}" a bien été ajouté!` });
    }
    catch (e) {
        return next(new exceptions_1.HttpException("Erreur durant l'ajout d'un ami", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.addFriend = addFriend;
const getFriendsByUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const record = yield __1.prisma_client.friends.findMany({ where: { ID_User: req.user.id }, include: { User: true } });
        if (!record)
            return next(new exceptions_1.HttpException("Aucun ami.", exceptions_1.ErrCodes.FRIENDS_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        res.status(200).json({ msg: "Prêts bien trouvés.", record });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la récupération du client.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.getFriendsByUserId = getFriendsByUserId;
const getBlockedFriends = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ID_User } = req.params;
        if (!ID_User)
            return next(new exceptions_1.HttpException("Aucun client fournit.", exceptions_1.ErrCodes.BAD_REQUEST, exceptions_1.statusCodes.BAD_REQUEST, null));
        const record = yield __1.prisma_client.friends.findMany({
            where: {
                ID_User: req.user.id,
                Blocked: true,
            },
        });
        if (!record)
            return next(new exceptions_1.HttpException("Aucun ami.", exceptions_1.ErrCodes.FRIENDS_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        res.status(200).json({ msg: "L'ami bloqué " + ID_User + " bien trouvé.", record });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la récupération du client.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.getBlockedFriends = getBlockedFriends;
//# sourceMappingURL=friendsController.js.map