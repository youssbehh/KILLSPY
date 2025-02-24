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
exports.setSessionDisconnected = exports.getSession = void 0;
const exceptions_1 = require("../utils/exceptions");
const getSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req);
        res.status(200).json({ msg: "getSession atteint." });
    }
    catch (e) {
        return next(new exceptions_1.HttpException("Erreur durant l'ajout d'un remboursement", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.getSession = getSession;
const setSessionDisconnected = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        res.status(200).json({ msg: "setSessionDisconnected atteint." });
    }
    catch (e) {
        console.log(e);
        return next(new exceptions_1.HttpException("Erreur dans la récupération des remboursements.", exceptions_1.ErrCodes.INTERNAL_SERVER_ERROR, exceptions_1.statusCodes.INTERNAL_SERVER_ERROR, e !== null && e !== void 0 ? e : null));
    }
});
exports.setSessionDisconnected = setSessionDisconnected;
//# sourceMappingURL=sessionController.js.map