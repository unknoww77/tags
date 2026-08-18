import { readFile, writeFile } from "node:fs/promises";

const url = process.env.PLATFORM_HEALTH_URL;
if (!url) throw new Error("Secret PLATFORM_HEALTH_URL não configurado.");
const statePath = process.env.PLATFORM_HEALTH_STATE_PATH ?? ".platform-health-state.json";
const threshold = Number(process.env.PLATFORM_HEALTH_FAIL_THRESHOLD ?? 2);
let state = { failures: 0, alerted: false };
try { state = JSON.parse(await readFile(statePath, "utf8")); } catch {}
let ok = false;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  ok = response.ok;
} catch {}
state.failures = ok ? 0 : state.failures + 1;
const shouldAlert = !ok && state.failures >= threshold && !state.alerted;
state.alerted = shouldAlert || (!ok && state.alerted);
if (ok) state.alerted = false;
await writeFile(statePath, JSON.stringify(state));
if (shouldAlert) {
  const token = process.env.PLATFORM_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.PLATFORM_TELEGRAM_CHAT_ID;
  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: `Aplicação indisponível: ${url}` }) });
  }
}
if (!ok) throw new Error(`Health check falhou (${state.failures}/${threshold}): ${url}`);
