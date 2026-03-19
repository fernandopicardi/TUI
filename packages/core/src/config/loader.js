"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const config_1 = require("../types/config");
const utils_1 = require("../git/utils");
/**
 * Load and validate agentflow.config.json from the project root.
 * Returns DEFAULT_CONFIG merged with any valid fields from the file.
 * Invalid JSON is logged and ignored.
 */
async function loadConfig(rootPath) {
    const configPath = (0, utils_1.joinPath)(rootPath, 'agentflow.config.json');
    const loaded = await (0, utils_1.readJsonSafe)(configPath);
    if (!loaded)
        return { ...config_1.DEFAULT_CONFIG };
    return {
        ...config_1.DEFAULT_CONFIG,
        ...loaded,
    };
}
//# sourceMappingURL=loader.js.map