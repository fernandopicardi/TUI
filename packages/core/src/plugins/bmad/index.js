"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detect_1 = require("./detect");
const reader_1 = require("./reader");
const bmadPlugin = {
    name: 'bmad',
    priority: 90,
    detect: detect_1.detectBMAD,
    async load(rootPath) {
        const data = await (0, reader_1.readBmadData)(rootPath);
        return {
            pluginName: 'bmad',
            summary: `BMAD — ${data.agents.length} agente(s)`,
            data: { ...data },
        };
    },
};
exports.default = bmadPlugin;
//# sourceMappingURL=index.js.map