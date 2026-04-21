/**
 * Discord Bug Intake → GitHub Issues
 *
 * Polls Discord bug channels for new messages since last check,
 * creates GitHub issues for any bugs found. Runs via GitHub Actions
 * every 6 hours.
 *
 * Requires env vars:
 *   DISCORD_BOT_TOKEN — Discord bot token
 *   GITHUB_TOKEN      — GitHub token (auto-provided by Actions)
 */

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "dawsenopenclaw/roblox-map-building";

if (!BOT_TOKEN) {
  console.error("DISCORD_BOT_TOKEN not set — skipping");
  process.exit(0);
}
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN not set — skipping");
  process.exit(0);
}

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

// Only look at messages from the last 6 hours (matches cron interval)
const LOOKBACK_MS = 6 * 60 * 60 * 1000;

interface DiscordMessage {
  id: string;
  author: { username: string; id: string };
  content: string;
  timestamp: string;
  attachments: { url: string }[];
}

async function discordFetch(endpoint: string): Promise<unknown> {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }
  return res.json();
}

async function githubFetch(
  endpoint: string,
  method = "GET",
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

function classifySeverity(content: string): string {
  const lower = content.toLowerCase();
  if (
    lower.includes("crash") ||
    lower.includes("data loss") ||
    lower.includes("can't login") ||
    lower.includes("can't sign") ||
    lower.includes("white screen") ||
    lower.includes("blank page") ||
    lower.includes("payment")
  )
    return "CRITICAL";
  if (
    lower.includes("broken") ||
    lower.includes("doesn't work") ||
    lower.includes("error") ||
    lower.includes("fail") ||
    lower.includes("stuck")
  )
    return "HIGH";
  if (
    lower.includes("slow") ||
    lower.includes("wrong") ||
    lower.includes("weird") ||
    lower.includes("glitch") ||
    lower.includes("missing")
  )
    return "MEDIUM";
  return "LOW";
}

function extractTitle(content: string): string {
  // Use first line or first 80 chars
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length <= 80) return firstLine;
  return firstLine.slice(0, 77) + "...";
}

function isBugReport(content: string): boolean {
  const lower = content.toLowerCase();
  // Skip very short messages, bot messages, and non-bug messages
  if (content.length < 15) return false;
  if (lower.startsWith("thanks") || lower.startsWith("ok") || lower.startsWith("nice")) return false;

  // Likely a bug if it contains these patterns
  const bugPatterns = [
    "bug",
    "broken",
    "error",
    "crash",
    "doesn't work",
    "not working",
    "fail",
    "issue",
    "problem",
    "stuck",
    "glitch",
    "wrong",
    "can't",
    "cannot",
    "won't",
    "nothing happen",
    "blank",
    "freeze",
    "lag",
    "slow",
    "missing",
    "disappeared",
  ];

  // In a bug channel, most messages are bugs — be generous
  return bugPatterns.some((p) => lower.includes(p)) || content.length > 50;
}

async function getExistingIssues(): Promise<Set<string>> {
  // Get open issues with "discord-bug" label to avoid duplicates
  const issues = (await githubFetch(
    `/repos/${REPO}/issues?labels=discord-bug&state=open&per_page=100`
  )) as { body: string }[];

  const ids = new Set<string>();
  for (const issue of issues) {
    // Extract Discord message ID from issue body
    const match = issue.body?.match(/Discord Message ID: `(\d+)`/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

async function createIssue(
  title: string,
  body: string,
  severity: string
): Promise<void> {
  const labels = ["discord-bug", `severity:${severity.toLowerCase()}`];
  await githubFetch(`/repos/${REPO}/issues`, "POST", {
    title: `[Discord] ${title}`,
    body,
    labels,
  });
}

async function main() {
  console.log("Discord Bug Intake — polling bug channels...\n");

  const cutoff = new Date(Date.now() - LOOKBACK_MS);
  const existingIds = await getExistingIssues();
  let created = 0;
  let skipped = 0;

  for (const [channelId, channelName] of Object.entries(BUG_CHANNELS)) {
    try {
      const messages = (await discordFetch(
        `/channels/${channelId}/messages?limit=50`
      )) as DiscordMessage[];

      for (const msg of messages) {
        const msgTime = new Date(msg.timestamp);
        if (msgTime < cutoff) continue;
        if (existingIds.has(msg.id)) {
          skipped++;
          continue;
        }
        if (!isBugReport(msg.content)) continue;

        const severity = classifySeverity(msg.content);
        const title = extractTitle(msg.content);
        const attachmentList =
          msg.attachments.length > 0
            ? "\n\n**Attachments:**\n" +
              msg.attachments.map((a) => `- ${a.url}`).join("\n")
            : "";

        const body = [
          `**Reporter:** ${msg.author.username}`,
          `**Channel:** #${channelName}`,
          `**Severity:** ${severity}`,
          `**Time:** ${msg.timestamp}`,
          `**Discord Message ID:** \`${msg.id}\``,
          "",
          "---",
          "",
          msg.content,
          attachmentList,
        ].join("\n");

        await createIssue(title, body, severity);
        console.log(`  Created: [${severity}] ${title} (from ${msg.author.username} in #${channelName})`);
        created++;

        // Rate limit: 100ms between issue creates
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (err) {
      console.error(`  Error polling #${channelName}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Created ${created} issues, skipped ${skipped} duplicates.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
