/**
 * Discord Bug Auto-Tracker
 *
 * Polls bug channels, extracts bugs, maintains leaderboard,
 * posts updates to #beta-leaderboard and #beta-bug-log.
 *
 * Usage: npx tsx scripts/discord-bug-tracker.ts [--once] [--post]
 *   --once  Run once and exit (default: poll every 5 min)
 *   --post  Post leaderboard to Discord
 */

import { config as loadEnv } from 'dotenv';
loadEnv();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = "1495863063423746068";

// Channels to monitor for bugs
const BUG_CHANNELS: Record<string, string> = {
  "1495873976990306514": "beta-alpha-bugs",
  "1495873972162789478": "beta-bug-log",
  "1495873965498040361": "bug-reports",
  "1495873990919590100": "beta-bravo-bugs",
  "1495873998452560025": "beta-charlie-bugs",
  "1495874005041811548": "beta-delta-bugs",
  "1495874012528509058": "beta-echo-bugs",
};

// Channels to post updates to
const LEADERBOARD_CHANNEL = "1495873973228142632"; // beta-leaderboard
const BUG_LOG_CHANNEL = "1495873972162789478"; // beta-bug-log

interface BugReport {
  id: string;
  author: string;
  authorId: string;
  channel: string;
  channelName: string;
  content: string;
  title: string;
  severity: string;
  timestamp: string;
  attachments: number;
}

interface LeaderboardEntry {
  username: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

async function discordFetch(endpoint: string, options?: RequestInit) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }
  return res.json();
}

function extractTitle(content: string): string {
  // Try "Title: <text>" pattern
  const titleMatch = content.match(/Title:\s*\n?\s*(.+)/i);
  if (titleMatch) return titleMatch[1].trim().slice(0, 100);
  // First line as fallback
  const firstLine = content.split("\n")[0].trim();
  return firstLine.slice(0, 100) || "Untitled bug";
}

function extractSeverity(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("critical")) return "CRITICAL";
  if (lower.includes("high")) return "HIGH";
  if (lower.includes("medium")) return "MEDIUM";
  if (lower.includes("low")) return "LOW";
  return "MEDIUM"; // default
}

async function fetchBugs(): Promise<BugReport[]> {
  const bugs: BugReport[] = [];

  for (const [channelId, channelName] of Object.entries(BUG_CHANNELS)) {
    try {
      const messages = await discordFetch(
        `/channels/${channelId}/messages?limit=100`
      );
      if (!Array.isArray(messages)) continue;

      for (const msg of messages) {
        const content = msg.content?.trim();
        if (!content) continue;
        // Skip bot messages
        if (msg.author?.bot) continue;

        bugs.push({
          id: msg.id,
          author: msg.author?.username || "unknown",
          authorId: msg.author?.id || "",
          channel: channelId,
          channelName,
          content,
          title: extractTitle(content),
          severity: extractSeverity(content),
          timestamp: msg.timestamp,
          attachments: msg.attachments?.length || 0,
        });
      }
    } catch (err) {
      console.error(`Error fetching #${channelName}:`, err);
    }
  }

  // Sort by timestamp desc
  bugs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return bugs;
}

function buildLeaderboard(bugs: BugReport[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  for (const bug of bugs) {
    if (!map.has(bug.author)) {
      map.set(bug.author, {
        username: bug.author,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    }
    const entry = map.get(bug.author)!;
    entry.total++;
    switch (bug.severity) {
      case "CRITICAL": entry.critical++; break;
      case "HIGH": entry.high++; break;
      case "MEDIUM": entry.medium++; break;
      case "LOW": entry.low++; break;
    }
  }

  return [...map.values()].sort((a, b) => {
    // Sort by weighted score: critical=4, high=3, medium=2, low=1
    const scoreA = a.critical * 4 + a.high * 3 + a.medium * 2 + a.low;
    const scoreB = b.critical * 4 + b.high * 3 + b.medium * 2 + b.low;
    return scoreB - scoreA;
  });
}

function formatLeaderboard(leaderboard: LeaderboardEntry[]): string {
  // Plain text version for console output
  const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  const lines = ["Bug Hunter Leaderboard", ""];
  for (let i = 0; i < leaderboard.length; i++) {
    const e = leaderboard[i];
    const rank = medals[i] || `#${i + 1}`;
    const score = e.critical * 4 + e.high * 3 + e.medium * 2 + e.low;
    lines.push(`${rank} ${e.username} — ${e.total} bugs (${score} pts)`);
  }
  lines.push("");
  lines.push(`Updated: ${new Date().toISOString().slice(0, 16)} UTC`);
  return lines.join("\n");
}

function buildLeaderboardEmbed(leaderboard: LeaderboardEntry[], totalBugs: number): object {
  const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  const rankLines: string[] = [];
  const statLines: string[] = [];

  for (let i = 0; i < leaderboard.length; i++) {
    const e = leaderboard[i];
    const rank = medals[i] || `\`#${i + 1}\``;
    const score = e.critical * 4 + e.high * 3 + e.medium * 2 + e.low;

    // Progress bar based on score relative to top scorer
    const maxScore = leaderboard[0] ? leaderboard[0].critical * 4 + leaderboard[0].high * 3 + leaderboard[0].medium * 2 + leaderboard[0].low : 1;
    const barLen = Math.max(1, Math.round((score / Math.max(maxScore, 1)) * 10));
    const bar = "\u2588".repeat(barLen) + "\u2591".repeat(10 - barLen);

    rankLines.push(`${rank} **${e.username}**`);
    statLines.push(`\`${bar}\` **${score}** pts \u2014 ${e.total} bugs`);
  }

  // Severity breakdown for each person
  const breakdownLines: string[] = [];
  for (const e of leaderboard) {
    const parts: string[] = [];
    if (e.critical) parts.push(`\uD83D\uDFE5 ${e.critical}`);
    if (e.high) parts.push(`\uD83D\uDFE7 ${e.high}`);
    if (e.medium) parts.push(`\uD83D\uDFE8 ${e.medium}`);
    if (e.low) parts.push(`\u2B1C ${e.low}`);
    breakdownLines.push(parts.join("  ") || "\u2014");
  }

  return {
    embeds: [{
      title: "\uD83D\uDC1B  Bug Hunter Leaderboard",
      color: 0xD4AF37,
      fields: [
        {
          name: "Hunter",
          value: rankLines.join("\n") || "No bugs yet",
          inline: true,
        },
        {
          name: "Score",
          value: statLines.join("\n") || "\u2014",
          inline: true,
        },
        {
          name: "Breakdown",
          value: breakdownLines.join("\n") || "\u2014",
          inline: true,
        },
        {
          name: "\u200B",
          value: `\uD83D\uDFE5 Critical = 4pts  \u2022  \uD83D\uDFE7 High = 3pts  \u2022  \uD83D\uDFE8 Medium = 2pts  \u2022  \u2B1C Low = 1pt\n**${totalBugs}** total bugs reported`,
          inline: false,
        },
      ],
      footer: { text: `Updated ${new Date().toISOString().slice(0, 16)} UTC  \u2022  ForjeGames Beta` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildNewBugEmbed(bug: BugReport): object {
  const severityColors: Record<string, number> = {
    CRITICAL: 0xEF4444,
    HIGH: 0xF97316,
    MEDIUM: 0xEAB308,
    LOW: 0x9CA3AF,
  };
  const severityEmoji: Record<string, string> = {
    CRITICAL: "\uD83D\uDFE5",
    HIGH: "\uD83D\uDFE7",
    MEDIUM: "\uD83D\uDFE8",
    LOW: "\u2B1C",
  };

  return {
    embeds: [{
      title: `${severityEmoji[bug.severity] || "\uD83D\uDC1B"} ${bug.title}`,
      description: bug.content.slice(0, 500),
      color: severityColors[bug.severity] || 0x6B7280,
      fields: [
        { name: "Severity", value: `\`${bug.severity}\``, inline: true },
        { name: "Reporter", value: `**${bug.author}**`, inline: true },
        { name: "Channel", value: `<#${bug.channel}>`, inline: true },
      ],
      footer: { text: `Bug ID: ${bug.id.slice(-6)}  \u2022  ${bug.timestamp.slice(0, 10)}` },
      timestamp: bug.timestamp,
    }],
  };
}

function formatBugList(bugs: BugReport[]): string {
  const lines = ["# All Bug Reports", ""];
  for (const bug of bugs) {
    const date = bug.timestamp.slice(0, 10);
    const att = bug.attachments ? ` (+${bug.attachments} img)` : "";
    lines.push(
      `- **[${bug.severity}]** ${bug.title} — *${bug.author}* in #${bug.channelName} (${date})${att}`
    );
  }
  return lines.join("\n");
}

async function postMessage(channelId: string, content: string) {
  // Discord max message length is 2000
  const chunks: string[] = [];
  while (content.length > 0) {
    chunks.push(content.slice(0, 2000));
    content = content.slice(2000);
  }
  for (const chunk of chunks) {
    await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: chunk }),
    });
  }
}

// Save state locally for diff detection
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
const STATE_FILE = join(__dirname2, ".discord-bug-state.json");

function loadState(): Set<string> {
  try {
    const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    return new Set(data.seenIds || []);
  } catch {
    return new Set();
  }
}

function saveState(seenIds: Set<string>) {
  writeFileSync(STATE_FILE, JSON.stringify({ seenIds: [...seenIds] }));
}

async function run(postToDiscord: boolean) {
  if (!BOT_TOKEN) {
    console.error("Missing DISCORD_BOT_TOKEN env var");
    process.exit(1);
  }

  console.log(`[${new Date().toISOString()}] Fetching bugs...`);
  const bugs = await fetchBugs();
  const leaderboard = buildLeaderboard(bugs);

  // Check for new bugs
  const seen = loadState();
  const newBugs = bugs.filter((b) => !seen.has(b.id));

  console.log(`Total bugs: ${bugs.length} | New: ${newBugs.length}`);
  console.log("");

  // Print leaderboard
  console.log(formatLeaderboard(leaderboard));
  console.log("");

  // Print new bugs
  if (newBugs.length > 0) {
    console.log("=== NEW BUGS ===");
    for (const bug of newBugs) {
      console.log(`[${bug.severity}] ${bug.title} — ${bug.author} (#${bug.channelName})`);
      console.log(`  ${bug.content.slice(0, 200)}`);
      console.log("");
    }
  }

  // Print all bugs
  console.log(formatBugList(bugs));

  // Post to Discord if requested
  if (postToDiscord) {
    // Always update leaderboard (even if no new bugs — scores may have changed)
    console.log("\nPosting leaderboard embed to Discord...");
    const leaderboardPayload = buildLeaderboardEmbed(leaderboard, bugs.length);
    await discordFetch(`/channels/${LEADERBOARD_CHANNEL}/messages`, {
      method: "POST",
      body: JSON.stringify(leaderboardPayload),
    });

    // Post new bugs as individual embeds
    if (newBugs.length > 0) {
      console.log(`Posting ${newBugs.length} new bug embeds...`);
      for (const bug of newBugs) {
        const bugPayload = buildNewBugEmbed(bug);
        await discordFetch(`/channels/${BUG_LOG_CHANNEL}/messages`, {
          method: "POST",
          body: JSON.stringify(bugPayload),
        });
      }
    }
    console.log("Posted!");
  }

  // Save state
  for (const bug of bugs) seen.add(bug.id);
  saveState(seen);

  return { bugs, newBugs, leaderboard };
}

// Main
const args = process.argv.slice(2);
const once = args.includes("--once");
const post = args.includes("--post");

run(post).then(({ bugs, leaderboard }) => {
  if (!once) {
    console.log("\nPolling every 5 minutes... (Ctrl+C to stop)");
    setInterval(() => run(post), 5 * 60 * 1000);
  }
}).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
