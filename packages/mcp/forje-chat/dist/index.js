#!/usr/bin/env node
"use strict";
/**
 * ForjeGames MCP Server
 *
 * Build Roblox games from any MCP-compatible editor (Claude Code, Cursor, Windsurf, etc.)
 *
 * Tools:
 *   forje_build    — Send a prompt to ForjeGames AI and build in Roblox Studio
 *   forje_script   — Generate a Roblox Luau script
 *   forje_template — Use an instant template (castle, house, spaceship, etc.)
 *   forje_status   — Check Studio connection status
 *   forje_templates_list — List available instant templates
 *
 * Auth: FORJE_API_KEY environment variable (generate at forjegames.com/settings)
 * Transport: stdio (standard MCP transport for CLI tools)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = process.env.FORJE_API_URL || 'https://forjegames.com';
const API_KEY = process.env.FORJE_API_KEY || '';
if (!API_KEY) {
    process.stderr.write('[forje-mcp] WARNING: FORJE_API_KEY not set. Get one at forjegames.com/settings\n');
}
// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function forjePost(path, body) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`ForjeGames API error ${res.status}: ${text}`);
    }
    return res.json();
}
async function forjeGet(path) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`ForjeGames API error ${res.status}: ${text}`);
    }
    return res.json();
}
// ---------------------------------------------------------------------------
// Available instant templates
// ---------------------------------------------------------------------------
const INSTANT_TEMPLATES = [
    { id: 'castle', name: 'Medieval Castle', description: 'Multi-tower castle with walls, gate, and courtyard' },
    { id: 'modern_house', name: 'Modern House', description: 'Contemporary house with garage, pool area, and landscaping' },
    { id: 'spaceship', name: 'Spaceship', description: 'Sci-fi spacecraft with cockpit, engine, and hull details' },
    { id: 'pirate_ship', name: 'Pirate Ship', description: 'Sailing ship with masts, deck, and cannons' },
    { id: 'treehouse', name: 'Treehouse', description: 'Multi-level treehouse with bridges and platforms' },
    { id: 'race_track', name: 'Race Track', description: 'Racing circuit with turns, barriers, and grandstand' },
    { id: 'underwater_base', name: 'Underwater Base', description: 'Deep sea facility with dome, airlocks, and coral' },
    { id: 'wizard_tower', name: 'Wizard Tower', description: 'Magical tower with spiral rooms and enchanted details' },
    { id: 'japanese_temple', name: 'Japanese Temple', description: 'Traditional temple with torii gate, garden, and pagoda' },
    { id: 'space_station', name: 'Space Station', description: 'Orbital station with modules, solar panels, and docking bay' },
    { id: 'medieval_village', name: 'Medieval Village', description: 'Village with houses, market, well, and town square' },
    { id: 'pine_tree', name: 'Pine Tree', description: 'Detailed pine tree with trunk, branches, and foliage layers' },
    { id: 'mountain', name: 'Mountain', description: 'Rocky mountain with snow cap, paths, and caves' },
    { id: 'volcano', name: 'Volcano', description: 'Active volcano with crater, lava flow, and rock formations' },
    { id: 'robot', name: 'Robot', description: 'Mechanical robot with articulated limbs and glowing details' },
    { id: 'dragon', name: 'Dragon', description: 'Winged dragon with scales, horns, and fire effect' },
];
// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new mcp_js_1.McpServer({
    name: 'forje-games',
    version: '1.0.0',
});
// --- Tool: forje_build ---
server.tool('forje_build', 'Send a building prompt to ForjeGames AI. The AI generates Roblox Luau code and sends it to your connected Studio session. Use this for any custom build: houses, vehicles, terrain, NPCs, game systems, etc.', {
    prompt: zod_1.z.string().describe('What to build in Roblox Studio (e.g. "a medieval castle with towers and a moat")'),
    style: zod_1.z.string().optional().describe('Art style hint: realistic, cartoon, low-poly, sci-fi, fantasy, horror'),
    quality: zod_1.z.enum(['quick', 'normal', 'detailed']).optional().describe('Build quality — quick (10-20 parts), normal (30-50 parts), detailed (50-100+ parts)'),
}, async ({ prompt, style, quality }) => {
    try {
        const enhancedPrompt = [
            prompt,
            style ? `Style: ${style}` : '',
            quality === 'detailed' ? 'Make it very detailed with many parts.' : '',
            quality === 'quick' ? 'Keep it simple, under 20 parts.' : '',
        ]
            .filter(Boolean)
            .join('. ');
        const result = (await forjePost('/api/ai/chat', {
            message: enhancedPrompt,
            stream: false,
        }));
        const message = result.message || 'Build sent to Studio';
        const tokensUsed = result.tokensUsed || 0;
        return {
            content: [
                {
                    type: 'text',
                    text: `Build sent to Studio!\n\nPrompt: ${prompt}\nTokens used: ${tokensUsed}\n\n${message}`,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [{ type: 'text', text: `Build failed: ${err.message}` }],
            isError: true,
        };
    }
});
// --- Tool: forje_script ---
server.tool('forje_script', 'Generate a Roblox Luau script and send it to Studio. Use for game logic: NPCs, combat, inventory, UI, etc.', {
    prompt: zod_1.z.string().describe('What the script should do (e.g. "NPC that follows the player and sells items")'),
    script_type: zod_1.z
        .enum(['server', 'client', 'module'])
        .optional()
        .describe('Script type — server (ServerScriptService), client (StarterPlayerScripts), module (ReplicatedStorage)'),
}, async ({ prompt, script_type }) => {
    try {
        const enhancedPrompt = `Write a Roblox ${script_type || 'server'} script: ${prompt}`;
        const result = (await forjePost('/api/ai/chat', {
            message: enhancedPrompt,
            stream: false,
        }));
        const message = result.message || 'Script sent to Studio';
        const tokensUsed = result.tokensUsed || 0;
        return {
            content: [
                {
                    type: 'text',
                    text: `Script sent to Studio!\n\nType: ${script_type || 'server'}\nPrompt: ${prompt}\nTokens used: ${tokensUsed}\n\n${message}`,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [{ type: 'text', text: `Script failed: ${err.message}` }],
            isError: true,
        };
    }
});
// --- Tool: forje_template ---
server.tool('forje_template', 'Build an instant template in Roblox Studio. These are pre-made, high-quality builds that appear instantly.', {
    template: zod_1.z
        .string()
        .describe(`Template ID. Options: ${INSTANT_TEMPLATES.map((t) => t.id).join(', ')}`),
}, async ({ template }) => {
    try {
        const tmpl = INSTANT_TEMPLATES.find((t) => t.id === template);
        if (!tmpl) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Unknown template "${template}". Available: ${INSTANT_TEMPLATES.map((t) => `${t.id} (${t.name})`).join(', ')}`,
                    },
                ],
                isError: true,
            };
        }
        const result = (await forjePost('/api/ai/chat', {
            message: `/template ${template}`,
            stream: false,
        }));
        const message = result.message || `${tmpl.name} built!`;
        return {
            content: [
                {
                    type: 'text',
                    text: `${tmpl.name} sent to Studio!\n\n${tmpl.description}\n\n${message}`,
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [{ type: 'text', text: `Template failed: ${err.message}` }],
            isError: true,
        };
    }
});
// --- Tool: forje_status ---
server.tool('forje_status', 'Check your ForjeGames account status — Studio connection, token balance, subscription tier.', {}, async () => {
    try {
        const result = (await forjeGet('/api/mcp/status'));
        const lines = [
            '--- ForjeGames Status ---',
            `Connected to Studio: ${result.studioConnected ? 'Yes' : 'No'}`,
            `Token balance: ${result.tokenBalance ?? 'unknown'}`,
            `Subscription: ${result.tier ?? 'Free'}`,
        ];
        if (result.studioConnected && result.placeName) {
            lines.push(`Place: ${result.placeName}`);
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (err) {
        return {
            content: [
                { type: 'text', text: `Status check failed: ${err.message}` },
            ],
            isError: true,
        };
    }
});
// --- Tool: forje_templates_list ---
server.tool('forje_templates_list', 'List all available instant build templates with descriptions.', {}, async () => {
    const lines = INSTANT_TEMPLATES.map((t) => `• ${t.id} — ${t.name}: ${t.description}`);
    return {
        content: [
            {
                type: 'text',
                text: `Available Templates (${INSTANT_TEMPLATES.length}):\n\n${lines.join('\n')}\n\nUse forje_template with any ID to build instantly.`,
            },
        ],
    };
});
// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('[forje-mcp] ForjeGames MCP server running (stdio)\n');
}
main().catch((err) => {
    process.stderr.write(`[forje-mcp] Fatal: ${err}\n`);
    process.exit(1);
});
