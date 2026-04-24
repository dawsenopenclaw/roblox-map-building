/**
 * ForjeEli — Discord Automation Bot
 *
 * Tracks bug reports & suggestions, rates quality/actionability,
 * posts detailed staff digests, maintains contributor reputation,
 * and automates community management.
 *
 * Usage:
 *   npx tsx scripts/forje-eli-bot.ts              # Run continuously (polls every 3 min)
 *   npx tsx scripts/forje-eli-bot.ts --once        # Run once and exit
 *   npx tsx scripts/forje-eli-bot.ts --digest      # Force post staff digest now
 *   npx tsx scripts/forje-eli-bot.ts --leaderboard # Force post leaderboard now
 *
 * Env: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
 */

import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

loadEnv();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1495863063423746068";

// ─── Channel Config ──────────────────────────────────────────────────────────
// Bug channels to monitor
const BUG_CHANNELS: Record<string, string> = {
  "1495873976990306514": "beta-alpha-bugs",
  "1495873972162789478": "beta-bug-log",
  "1495873965498040361": "bug-reports",
  "1495873990919590100": "beta-bravo-bugs",
  "1495873998452560025": "beta-charlie-bugs",
  "1495874005041811548": "beta-delta-bugs",
  "1495874012528509058": "beta-echo-bugs",
};

// Suggestion channels (will be auto-created if missing)
const SUGGESTION_CHANNELS: Record<string, string> = {
  // Add suggestion channel IDs here once created
  // "CHANNEL_ID": "suggestions",
  // "CHANNEL_ID": "feature-requests",
};

// Staff / output channels
const STAFF_CHANNEL = ""; // Will be auto-discovered or created
const LEADERBOARD_CHANNEL = "1495873973228142632"; // beta-leaderboard
// Post bug logs ONLY to eli-staff-reports — never spam the user-facing bug channels
const BUG_LOG_CHANNEL = ""; // Will use staff channel instead
const ANNOUNCEMENTS_CHANNEL = "1495873969704665248"; // beta-announcements

// ─── State File ──────────────────────────────────────────────────────────────
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
const STATE_FILE = join(__dirname2, ".forje-eli-state.json");

interface ContributorStats {
  username: string;
  userId: string;
  bugsReported: number;
  suggestionsSubmitted: number;
  qualityScore: number; // 0-100 rolling average
  criticalFinds: number;
  duplicates: number;
  lastActive: string;
  reputation: number; // calculated
  badges: string[];
}

interface TrackedItem {
  id: string;
  type: "bug" | "suggestion" | "feedback";
  author: string;
  authorId: string;
  channel: string;
  channelName: string;
  content: string;
  title: string;
  severity: string; // for bugs
  priority: string; // for suggestions
  qualityRating: number; // 1-5
  actionability: string; // "immediate" | "planned" | "needs-info" | "duplicate" | "wontfix"
  status: "new" | "acknowledged" | "in-progress" | "fixed" | "closed";
  staffNotes: string;
  timestamp: string;
  attachments: number;
  reactions: Record<string, number>;
  tags: string[];
}

interface BotState {
  seenIds: string[];
  items: TrackedItem[];
  contributors: Record<string, ContributorStats>;
  lastDigest: string; // ISO timestamp
  lastLeaderboard: string;
  digestCount: number;
  staffChannelId: string;
  suggestionsChannelId: string;
}

function loadState(): BotState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {}
  return {
    seenIds: [],
    items: [],
    contributors: {},
    lastDigest: "",
    lastLeaderboard: "",
    digestCount: 0,
    staffChannelId: "",
    suggestionsChannelId: "",
  };
}

function saveState(state: BotState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Discord API ─────────────────────────────────────────────────────────────
async function discordFetch(endpoint: string, options?: RequestInit) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (res.status === 429) {
    const data = await res.json();
    const retryAfter = (data.retry_after || 1) * 1000;
    console.log(`  Rate limited, waiting ${retryAfter}ms...`);
    await sleep(retryAfter);
    return discordFetch(endpoint, options);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }
  return res.json();
}

async function postEmbed(channelId: string, embed: object) {
  return discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function postMessage(channelId: string, content: string, embeds?: object[]) {
  const body: Record<string, unknown> = { content };
  if (embeds) body.embeds = embeds;
  return discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function addReaction(channelId: string, messageId: string, emoji: string) {
  try {
    await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }
    );
  } catch {}
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Channel Setup ───────────────────────────────────────────────────────────
async function findOrCreateChannel(
  state: BotState,
  name: string,
  stateKey: "staffChannelId" | "suggestionsChannelId",
  topic: string
): Promise<string> {
  // Check if we already have it
  if (state[stateKey]) {
    try {
      await discordFetch(`/channels/${state[stateKey]}`);
      return state[stateKey];
    } catch {
      // Channel was deleted, recreate
    }
  }

  // Search existing channels
  const channels = await discordFetch(`/guilds/${GUILD_ID}/channels`);
  const existing = channels.find(
    (c: { name: string; type: number }) => c.name === name && c.type === 0
  );
  if (existing) {
    state[stateKey] = existing.id;
    saveState(state);
    return existing.id;
  }

  // Create the channel
  const created = await discordFetch(`/guilds/${GUILD_ID}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: 0, // text channel
      topic,
    }),
  });
  state[stateKey] = created.id;
  saveState(state);
  console.log(`  Created #${name} (${created.id})`);
  return created.id;
}

// ─── Classification Engine ───────────────────────────────────────────────────
function classifyType(content: string, channelName: string): "bug" | "suggestion" | "feedback" {
  const lower = content.toLowerCase();
  // Channel-based classification
  if (channelName.includes("bug") || channelName.includes("bug-log")) return "bug";
  if (channelName.includes("suggest") || channelName.includes("feature") || channelName.includes("idea"))
    return "suggestion";

  // Content-based classification
  const bugWords = [
    "bug", "broken", "error", "crash", "doesn't work", "not working",
    "fail", "stuck", "glitch", "wrong", "can't", "cannot", "won't",
    "blank", "freeze", "lag", "missing", "disappeared", "white screen",
  ];
  const suggestionWords = [
    "should", "could", "would be nice", "idea", "feature", "suggest",
    "add", "implement", "wish", "what if", "how about", "request",
    "improve", "better if", "want", "need",
  ];

  const bugScore = bugWords.filter((w) => lower.includes(w)).length;
  const sugScore = suggestionWords.filter((w) => lower.includes(w)).length;

  if (bugScore > sugScore) return "bug";
  if (sugScore > bugScore) return "suggestion";
  return "feedback";
}

function classifySeverity(content: string): string {
  const lower = content.toLowerCase();
  if (
    lower.includes("crash") || lower.includes("data loss") || lower.includes("can't login") ||
    lower.includes("can't sign") || lower.includes("white screen") || lower.includes("blank page") ||
    lower.includes("payment") || lower.includes("can't use") || lower.includes("completely broken")
  )
    return "CRITICAL";
  if (
    lower.includes("broken") || lower.includes("doesn't work") || lower.includes("error") ||
    lower.includes("fail") || lower.includes("stuck") || lower.includes("impossible")
  )
    return "HIGH";
  if (
    lower.includes("slow") || lower.includes("wrong") || lower.includes("weird") ||
    lower.includes("glitch") || lower.includes("missing") || lower.includes("confusing")
  )
    return "MEDIUM";
  return "LOW";
}

function classifyPriority(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical") || lower.includes("need"))
    return "HIGH";
  if (lower.includes("nice to have") || lower.includes("minor") || lower.includes("small"))
    return "LOW";
  return "MEDIUM";
}

function rateQuality(content: string, attachments: number): number {
  let score = 1;

  // Length bonus: more detail = better report
  if (content.length > 50) score++;
  if (content.length > 150) score++;
  if (content.length > 300) score++;

  // Structure bonus
  if (content.includes("steps") || content.includes("reproduce") || content.includes("1.")) score++;
  if (content.includes("expected") || content.includes("should")) score += 0.5;
  if (content.includes("actual") || content.includes("instead")) score += 0.5;

  // Attachment bonus (screenshots/videos are gold)
  if (attachments > 0) score++;
  if (attachments > 1) score += 0.5;

  // Specificity bonus
  if (content.includes("browser") || content.includes("chrome") || content.includes("firefox")) score += 0.5;
  if (content.includes("studio") || content.includes("plugin")) score += 0.5;
  if (content.match(/v\d|version/i)) score += 0.5;

  // Penalty for vague reports
  if (content.length < 20) score -= 1;
  if (content.match(/^(it's broken|doesn't work|fix this|help)$/i)) score -= 1;

  return Math.max(1, Math.min(5, Math.round(score)));
}

function classifyActionability(
  content: string,
  type: "bug" | "suggestion" | "feedback",
  quality: number
): string {
  if (quality <= 1) return "needs-info";
  if (quality >= 4 && type === "bug") return "immediate";
  if (quality >= 3 && type === "suggestion") return "planned";
  if (type === "feedback") return "planned";
  return "planned";
}

function extractTags(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();

  // Feature areas
  if (lower.includes("ai") || lower.includes("build") || lower.includes("generat")) tags.push("ai-builder");
  if (lower.includes("studio") || lower.includes("plugin") || lower.includes("roblox")) tags.push("studio-plugin");
  if (lower.includes("ui") || lower.includes("interface") || lower.includes("button") || lower.includes("layout"))
    tags.push("ui");
  if (lower.includes("auth") || lower.includes("login") || lower.includes("sign")) tags.push("auth");
  if (lower.includes("pay") || lower.includes("subscri") || lower.includes("billing") || lower.includes("stripe"))
    tags.push("billing");
  if (lower.includes("plan") || lower.includes("mode")) tags.push("plan-mode");
  if (lower.includes("image") || lower.includes("texture") || lower.includes("style")) tags.push("images");
  if (lower.includes("3d") || lower.includes("mesh") || lower.includes("model")) tags.push("3d-mesh");
  if (lower.includes("mobile") || lower.includes("phone")) tags.push("mobile");
  if (lower.includes("performance") || lower.includes("slow") || lower.includes("lag")) tags.push("performance");
  if (lower.includes("connect") || lower.includes("websocket") || lower.includes("disconnect")) tags.push("connection");

  return [...new Set(tags)];
}

function extractTitle(content: string): string {
  const firstLine = content.split("\n")[0].trim();
  return firstLine.slice(0, 100) || "Untitled";
}

// ─── Contributor Tracking ────────────────────────────────────────────────────
function updateContributor(
  state: BotState,
  item: TrackedItem
) {
  const key = item.authorId;
  if (!state.contributors[key]) {
    state.contributors[key] = {
      username: item.author,
      userId: item.authorId,
      bugsReported: 0,
      suggestionsSubmitted: 0,
      qualityScore: 50,
      criticalFinds: 0,
      duplicates: 0,
      lastActive: item.timestamp,
      reputation: 0,
      badges: [],
    };
  }

  const c = state.contributors[key];
  c.username = item.author; // update in case they changed it
  c.lastActive = item.timestamp;

  if (item.type === "bug") {
    c.bugsReported++;
    if (item.severity === "CRITICAL") c.criticalFinds++;
  } else {
    c.suggestionsSubmitted++;
  }

  // Rolling quality average
  c.qualityScore = Math.round(
    c.qualityScore * 0.8 + item.qualityRating * 20 * 0.2
  );

  // Reputation = weighted sum
  c.reputation = Math.round(
    c.bugsReported * 3 +
    c.criticalFinds * 10 +
    c.suggestionsSubmitted * 2 +
    c.qualityScore * 0.5 -
    c.duplicates * 2
  );

  // Badges
  c.badges = [];
  if (c.bugsReported >= 20) c.badges.push("Bug Slayer");
  if (c.bugsReported >= 50) c.badges.push("Bug Legend");
  if (c.criticalFinds >= 3) c.badges.push("Critical Eye");
  if (c.criticalFinds >= 10) c.badges.push("Security Hawk");
  if (c.suggestionsSubmitted >= 10) c.badges.push("Idea Machine");
  if (c.suggestionsSubmitted >= 25) c.badges.push("Visionary");
  if (c.qualityScore >= 80) c.badges.push("Quality Reporter");
  if (c.reputation >= 100) c.badges.push("MVP");
  if (c.reputation >= 250) c.badges.push("Community Legend");
  if (c.bugsReported + c.suggestionsSubmitted >= 5 && c.bugsReported > 0 && c.suggestionsSubmitted > 0)
    c.badges.push("All-Rounder");
}

// ─── Duplicate Detection ─────────────────────────────────────────────────────
function isDuplicate(newItem: TrackedItem, existingItems: TrackedItem[]): TrackedItem | null {
  const newWords = new Set(
    newItem.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );

  for (const existing of existingItems) {
    if (existing.type !== newItem.type) continue;
    if (existing.id === newItem.id) continue;

    const existingWords = new Set(
      existing.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    );

    // Jaccard similarity
    let intersection = 0;
    for (const w of newWords) {
      if (existingWords.has(w)) intersection++;
    }
    const union = new Set([...newWords, ...existingWords]).size;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity > 0.6) return existing;
  }
  return null;
}

// ─── Fetch New Messages ──────────────────────────────────────────────────────
async function fetchNewItems(state: BotState): Promise<TrackedItem[]> {
  const seenSet = new Set(state.seenIds);
  const newItems: TrackedItem[] = [];
  const allChannels = { ...BUG_CHANNELS, ...SUGGESTION_CHANNELS };

  // Also check suggestions channel if we have one
  if (state.suggestionsChannelId) {
    allChannels[state.suggestionsChannelId] = "suggestions";
  }

  for (const [channelId, channelName] of Object.entries(allChannels)) {
    try {
      const messages = await discordFetch(`/channels/${channelId}/messages?limit=50`);
      if (!Array.isArray(messages)) continue;

      for (const msg of messages) {
        if (seenSet.has(msg.id)) continue;
        if (msg.author?.bot) continue;
        const content = msg.content?.trim();
        if (!content || content.length < 10) continue;

        const type = classifyType(content, channelName);
        const severity = type === "bug" ? classifySeverity(content) : "N/A";
        const priority = type === "suggestion" ? classifyPriority(content) : "N/A";
        const quality = rateQuality(content, msg.attachments?.length || 0);
        const actionability = classifyActionability(content, type, quality);
        const tags = extractTags(content);

        const item: TrackedItem = {
          id: msg.id,
          type,
          author: msg.author?.username || "unknown",
          authorId: msg.author?.id || "",
          channel: channelId,
          channelName,
          content,
          title: extractTitle(content),
          severity,
          priority,
          qualityRating: quality,
          actionability,
          status: "new",
          staffNotes: "",
          timestamp: msg.timestamp,
          attachments: msg.attachments?.length || 0,
          reactions: {},
          tags,
        };

        // Check for duplicates
        const dupe = isDuplicate(item, state.items);
        if (dupe) {
          item.actionability = "duplicate";
          item.staffNotes = `Possible duplicate of ${dupe.id.slice(-6)} by ${dupe.author}`;
          // Update contributor dupe count
          if (state.contributors[item.authorId]) {
            state.contributors[item.authorId].duplicates++;
          }
        }

        newItems.push(item);
      }

      await sleep(200); // rate limit buffer between channels
    } catch (err) {
      console.error(`  Error fetching #${channelName}:`, err instanceof Error ? err.message : err);
    }
  }

  return newItems;
}

// ─── React to New Items ──────────────────────────────────────────────────────
async function reactToItem(item: TrackedItem) {
  // React based on classification to acknowledge receipt
  const typeEmoji: Record<string, string> = {
    bug: "\uD83D\uDC1B",        // bug
    suggestion: "\uD83D\uDCA1",  // lightbulb
    feedback: "\uD83D\uDCDD",   // memo
  };
  const severityEmoji: Record<string, string> = {
    CRITICAL: "\uD83D\uDEA8", // rotating light
    HIGH: "\uD83D\uDD34",     // red circle
    MEDIUM: "\uD83D\uDFE1",   // yellow circle
    LOW: "\u2B1C",             // white square
  };

  await addReaction(item.channel, item.id, typeEmoji[item.type] || "\uD83D\uDC40");
  await sleep(300);

  if (item.type === "bug" && severityEmoji[item.severity]) {
    await addReaction(item.channel, item.id, severityEmoji[item.severity]);
  }

  // Quality reaction
  if (item.qualityRating >= 4) {
    await sleep(300);
    await addReaction(item.channel, item.id, "\u2B50"); // star for quality reports
  }

  if (item.actionability === "duplicate") {
    await sleep(300);
    await addReaction(item.channel, item.id, "\uD83D\uDD04"); // repeat for duplicates
  }
}

// ─── Staff Digest ────────────────────────────────────────────────────────────
function buildStaffDigest(newItems: TrackedItem[], state: BotState): object[] {
  const now = new Date();
  const bugs = newItems.filter((i) => i.type === "bug");
  const suggestions = newItems.filter((i) => i.type === "suggestion");
  const feedback = newItems.filter((i) => i.type === "feedback");
  const criticals = bugs.filter((b) => b.severity === "CRITICAL");
  const highs = bugs.filter((b) => b.severity === "HIGH");
  const duplicates = newItems.filter((i) => i.actionability === "duplicate");

  const embeds: object[] = [];

  // ── Header embed ──
  embeds.push({
    title: `\uD83D\uDCCB  ForjeEli Digest #${state.digestCount + 1}`,
    description: [
      `**${newItems.length}** new items since last digest`,
      `\uD83D\uDC1B ${bugs.length} bugs | \uD83D\uDCA1 ${suggestions.length} suggestions | \uD83D\uDCDD ${feedback.length} feedback`,
      criticals.length > 0 ? `\uD83D\uDEA8 **${criticals.length} CRITICAL** bugs need immediate attention` : "",
      duplicates.length > 0 ? `\uD83D\uDD04 ${duplicates.length} duplicates detected` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    color: criticals.length > 0 ? 0xEF4444 : 0xD4AF37,
    timestamp: now.toISOString(),
  });

  // ── Critical bugs (always show details) ──
  if (criticals.length > 0) {
    embeds.push({
      title: "\uD83D\uDEA8  CRITICAL Bugs — Fix ASAP",
      color: 0xEF4444,
      description: criticals
        .map(
          (b) =>
            `**${b.title}**\nBy: ${b.author} | Quality: ${"★".repeat(b.qualityRating)}${"☆".repeat(5 - b.qualityRating)} | Tags: ${b.tags.join(", ") || "none"}\n> ${b.content.slice(0, 200)}${b.content.length > 200 ? "..." : ""}\n`
        )
        .join("\n"),
    });
  }

  // ── High priority bugs ──
  if (highs.length > 0) {
    embeds.push({
      title: "\uD83D\uDD34  HIGH Priority Bugs",
      color: 0xF97316,
      description: highs
        .slice(0, 8)
        .map(
          (b) =>
            `**${b.title}** — ${b.author}\n${"★".repeat(b.qualityRating)}${"☆".repeat(5 - b.qualityRating)} | ${b.tags.join(", ") || "untagged"} | ${b.actionability}`
        )
        .join("\n\n"),
    });
  }

  // ── Other bugs summary ──
  const otherBugs = bugs.filter((b) => b.severity !== "CRITICAL" && b.severity !== "HIGH");
  if (otherBugs.length > 0) {
    embeds.push({
      title: `\uD83D\uDFE1  ${otherBugs.length} Medium/Low Bugs`,
      color: 0xEAB308,
      description: otherBugs
        .slice(0, 10)
        .map((b) => `\u2022 **${b.title}** — ${b.author} [${b.severity}] ${b.tags.join(", ")}`)
        .join("\n"),
    });
  }

  // ── Suggestions ──
  if (suggestions.length > 0) {
    embeds.push({
      title: `\uD83D\uDCA1  ${suggestions.length} New Suggestions`,
      color: 0x8B5CF6,
      description: suggestions
        .slice(0, 10)
        .map(
          (s) =>
            `**${s.title}** — ${s.author}\n${"★".repeat(s.qualityRating)}${"☆".repeat(5 - s.qualityRating)} | Priority: ${s.priority} | ${s.tags.join(", ") || "untagged"}\n> ${s.content.slice(0, 150)}${s.content.length > 150 ? "..." : ""}`
        )
        .join("\n\n"),
    });
  }

  // ── Feedback ──
  if (feedback.length > 0) {
    embeds.push({
      title: `\uD83D\uDCDD  ${feedback.length} Feedback Messages`,
      color: 0x6B7280,
      description: feedback
        .slice(0, 5)
        .map((f) => `\u2022 ${f.author}: "${f.content.slice(0, 100)}${f.content.length > 100 ? "..." : ""}"`)
        .join("\n"),
    });
  }

  // ── Tag Heatmap (what areas are getting the most reports) ──
  const tagCounts: Record<string, number> = {};
  for (const item of newItems) {
    for (const tag of item.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  if (sortedTags.length > 0) {
    const maxCount = sortedTags[0][1];
    embeds.push({
      title: "\uD83D\uDDFA\uFE0F  Area Heatmap",
      color: 0x3B82F6,
      description: sortedTags
        .map(([tag, count]) => {
          const barLen = Math.max(1, Math.round((count / maxCount) * 10));
          const bar = "\u2588".repeat(barLen) + "\u2591".repeat(10 - barLen);
          return `\`${bar}\` **${tag}** — ${count} reports`;
        })
        .join("\n"),
      footer: {
        text: "Hot areas = where to focus fixes. Noah: compile this into the weekly priority list.",
      },
    });
  }

  // ── Action Items for Noah ──
  const actionItems: string[] = [];
  if (criticals.length > 0)
    actionItems.push(`\uD83D\uDEA8 **${criticals.length} CRITICAL bugs** — triage with Yomi and Coltin immediately`);
  if (highs.length > 0)
    actionItems.push(`\uD83D\uDD34 **${highs.length} HIGH bugs** — add to sprint backlog`);
  const needsInfo = newItems.filter((i) => i.actionability === "needs-info");
  if (needsInfo.length > 0)
    actionItems.push(`\u2753 **${needsInfo.length} items** need more info — follow up with reporters`);
  if (duplicates.length > 0)
    actionItems.push(`\uD83D\uDD04 **${duplicates.length} duplicates** — confirm and merge with originals`);
  if (suggestions.length > 0)
    actionItems.push(`\uD83D\uDCA1 **${suggestions.length} suggestions** — review with Coltin for roadmap fit`);

  const topContributors = Object.values(state.contributors)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 3);
  if (topContributors.length > 0)
    actionItems.push(
      `\uD83C\uDFC6 Top contributors: ${topContributors.map((c) => `**${c.username}** (${c.reputation} rep)`).join(", ")}`
    );

  if (actionItems.length > 0) {
    embeds.push({
      title: "\u2705  Action Items — Noah's Compile List",
      color: 0x22C55E,
      description: actionItems.join("\n"),
      footer: {
        text: "Noah: compile this + add your notes, then pass to Coltin & Yomi for final call.",
      },
    });
  }

  return embeds;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function buildReputationLeaderboard(state: BotState): object {
  const sorted = Object.values(state.contributors)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 15);

  const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  const lines: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const rank = medals[i] || `\`#${i + 1}\``;
    const maxRep = sorted[0]?.reputation || 1;
    const barLen = Math.max(1, Math.round((c.reputation / maxRep) * 12));
    const bar = "\u2588".repeat(barLen) + "\u2591".repeat(12 - barLen);
    const badgeStr = c.badges.length > 0 ? ` ${c.badges.slice(0, 2).map((b) => `\`${b}\``).join(" ")}` : "";

    lines.push(
      `${rank} **${c.username}** — **${c.reputation}** rep${badgeStr}\n` +
        `\u2003\`${bar}\` \uD83D\uDC1B${c.bugsReported} \uD83D\uDCA1${c.suggestionsSubmitted} ${"★".repeat(Math.round(c.qualityScore / 20))}${"☆".repeat(5 - Math.round(c.qualityScore / 20))}`
    );
  }

  return {
    title: "\uD83C\uDFC6  Contributor Reputation Board",
    color: 0xD4AF37,
    description: lines.join("\n\n") || "No contributors yet — start reporting bugs!",
    fields: [
      {
        name: "How Reputation Works",
        value:
          "\uD83D\uDC1B Bug = 3pts | \uD83D\uDEA8 Critical find = 10pts | \uD83D\uDCA1 Suggestion = 2pts | \u2B50 Quality bonus | \uD83D\uDD04 Duplicate = -2pts",
        inline: false,
      },
    ],
    footer: {
      text: `${Object.keys(state.contributors).length} contributors tracked | Updated ${new Date().toISOString().slice(0, 16)} UTC`,
    },
    timestamp: new Date().toISOString(),
  };
}

// ─── Weekly Summary ──────────────────────────────────────────────────────────
function buildWeeklySummary(state: BotState): object[] {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekItems = state.items.filter((i) => new Date(i.timestamp) > weekAgo);
  const weekBugs = weekItems.filter((i) => i.type === "bug");
  const weekSuggestions = weekItems.filter((i) => i.type === "suggestion");

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const item of weekItems) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }

  // Most active contributors this week
  const weekContribs: Record<string, number> = {};
  for (const item of weekItems) {
    weekContribs[item.author] = (weekContribs[item.author] || 0) + 1;
  }
  const topWeek = Object.entries(weekContribs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return [
    {
      title: "\uD83D\uDCCA  Weekly Summary",
      color: 0xD4AF37,
      description: [
        `**${weekItems.length}** total items this week`,
        `\uD83D\uDC1B ${weekBugs.length} bugs | \uD83D\uDCA1 ${weekSuggestions.length} suggestions`,
        "",
        "**Status Breakdown:**",
        ...Object.entries(statusCounts).map(([status, count]) => `\u2022 ${status}: ${count}`),
      ].join("\n"),
      fields: [
        {
          name: "Most Active This Week",
          value: topWeek.map(([name, count], i) => `${i + 1}. **${name}** — ${count} reports`).join("\n") || "None",
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    },
  ];
}

// ─── Auto-Acknowledge in Channel ─────────────────────────────────────────────
// DISABLED: Per Vyren's instruction — don't post acknowledgments in bug/suggestion
// channels. Track internally only. Updates go to #announcements.
async function acknowledgeInChannel(_item: TrackedItem) {
  // No-op — all acknowledgments are now silent.
  // Bugs and suggestions are tracked internally without spamming the channels.
  return
}

// ─── Main Run Loop ───────────────────────────────────────────────────────────
async function run(options: { digest: boolean; leaderboard: boolean }) {
  if (!BOT_TOKEN) {
    console.error("Missing DISCORD_BOT_TOKEN");
    process.exit(1);
  }

  const state = loadState();
  const now = new Date();

  console.log(`[${now.toISOString()}] ForjeEli running...`);

  // ── Setup channels ──
  const staffCh = await findOrCreateChannel(
    state,
    "eli-staff-reports",
    "staffChannelId",
    "ForjeEli automated staff reports — bugs, suggestions, digests for Noah/Coltin/Yomi"
  );
  const suggestCh = await findOrCreateChannel(
    state,
    "suggestions",
    "suggestionsChannelId",
    "Drop your feature ideas and suggestions here! ForjeEli tracks and rates them all."
  );
  console.log(`  Staff channel: ${staffCh}`);
  console.log(`  Suggestions channel: ${suggestCh}`);

  // ── Fetch new items ──
  const newItems = await fetchNewItems(state);
  console.log(`  Found ${newItems.length} new items`);

  // ── Process each item ──
  for (const item of newItems) {
    // Update contributor stats
    updateContributor(state, item);

    // React to the message
    await reactToItem(item);
    await sleep(500);

    // Auto-acknowledge critical bugs and quality reports
    await acknowledgeInChannel(item);

    // Add to state
    state.items.push(item);
    state.seenIds.push(item.id);

    console.log(
      `  [${item.type.toUpperCase()}] ${item.severity !== "N/A" ? `[${item.severity}] ` : ""}` +
        `${item.title.slice(0, 50)} — ${item.author} ` +
        `(Quality: ${"★".repeat(item.qualityRating)}, Action: ${item.actionability})`
    );
  }

  // ── Post staff digest (every 6 hours or on demand) ──
  const lastDigest = state.lastDigest ? new Date(state.lastDigest) : new Date(0);
  const hoursSinceDigest = (now.getTime() - lastDigest.getTime()) / (1000 * 60 * 60);
  const shouldDigest = options.digest || (newItems.length > 0 && hoursSinceDigest >= 6);

  if (shouldDigest && newItems.length > 0) {
    console.log("  Posting staff digest...");
    const digestEmbeds = buildStaffDigest(newItems, state);

    // Discord max 10 embeds per message, so split if needed
    for (let i = 0; i < digestEmbeds.length; i += 10) {
      const batch = digestEmbeds.slice(i, i + 10);
      await discordFetch(`/channels/${staffCh}/messages`, {
        method: "POST",
        body: JSON.stringify({ embeds: batch }),
      });
      await sleep(500);
    }

    state.lastDigest = now.toISOString();
    state.digestCount++;
    console.log(`  Digest #${state.digestCount} posted!`);
  }

  // ── Post leaderboard (every 12 hours or on demand) ──
  const lastLB = state.lastLeaderboard ? new Date(state.lastLeaderboard) : new Date(0);
  const hoursSinceLB = (now.getTime() - lastLB.getTime()) / (1000 * 60 * 60);
  const shouldLB = options.leaderboard || hoursSinceLB >= 12;

  if (shouldLB && Object.keys(state.contributors).length > 0) {
    console.log("  Posting reputation leaderboard...");
    const lbEmbed = buildReputationLeaderboard(state);
    await postEmbed(LEADERBOARD_CHANNEL, lbEmbed);
    state.lastLeaderboard = now.toISOString();
    console.log("  Leaderboard posted!");
  }

  // ── Weekly summary (check if it's Monday and hasn't been posted today) ──
  if (now.getUTCDay() === 1 && hoursSinceDigest >= 20) {
    console.log("  Posting weekly summary...");
    const weeklyEmbeds = buildWeeklySummary(state);
    for (const embed of weeklyEmbeds) {
      await postEmbed(staffCh, embed);
      await sleep(300);
    }
  }

  // ── Prune old state (keep last 30 days) ──
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  state.items = state.items.filter((i) => new Date(i.timestamp) > thirtyDaysAgo);

  // Keep seenIds manageable (last 5000)
  if (state.seenIds.length > 5000) {
    state.seenIds = state.seenIds.slice(-5000);
  }

  saveState(state);
  console.log(`  State saved. ${state.items.length} items, ${Object.keys(state.contributors).length} contributors tracked.\n`);
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const once = args.includes("--once");
const digest = args.includes("--digest");
const leaderboard = args.includes("--leaderboard");

run({ digest, leaderboard })
  .then(() => {
    if (!once) {
      console.log("Polling every 3 minutes... (Ctrl+C to stop)\n");
      setInterval(() => run({ digest: false, leaderboard: false }), 3 * 60 * 1000);
    }
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
