"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorktrees = listWorktrees;
exports.watchWorktrees = watchWorktrees;
exports.getCurrentBranch = getCurrentBranch;
exports.getRepoNameFromGit = getRepoNameFromGit;
const simple_git_1 = require("simple-git");
const utils_1 = require("./utils");
/**
 * List all worktrees for a git repository.
 * Uses `git worktree list --porcelain` via simple-git.
 */
async function listWorktrees(rootPath) {
    const git = (0, simple_git_1.simpleGit)((0, utils_1.normalizePath)(rootPath));
    const raw = await git.raw(['worktree', 'list', '--porcelain']);
    const blocks = raw.trim().split(/\r?\n\r?\n/).filter(Boolean);
    const worktrees = [];
    for (let idx = 0; idx < blocks.length; idx++) {
        const block = blocks[idx];
        const lines = block.split(/\r?\n/);
        let wtPath = '';
        let branch = '';
        let head = '';
        let isMain = false;
        for (const line of lines) {
            if (line.startsWith('worktree ')) {
                wtPath = (0, utils_1.normalizePath)(line.slice('worktree '.length));
            }
            else if (line.startsWith('HEAD ')) {
                head = line.slice('HEAD '.length);
            }
            else if (line.startsWith('branch ')) {
                const ref = line.slice('branch '.length);
                branch = ref.replace('refs/heads/', '');
            }
            else if (line === 'bare') {
                isMain = true;
            }
        }
        // First worktree in the list is always the main one
        if (idx === 0) {
            isMain = true;
        }
        worktrees.push({ path: wtPath, branch, head, isMain });
    }
    return worktrees;
}
/**
 * Watch worktrees by polling at a configurable interval.
 * Calls onChange when the worktree list changes.
 * Returns a cleanup function.
 */
function watchWorktrees(rootPath, onChange, interval) {
    let prevJson = '';
    let stopped = false;
    const poll = async () => {
        if (stopped)
            return;
        try {
            const wts = await listWorktrees(rootPath);
            const json = JSON.stringify(wts.map(w => ({ p: w.path, b: w.branch, h: w.head, m: w.isMain })));
            if (json !== prevJson) {
                prevJson = json;
                onChange(wts);
            }
        }
        catch {
            // Silently ignore polling errors
        }
    };
    poll();
    const timer = setInterval(poll, interval);
    return () => {
        stopped = true;
        clearInterval(timer);
    };
}
/**
 * Get the current branch name.
 */
async function getCurrentBranch(rootPath) {
    const git = (0, simple_git_1.simpleGit)((0, utils_1.normalizePath)(rootPath));
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
}
/**
 * Get the repo name from the root path (via git rev-parse).
 */
async function getRepoNameFromGit(rootPath) {
    const git = (0, simple_git_1.simpleGit)((0, utils_1.normalizePath)(rootPath));
    const toplevel = await git.revparse(['--show-toplevel']);
    const normalized = (0, utils_1.normalizePath)(toplevel.trim());
    return normalized.split(/[\\/]/).pop() || 'unknown';
}
//# sourceMappingURL=worktrees.js.map