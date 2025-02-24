"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const friendsController_1 = require("../controllers/friendsController");
const friendsRoutes = (0, express_1.Router)();
friendsRoutes.post('/add', (0, authMiddleware_1.default)("1"), friendsController_1.addFriend);
friendsRoutes.get('/getByUser', (0, authMiddleware_1.default)("1"), friendsController_1.getFriendsByUserId);
friendsRoutes.get('/getBlockedFriends/:ID_User', (0, authMiddleware_1.default)("1"), friendsController_1.getBlockedFriends);
exports.default = friendsRoutes;
//# sourceMappingURL=friendsRoutes.js.map