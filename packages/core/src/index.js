"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBmadData = exports.readClients = exports.withTimeout = exports.splitLines = exports.listDirs = exports.readJsonSafe = exports.readFileSafe = exports.fileExists = exports.dirExists = exports.pathExists = exports.getRepoName = exports.getRepoRoot = exports.getDirname = exports.getBasename = exports.resolvePath = exports.joinPath = exports.normalizePath = void 0;
// Types
__exportStar(require("./types/worktree"), exports);
__exportStar(require("./types/agent"), exports);
__exportStar(require("./types/plugin"), exports);
__exportStar(require("./types/config"), exports);
// Git
__exportStar(require("./git/worktrees"), exports);
__exportStar(require("./git/operations"), exports);
var utils_1 = require("./git/utils");
Object.defineProperty(exports, "normalizePath", { enumerable: true, get: function () { return utils_1.normalizePath; } });
Object.defineProperty(exports, "joinPath", { enumerable: true, get: function () { return utils_1.joinPath; } });
Object.defineProperty(exports, "resolvePath", { enumerable: true, get: function () { return utils_1.resolvePath; } });
Object.defineProperty(exports, "getBasename", { enumerable: true, get: function () { return utils_1.getBasename; } });
Object.defineProperty(exports, "getDirname", { enumerable: true, get: function () { return utils_1.getDirname; } });
Object.defineProperty(exports, "getRepoRoot", { enumerable: true, get: function () { return utils_1.getRepoRoot; } });
Object.defineProperty(exports, "getRepoName", { enumerable: true, get: function () { return utils_1.getRepoName; } });
Object.defineProperty(exports, "pathExists", { enumerable: true, get: function () { return utils_1.pathExists; } });
Object.defineProperty(exports, "dirExists", { enumerable: true, get: function () { return utils_1.dirExists; } });
Object.defineProperty(exports, "fileExists", { enumerable: true, get: function () { return utils_1.fileExists; } });
Object.defineProperty(exports, "readFileSafe", { enumerable: true, get: function () { return utils_1.readFileSafe; } });
Object.defineProperty(exports, "readJsonSafe", { enumerable: true, get: function () { return utils_1.readJsonSafe; } });
Object.defineProperty(exports, "listDirs", { enumerable: true, get: function () { return utils_1.listDirs; } });
Object.defineProperty(exports, "splitLines", { enumerable: true, get: function () { return utils_1.splitLines; } });
Object.defineProperty(exports, "withTimeout", { enumerable: true, get: function () { return utils_1.withTimeout; } });
// Agents
__exportStar(require("./agents/status"), exports);
__exportStar(require("./agents/process"), exports);
// Config
__exportStar(require("./config/loader"), exports);
// Plugins
__exportStar(require("./plugins/registry"), exports);
var reader_1 = require("./plugins/agency-os/reader");
Object.defineProperty(exports, "readClients", { enumerable: true, get: function () { return reader_1.readClients; } });
var reader_2 = require("./plugins/bmad/reader");
Object.defineProperty(exports, "readBmadData", { enumerable: true, get: function () { return reader_2.readBmadData; } });
//# sourceMappingURL=index.js.map