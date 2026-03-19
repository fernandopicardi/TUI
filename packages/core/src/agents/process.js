"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunningNodeProcesses = getRunningNodeProcesses;
const execa_1 = require("execa");
/**
 * Get running Node.js process command lines on Windows.
 * Uses wmic with a 1-second timeout — returns empty array if it takes longer.
 */
async function getRunningNodeProcesses() {
    try {
        const { stdout } = await (0, execa_1.execa)('wmic', ['process', 'where', 'name="node.exe"', 'get', 'commandline'], { timeout: 1000 });
        return stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && line !== 'CommandLine');
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=process.js.map