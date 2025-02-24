"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const sessionController_1 = require("../controllers/sessionController");
const sessionRoutes = (0, express_1.Router)();
sessionRoutes.get('/get', (0, authMiddleware_1.default)("1"), sessionController_1.getSession);
sessionRoutes.post('/set', (0, authMiddleware_1.default)("1"), sessionController_1.setSessionDisconnected);
exports.default = sessionRoutes;
//# sourceMappingURL=sessionRoutes.js.map