"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAgentStatus = detectAgentStatus;
const utils_1 = require("../git/utils");
const process_1 = require("./process");
/**
 * Detect the agent status for a worktree.
 * Combines file modification time and process detection.
 *
 * - Modified < 15s ago → 'working'
 * - Modified 15-60s ago → 'waiting'
 * - Modified > 60s ago → 'idle'
 * - Node process with worktree path confirmed → reinforces 'working'
 */
async function detectAgentStatus(worktree, lastModifiedTime) {
    const now = Date.now();
    // Check file modification time
    if (lastModifiedTime) {
        const elapsed = now - lastModifiedTime;
        if (elapsed < 15000)
            return 'working';
        if (elapsed < 60000)
            return 'waiting';
    }
    // Try process detection as reinforcement
    try {
        const processes = await (0, process_1.getRunningNodeProcesses)();
        const normalizedWtPath = (0, utils_1.normalizePath)(worktree.path).toLowerCase();
        const hasProcess = processes.some(cmd => cmd.toLowerCase().includes(normalizedWtPath));
        if (hasProcess)
            return 'working';
    }
    catch {
        // Process detection failed, rely on file modification time only
    }
    return 'idle';
}
//# sourceMappingURL=status.js.map