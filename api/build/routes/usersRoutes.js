"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersController_1 = require("../controllers/usersController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const usersRoutes = (0, express_1.Router)();
// usersRoutes.get('/', getOwnUser)
usersRoutes.post('/add', (0, authMiddleware_1.default)("1"), usersController_1.addUser);
usersRoutes.get('/myUsers', (0, authMiddleware_1.default)("1"), usersController_1.getUsersById);
usersRoutes.post('/update-username/:oldUser', (0, authMiddleware_1.default)("1"), usersController_1.updateUsername);
usersRoutes.put('/deleteUser/:id', (0, authMiddleware_1.default)("1"), usersController_1.deleteUser);
exports.default = usersRoutes;
//# sourceMappingURL=usersRoutes.js.map