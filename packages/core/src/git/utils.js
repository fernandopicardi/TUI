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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = normalizePath;
exports.joinPath = joinPath;
exports.resolvePath = resolvePath;
exports.getBasename = getBasename;
exports.getDirname = getDirname;
exports.getRepoRoot = getRepoRoot;
exports.getRepoName = getRepoName;
exports.pathExists = pathExists;
exports.dirExists = dirExists;
exports.fileExists = fileExists;
exports.readFileSafe = readFileSafe;
exports.readJsonSafe = readJsonSafe;
exports.listDirs = listDirs;
exports.splitLines = splitLines;
exports.withTimeout = withTimeout;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Normalize a path using Node's path.normalize — never hardcode separators.
 */
function normalizePath(p) {
    return path.normalize(p);
}
/**
 * Join path segments safely.
 */
function joinPath(...segments) {
    return path.join(...segments);
}
/**
 * Resolve path segments to absolute.
 */
function resolvePath(...segments) {
    return path.resolve(...segments);
}
/**
 * Get basename of a path.
 */
function getBasename(p) {
    return path.basename(normalizePath(p));
}
/**
 * Get dirname of a path.
 */
function getDirname(p) {
    return path.dirname(normalizePath(p));
}
/**
 * Get the git repo root by walking up directories.
 */
async function getRepoRoot(cwd) {
    let current = path.resolve(cwd);
    while (true) {
        const gitDir = path.join(current, '.git');
        try {
            await fs.promises.access(gitDir);
            return current;
        }
        catch {
            const parent = path.dirname(current);
            if (parent === current)
                return null;
            current = parent;
        }
    }
}
/**
 * Extract repo name from a root path.
 */
function getRepoName(rootPath) {
    return path.basename(normalizePath(rootPath)) || 'unknown';
}
/**
 * Check if a path exists on disk.
 */
async function pathExists(p) {
    try {
        await fs.promises.access(normalizePath(p));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if a path is a directory.
 */
async function dirExists(dirPath) {
    try {
        const stat = await fs.promises.stat(normalizePath(dirPath));
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Check if a file exists.
 */
async function fileExists(filePath) {
    try {
        const stat = await fs.promises.stat(normalizePath(filePath));
        return stat.isFile();
    }
    catch {
        return false;
    }
}
/**
 * Read a file safely, returning null on error.
 */
async function readFileSafe(filePath) {
    try {
        return await fs.promises.readFile(normalizePath(filePath), 'utf-8');
    }
    catch {
        return null;
    }
}
/**
 * Read and parse JSON safely, returning null on error.
 */
async function readJsonSafe(filePath) {
    const content = await readFileSafe(filePath);
    if (!content)
        return null;
    try {
        return JSON.parse(content);
    }
    catch {
        console.error(`[agentflow] Warning: Invalid JSON in ${filePath}, using defaults`);
        return null;
    }
}
/**
 * List subdirectory names in a directory.
 */
async function listDirs(dirPath) {
    try {
        const entries = await fs.promises.readdir(normalizePath(dirPath), { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    }
    catch {
        return [];
    }
}
/**
 * Split file content by lines, handling both \n and \r\n.
 */
function splitLines(content) {
    return content.split(/\r?\n/);
}
/**
 * Wrap a promise with a timeout. Rejects if the promise doesn't resolve within ms.
 */
function withTimeout(promise, ms, label = 'Operation') {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
        promise.then(value => { clearTimeout(timer); resolve(value); }, err => { clearTimeout(timer); reject(err); });
    });
}
//# sourceMappingURL=utils.js.map