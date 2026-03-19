"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawPlugin = exports.plugins = void 0;
exports.resolvePlugin = resolvePlugin;
exports.loadPluginSafe = loadPluginSafe;
exports.registerPlugin = registerPlugin;
const utils_1 = require("../git/utils");
const index_1 = __importDefault(require("./agency-os/index"));
const index_2 = __importDefault(require("./bmad/index"));
const index_3 = __importDefault(require("./generic/index"));
const index_4 = __importDefault(require("./raw/index"));
exports.rawPlugin = index_4.default;
const DETECT_TIMEOUT_MS = 2000;
const LOAD_TIMEOUT_MS = 2000;
const plugins = [
    index_1.default,
    index_2.default,
    index_3.default,
    index_4.default,
].sort((a, b) => b.priority - a.priority);
exports.plugins = plugins;
const pluginsByName = new Map(plugins.map(p => [p.name, p]));
/**
 * Resolve the best plugin for a given project root.
 * Checks config override first, then auto-detects by priority.
 * Each detect() has a 2-second timeout.
 */
async function resolvePlugin(rootPath, config) {
    // Check for manual override in config
    if (config?.plugin && pluginsByName.has(config.plugin)) {
        return pluginsByName.get(config.plugin);
    }
    // Also check config file
    if (!config?.plugin) {
        const fileConfig = await (0, utils_1.readJsonSafe)((0, utils_1.joinPath)(rootPath, 'agentflow.config.json'));
        if (fileConfig?.plugin && pluginsByName.has(fileConfig.plugin)) {
            return pluginsByName.get(fileConfig.plugin);
        }
    }
    // Auto-detect by priority, with timeout per plugin
    for (const plugin of plugins) {
        try {
            const detected = await (0, utils_1.withTimeout)(plugin.detect(rootPath), DETECT_TIMEOUT_MS, `Plugin "${plugin.name}" detect`);
            if (detected)
                return plugin;
        }
        catch {
            // Plugin detection failed or timed out, skip
        }
    }
    return index_4.default;
}
/**
 * Safely load a plugin's context. Falls back to raw plugin on failure.
 */
async function loadPluginSafe(plugin, rootPath) {
    try {
        return await (0, utils_1.withTimeout)(plugin.load(rootPath), LOAD_TIMEOUT_MS, `Plugin "${plugin.name}" load`);
    }
    catch {
        if (plugin.name !== 'raw') {
            try {
                return await index_4.default.load(rootPath);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
/**
 * Register a custom plugin at runtime.
 */
function registerPlugin(plugin) {
    plugins.push(plugin);
    plugins.sort((a, b) => b.priority - a.priority);
    pluginsByName.set(plugin.name, plugin);
}
//# sourceMappingURL=registry.js.map