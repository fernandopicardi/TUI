"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAgencyOS = detectAgencyOS;
const fs = __importStar(require("fs"));
const utils_1 = require("../../git/utils");
async function detectAgencyOS(rootPath) {
    // 1. Check for agency/clients/ directory
    if (await (0, utils_1.dirExists)((0, utils_1.joinPath)(rootPath, 'agency', 'clients'))) {
        return true;
    }
    // 2. Check for agency/ with subdirs containing profile.md
    const agencyPath = (0, utils_1.joinPath)(rootPath, 'agency');
    if (await (0, utils_1.dirExists)(agencyPath)) {
        try {
            const entries = await fs.promises.readdir(agencyPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const profilePath = (0, utils_1.joinPath)(agencyPath, entry.name, 'profile.md');
                    try {
                        await fs.promises.access(profilePath);
                        return true;
                    }
                    catch {
                        // continue checking
                    }
                }
            }
        }
        catch {
            // ignore
        }
    }
    return false;
}
//# sourceMappingURL=detect.js.map