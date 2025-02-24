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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma = new client_1.PrismaClient();
const deleteMarkedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersToDelete = yield prisma.users.findMany({
        where: {
            archived: true,
            deletionDate: {
                lte: thirtyDaysAgo
            }
        }
    });
    for (const user of usersToDelete) {
        yield prisma.users.delete({
            where: { ID_User: user.ID_User }
        });
        console.log(`Utilisateur supprimé : ${user.Username}`);
    }
});
// Exécutez la fonction toutes les 24 heures
node_cron_1.default.schedule('0 0 * * *', deleteMarkedUsers); // Exécute tous les jours à minuit
//# sourceMappingURL=cronJobs.js.map