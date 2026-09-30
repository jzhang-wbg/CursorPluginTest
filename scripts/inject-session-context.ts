import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type RuleToggle = {
  enabled: boolean;
};

type RulesConfig = {
  ruleA: RuleToggle;
  ruleB: RuleToggle;
};

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(pluginRoot, ".cursor-plugin", "rules.json");
const config = JSON.parse(readFileSync(configPath, "utf8")) as RulesConfig;

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

let sessionId = "unknown";
const raw = Buffer.concat(chunks).toString("utf8").trim();
if (raw) {
  try {
    const input = JSON.parse(raw) as { session_id?: string };
    if (input.session_id) sessionId = input.session_id;
  } catch {
    sessionId = "unparsed";
  }
}

const state = (rule: RuleToggle) => (rule.enabled ? "on" : "off");
const additionalContext = [
  "custom-cursor-plugin-test sessionStart.",
  `ruleA=${state(config.ruleA)}`,
  `ruleB=${state(config.ruleB)}`,
  `session_id=${sessionId}`,
].join(" ");

process.stdout.write(JSON.stringify({ additional_context: additionalContext }));
