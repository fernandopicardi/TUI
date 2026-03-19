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
exports.createWorktree = createWorktree;
exports.removeWorktree = removeWorktree;
exports.getWorktreeLastModified = getWorktreeLastModified;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const simple_git_1 = require("simple-git");
const utils_1 = require("./utils");
const worktrees_1 = require("./worktrees");
/**
 * Create a new git worktree with a new branch.
 * The worktree is placed as a sibling directory to rootPath.
 */
async function createWorktree(rootPath, branchName) {
    const git = (0, simple_git_1.simpleGit)((0, utils_1.normalizePath)(rootPath));
    const repoName = await (0, worktrees_1.getRepoNameFromGit)(rootPath);
    const parentDir = (0, utils_1.getDirname)(rootPath);
    const worktreePath = (0, utils_1.normalizePath)(path.join(parentDir, `${repoName}-${branchName}`));
    await git.raw(['worktree', 'add', '-b', branchName, worktreePath]);
    return {
        path: worktreePath,
        branch: branchName,
        head: '',
        isMain: false,
    };
}
/**
 * Remove a git worktree. Uses --force to handle uncommitted changes.
 */
async function removeWorktree(rootPath, worktreePath) {
    const git = (0, simple_git_1.simpleGit)((0, utils_1.normalizePath)(rootPath));
    const normalized = (0, utils_1.normalizePath)(worktreePath);
    try {
        await git.raw(['worktree', 'remove', '--force', normalized]);
    }
    catch (err) {
        // If worktree path no longer exists, just prune
        if (!(await (0, utils_1.pathExists)(normalized))) {
            await git.raw(['worktree', 'prune']);
            return;
        }
        throw err;
    }
}
/**
 * Get the last modified time of a worktree by checking the most recent file.
 * Excludes .git, node_modules, dist directories.
 */
async function getWorktreeLastModified(worktreePath) {
    const normalized = (0, utils_1.normalizePath)(worktreePath);
    const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.next', '.cache']);
    let latestMtime = new Date(0);
    async function scan(dir, depth) {
        if (depth > 3)
            return;
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (ignoredDirs.has(entry.name))
                    continue;
                const fullPath = path.join(dir, entry.name);
                try {
                    const stat = await fs.promises.stat(fullPath);
                    if (stat.mtime > latestMtime) {
                        latestMtime = stat.mtime;
                    }
                    if (entry.isDirectory()) {
                        await scan(fullPath, depth + 1);
                    }
                }
                catch {
                    // Skip inaccessible files
                }
            }
        }
        catch {
            // Skip inaccessible directories
        }
    }
    await scan(normalized, 0);
    return latestMtime;
}
//# sourceMappingURL=operations.js.map