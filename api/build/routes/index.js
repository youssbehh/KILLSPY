"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const usersRoutes_1 = __importDefault(require("./usersRoutes"));
const friendsRoutes_1 = __importDefault(require("./friendsRoutes"));
const inventoryRoutes_1 = __importDefault(require("./inventoryRoutes"));
const sessionRoutes_1 = __importDefault(require("./sessionRoutes"));
const rootRouter = (0, express_1.Router)();
rootRouter.use('/auth', authRoutes_1.default);
rootRouter.use('/users', usersRoutes_1.default);
rootRouter.use('/friends', friendsRoutes_1.default);
rootRouter.use('/inventory', inventoryRoutes_1.default);
rootRouter.use('/settings', sessionRoutes_1.default);
exports.default = rootRouter;
//# sourceMappingURL=index.js.map