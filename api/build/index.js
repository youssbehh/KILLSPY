"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = exports.prisma_client = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const secrets_1 = require("./secrets");
const routes_1 = __importDefault(require("./routes"));
const errors_1 = require("./middlewares/errors");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', routes_1.default);
exports.prisma_client = new client_1.PrismaClient({
    log: ['error', 'info', 'warn'],
    errorFormat: 'pretty',
});
app.use(errors_1.errorMiddleware);
// Démarrer le serveur et l'exporter
const server = app.listen(secrets_1.PORT, () => {
    console.log("server running port : ", secrets_1.PORT);
});
exports.server = server;
//# sourceMappingURL=index.js.map