"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authRoutes = (0, express_1.Router)();
authRoutes.post('/signup', authController_1.signup);
authRoutes.post('/login', authController_1.login);
authRoutes.get('/guest', authController_1.guest);
authRoutes.post('/logout/:id', authController_1.logout);
exports.default = authRoutes;
//# sourceMappingURL=authRoutes.js.map