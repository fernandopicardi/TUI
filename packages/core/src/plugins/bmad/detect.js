"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBMAD = detectBMAD;
const utils_1 = require("../../git/utils");
async function detectBMAD(rootPath) {
    // 1. Check for .bmad/ directory
    if (await (0, utils_1.dirExists)((0, utils_1.joinPath)(rootPath, '.bmad'))) {
        return true;
    }
    // 2. Check CLAUDE.md for BMAD mention
    const claudeMd = await (0, utils_1.readFileSafe)((0, utils_1.joinPath)(rootPath, 'CLAUDE.md'));
    if (claudeMd && /bmad/i.test(claudeMd)) {
        return true;
    }
    // 3. Check for .claude/agents/ directory
    if (await (0, utils_1.dirExists)((0, utils_1.joinPath)(rootPath, '.claude', 'agents'))) {
        return true;
    }
    return false;
}
//# sourceMappingURL=detect.js.map