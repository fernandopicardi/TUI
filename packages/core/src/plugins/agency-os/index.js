"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detect_1 = require("./detect");
const reader_1 = require("./reader");
const utils_1 = require("../../git/utils");
const agencyOSPlugin = {
    name: 'agency-os',
    priority: 100,
    detect: detect_1.detectAgencyOS,
    async load(rootPath) {
        const clientsPath = (0, utils_1.joinPath)(rootPath, 'agency', 'clients');
        const clients = await (0, reader_1.readClients)(clientsPath);
        return {
            pluginName: 'agency-os',
            summary: `Agency OS — ${clients.length} cliente(s) ativo(s)`,
            data: { clients },
        };
    },
};
exports.default = agencyOSPlugin;
//# sourceMappingURL=index.js.map