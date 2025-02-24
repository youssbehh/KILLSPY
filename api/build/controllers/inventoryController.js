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
exports.myInventory = exports.addInventory = void 0;
const __1 = require("..");
const exceptions_1 = require("../utils/exceptions");
const addInventory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const {} = req.body;
        const userId = req.user.id;
        const client = yield __1.prisma_client.users.findFirst({ where: { ID_User: userId } });
        if (!client)
            return next(new exceptions_1.HttpException("Utilisateur introuvable!", exceptions_1.ErrCodes.USER_NOT_FOUND, exceptions_1.statusCodes.NOT_FOUND, null));
        const record = yield __1.prisma_client.inventory.create({
            data: {
                Money: 0,
                Qty: 0,
                User: {
                    connect: { ID_User: userId }
                }
            }
        });
        res.status(200).json({ message: "Remboursement du prêt \"" + record + "\" bien créé!" });
    }
    catch (e) {
        return next(new exceptions_1.HttpException("Erreur durant l'ajout d'un remboursement", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.addInventory = addInventory;
const myInventory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const records = yield __1.prisma_client.inventory.findMany({
            where: {
                User: {
                    ID_User: req.user.id
                }
            },
            select: {
                ID_Inventory: true,
                Money: true,
                Qty: true,
                User: {
                    select: {
                        ID_User: true,
                    }
                }
            }
        });
        if (!records)
            return next(new exceptions_1.HttpException("Aucun inventaire trouvé.", exceptions_1.ErrCodes.UNAUTHORIZED_ACCESS, exceptions_1.statusCodes.NOT_FOUND, null));
        res.status(200).json({ msg: "Inventaire bien trouvés.", records });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la récupération de inventaire.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.myInventory = myInventory;
//# sourceMappingURL=inventoryController.js.map