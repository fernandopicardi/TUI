"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBmadData = readBmadData;
const utils_1 = require("../../git/utils");
/**
 * Read BMAD workflow data from a project.
 */
async function readBmadData(rootPath) {
    let agents = [];
    // Try to list agents from .claude/agents/
    const agentsDir = (0, utils_1.joinPath)(rootPath, '.claude', 'agents');
    if (await (0, utils_1.dirExists)(agentsDir)) {
        agents = await (0, utils_1.listDirs)(agentsDir);
    }
    // Try to detect current phase from .bmad/
    let phase;
    const bmadDir = (0, utils_1.joinPath)(rootPath, '.bmad');
    if (await (0, utils_1.dirExists)(bmadDir)) {
        const statusFile = await (0, utils_1.readFileSafe)((0, utils_1.joinPath)(bmadDir, 'status.md'));
        if (statusFile) {
            const phaseLine = (0, utils_1.splitLines)(statusFile).find(l => /phase|fase/i.test(l));
            if (phaseLine) {
                phase = phaseLine.replace(/^[#\-*\s]+/, '').trim();
            }
        }
    }
    return { agents, phase };
}
//# sourceMappingURL=reader.js.map