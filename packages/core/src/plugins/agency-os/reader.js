"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readClients = readClients;
const utils_1 = require("../../git/utils");
/**
 * Read all clients from the agency clients directory.
 */
async function readClients(agencyPath) {
    const dirs = await (0, utils_1.listDirs)(agencyPath);
    const clients = [];
    for (const slug of dirs) {
        const clientPath = (0, utils_1.joinPath)(agencyPath, slug);
        // Extract name from profile.md — fallback to folder name
        let name = slug;
        const profile = await (0, utils_1.readFileSafe)((0, utils_1.joinPath)(clientPath, 'profile.md'));
        if (profile) {
            const firstLine = (0, utils_1.splitLines)(profile).find(l => l.trim().startsWith('#'));
            if (firstLine) {
                name = firstLine.replace(/^#+\s*/, '').trim() || slug;
            }
        }
        const hasActiveTests = await (0, utils_1.fileExists)((0, utils_1.joinPath)(clientPath, 'active-tests.md'));
        const hasWinner = await (0, utils_1.fileExists)((0, utils_1.joinPath)(clientPath, 'winners.md'));
        let hypothesisCount = 0;
        const hypothesisLog = await (0, utils_1.readFileSafe)((0, utils_1.joinPath)(clientPath, 'hypothesis-log.md'));
        if (hypothesisLog) {
            hypothesisCount = (hypothesisLog.match(/^- \[ \]/gm) || []).length;
        }
        // Determine loop status
        let loopStatus = 'inactive';
        if (hasWinner) {
            loopStatus = 'winner-ready';
        }
        else if (hasActiveTests) {
            loopStatus = 'active';
        }
        else if (hypothesisCount > 0) {
            loopStatus = 'waiting';
        }
        clients.push({
            id: slug,
            name,
            loopStatus,
            hypothesisCount,
            hasWinner,
        });
    }
    return clients;
}
//# sourceMappingURL=reader.js.map