"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const inventoryController_1 = require("../controllers/inventoryController");
const inventoryRoutes = (0, express_1.Router)();
inventoryRoutes.post('/add', (0, authMiddleware_1.default)("1"), inventoryController_1.addInventory);
inventoryRoutes.get('/myInventory', (0, authMiddleware_1.default)("1"), inventoryController_1.myInventory);
exports.default = inventoryRoutes;
//# sourceMappingURL=inventoryRoutes.js.map