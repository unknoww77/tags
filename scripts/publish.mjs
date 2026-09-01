#!/usr/bin/env node
/**
 * Publica commits nesta máquina → GitHub → Deploy Top1Tags (Actions).
 *
 * Uso:
 *   node scripts/publish.mjs -m "mensagem do commit"
 *   node scripts/publish.mjs --wait          # espera deploy em andamento
 *   node scripts/publish.mjs --cancel        # cancela deploy GH e empurra tudo junto
 *   node scripts/publish.mjs --status        # só mostra estado git + deploy
 *
 * Requer no .env (não commitar):
 *   GIT_PUSH_TOKEN=ghp_...   (repo scope: contents + actions)
 *   GITHUB_REPO=unknoww77/tags  (opcional)
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE_DIR = join(ROOT, ".publish-queue");
const LOCK_FILE = join(QUEUE_DIR, ".lock");
const STATE_FILE = join(QUEUE_DIR, "state.json");

const DEPLOY_WORKFLOW_NAME = "Deploy Top1Tags";
const POLL_MS = 20_000;
const MAX_WAIT_MS = 45 * 60_000;

function loadEnvFile() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    ...opts,
  });
  return { ok: r.status === 0, stdout: r.stdout?.trim() ?? "", stderr: r.stderr?.trim() ?? "", status: r.status };
}

function git(args) {
  return run("git", args);
}

function parseArgs(argv) {
  const out = { message: null, mode: "wait", statusOnly: false, noCommit: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--status") out.statusOnly = true;
    else if (a === "--cancel") out.mode = "cancel";
    else if (a === "--wait") out.mode = "wait";
    else if (a === "--batch") out.mode = "batch";
    else if (a === "--no-commit") out.noCommit = true;
    else if (a === "-m" || a === "--message") out.message = argv[++i] ?? "";
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
Publicar (commit + push + deploy via GitHub Actions)

  npm run publish -- -m "sua mensagem"
  npm run publish -- --wait|-m "..."     Espera deploy atual terminar (padrão)
  npm run publish -- --cancel -m "..."   Cancela deploy em andamento e sobe junto
  npm run publish -- --batch -m "..."    Só commit local se deploy rodando; push depois
  npm run publish -- --status            Estado git + deploy

Configure GIT_PUSH_TOKEN no .env (fine-grained: Contents Read/Write + Actions Read/Write).
`);
}

function getRepo() {
  const fromEnv = process.env.GITHUB_REPO?.trim();
  if (fromEnv) return fromEnv;
  const remote = git(["remote", "get-url", "origin"]);
  if (remote.ok && remote.stdout) {
    const m = remote.stdout.match(/github\.com[:/](.+?)(?:\.git)?$/i);
    if (m) return m[1];
  }
  return "unknoww77/tags";
}

function getToken() {
  const t = process.env.GIT_PUSH_TOKEN || process.env.GITHUB_TOKEN;
  if (!t?.trim()) {
    throw new Error(
      "GIT_PUSH_TOKEN não configurado. Adicione no .env um PAT com permissão de push no repo e Actions."
    );
  }
  return t.trim();
}

async function gh(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`GitHub API ${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return data;
}

async function getDeployRuns(repo, status) {
  const q = status ? `?status=${status}&per_page=5` : "?per_page=5";
  const data = await gh(`/repos/${repo}/actions/workflows/deploy.yaml/runs${q}`);
  return data.workflow_runs ?? [];
}

async function getActiveDeployRuns(repo) {
  const inProgress = await getDeployRuns(repo, "in_progress");
  const queued = await getDeployRuns(repo, "queued");
  return [...inProgress, ...queued].filter(
    (r) => r.name === DEPLOY_WORKFLOW_NAME || r.path?.includes("deploy.yaml")
  );
}

async function cancelRun(repo, runId) {
  await gh(`/repos/${repo}/actions/runs/${runId}/cancel`, { method: "POST" });
}

function saveState(state) {
  mkdirSync(QUEUE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function hasLocalChanges() {
  const s = git(["status", "--porcelain"]);
  return Boolean(s.stdout);
}

function isAheadOfOrigin() {
  const b = git(["status", "-sb"]);
  return b.stdout.includes("ahead");
}

function shouldSkipPath(path) {
  if (path === "tsconfig.tsbuildinfo") return true;
  if (path.startsWith(".publish-queue/")) return true;
  return false;
}

function commitAll(message) {
  const status = git(["status", "--porcelain"]);
  if (!status.stdout) {
    console.log("Nada para commitar.");
    return false;
  }

  const files = status.stdout
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter((p) => p && !shouldSkipPath(p));

  if (!files.length) {
    console.log("Só artefatos ignorados (ex: tsconfig.tsbuildinfo).");
    return false;
  }

  for (const f of files) {
    const add = git(["add", "--", f]);
    if (!add.ok) throw new Error(`git add falhou: ${add.stderr}`);
  }

  const log = git(["log", "-1", "--format=%an <%ae>"]);
  const author = log.stdout || "unknoww77 <unknoww77@users.noreply.github.com>";
  const [name, emailRaw] = author.split("<");
  const email = emailRaw?.replace(">", "").trim() || "unknoww77@users.noreply.github.com";

  const commit = run("git", ["-c", `user.name=${name.trim()}`, "-c", `user.email=${email}`, "commit", "-m", message], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (!commit.ok) throw new Error(`git commit falhou: ${commit.stderr}`);
  console.log("Commit criado:", message);
  return true;
}

function pushToOrigin(repo, token) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout || "main";
  const url = `https://x-access-token:${token}@github.com/${repo}.git`;
  console.log(`Push ${branch} → origin (${repo})…`);
  const push = run("git", ["push", url, `HEAD:${branch}`]);
  if (!push.ok) throw new Error(`git push falhou: ${push.stderr || push.stdout}`);
  console.log("Push OK. GitHub Actions deve iniciar Deploy Top1Tags.");
}

async function waitForDeploy(repo, mode) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    const active = await getActiveDeployRuns(repo);
    if (!active.length) return;
    const run = active[0];
    console.log(
      `Deploy em andamento: #${run.run_number} (${run.status}) — ${run.html_url || ""}`
    );

    if (mode === "cancel") {
      console.log("Cancelando deploy em andamento para subir tudo junto…");
      for (const r of active) {
        try {
          await cancelRun(repo, r.id);
          console.log(`Cancelado run ${r.id}`);
        } catch (e) {
          console.warn(`Falha ao cancelar ${r.id}:`, e.message);
        }
      }
      await sleep(8_000);
      return;
    }

    if (mode === "batch") {
      saveState({
        queuedAt: new Date().toISOString(),
        mode: "batch",
        note: "Push pendente — rode npm run publish quando deploy terminar",
      });
      throw new Error(
        "BATCH: deploy em andamento. Commit local salvo. Rode `npm run publish` novamente quando o deploy terminar (ou use --cancel)."
      );
    }

    console.log(`Aguardando ${POLL_MS / 1000}s…`);
    await sleep(POLL_MS);
  }
  throw new Error("Timeout esperando deploy anterior.");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function printStatus(repo) {
  console.log("=== Git ===");
  console.log(git(["status", "-sb"]).stdout);
  console.log(git(["log", "-1", "--oneline"]).stdout);
  console.log("\n=== Deploy GitHub Actions ===");
  try {
    const active = await getActiveDeployRuns(repo);
    if (!active.length) {
      console.log("Nenhum Deploy Top1Tags em andamento/fila.");
    } else {
      for (const r of active) {
        console.log(`- #${r.run_number} ${r.status} ${r.conclusion ?? ""} ${r.html_url}`);
      }
    }
    const last = await getDeployRuns(repo);
    if (last[0]) {
      console.log(`Último: #${last[0].run_number} ${last[0].status} ${last[0].conclusion ?? ""}`);
    }
  } catch (e) {
    console.log("Não foi possível consultar Actions:", e.message);
  }
  const state = readState();
  if (state) console.log("\nFila local:", JSON.stringify(state));
}

async function acquireLock() {
  mkdirSync(QUEUE_DIR, { recursive: true });
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      writeFileSync(LOCK_FILE, String(process.pid), { flag: "wx" });
      return;
    } catch {
      await sleep(2000);
    }
  }
  throw new Error("Outro publish em andamento (.publish-queue/.lock)");
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) {
      const pid = readFileSync(LOCK_FILE, "utf8");
      if (pid === String(process.pid)) {
        run("rm", ["-f", LOCK_FILE]);
      }
    }
  } catch {
    /* ignore */
  }
}

async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const repo = getRepo();

  if (args.statusOnly) {
    await printStatus(repo);
    return;
  }

  await acquireLock();
  try {
    const activeBefore = await getActiveDeployRuns(repo);
    if (activeBefore.length) {
      await waitForDeploy(repo, args.mode);
    }

    // Após espera/cancel, se surgiram mais mudanças, um único commit
    if (!args.noCommit && args.message) {
      commitAll(args.message);
    } else if (!args.noCommit && hasLocalChanges() && !args.message) {
      throw new Error("Use -m \"mensagem do commit\" para commitar alterações.");
    }

    if (!isAheadOfOrigin()) {
      console.log("Nada para enviar (branch não está ahead de origin).");
      if (existsSync(STATE_FILE)) run("rm", ["-f", STATE_FILE]);
      return;
    }

  // Re-check deploy após commit (outro push pode ter disparado)
    const activeMid = await getActiveDeployRuns(repo);
    if (activeMid.length && args.mode === "wait") {
      await waitForDeploy(repo, "wait");
    } else if (activeMid.length && args.mode === "cancel") {
      await waitForDeploy(repo, "cancel");
    } else if (activeMid.length && args.mode === "batch") {
      saveState({ queuedAt: new Date().toISOString(), mode: "batch" });
      throw new Error("Deploy iniciou antes do push. Rode `npm run publish` novamente em alguns minutos.");
    }

    const token = getToken();
    pushToOrigin(repo, token);
    if (existsSync(STATE_FILE)) run("rm", ["-f", STATE_FILE]);
    console.log("\nAcompanhe: https://github.com/" + repo + "/actions");
  } finally {
    releaseLock();
  }
}

main().catch((e) => {
  if (e.message?.startsWith("BATCH:")) {
    console.log(e.message.replace("BATCH: ", ""));
    process.exit(0);
  }
  console.error("Erro:", e.message || e);
  process.exit(1);
});
