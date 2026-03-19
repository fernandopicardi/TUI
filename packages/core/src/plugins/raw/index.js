"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../git/utils");
const worktrees_1 = require("../../git/worktrees");
const rawPlugin = {
    name: 'raw',
    priority: 0,
    async detect() {
        return true;
    },
    async load(rootPath) {
        const repoName = (0, utils_1.getRepoName)(rootPath);
        const branch = await (0, worktrees_1.getCurrentBranch)(rootPath);
        const worktrees = await (0, worktrees_1.listWorktrees)(rootPath);
        return {
            pluginName: 'raw',
            summary: `${repoName} — ${branch}`,
            data: { repoName, branch, worktreeCount: worktrees.length },
        };
    },
};
exports.default = rawPlugin;
//# sourceMappingURL=index.js.map