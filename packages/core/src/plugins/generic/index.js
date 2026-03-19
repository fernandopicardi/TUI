"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../git/utils");
const worktrees_1 = require("../../git/worktrees");
const genericPlugin = {
    name: 'generic',
    priority: 10,
    async detect(rootPath) {
        return (0, utils_1.fileExists)((0, utils_1.joinPath)(rootPath, 'CLAUDE.md'));
    },
    async load(rootPath) {
        const content = await (0, utils_1.readFileSafe)((0, utils_1.joinPath)(rootPath, 'CLAUDE.md'));
        let projectName = 'Project';
        if (content) {
            const firstLine = (0, utils_1.splitLines)(content).find(l => l.trim().length > 0);
            if (firstLine) {
                projectName = firstLine.replace(/^#+\s*/, '').trim() || 'Project';
            }
        }
        const worktrees = await (0, worktrees_1.listWorktrees)(rootPath);
        return {
            pluginName: 'generic',
            summary: `${projectName} — ${worktrees.length} worktree(s)`,
            data: { projectName, worktreeCount: worktrees.length },
        };
    },
};
exports.default = genericPlugin;
//# sourceMappingURL=index.js.map