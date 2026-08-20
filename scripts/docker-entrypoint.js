const { spawnSync } = require("child_process");
const path = require("path");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");

console.log("[entrypoint] migrate lead status (if needed)");
const migrateSql = path.join(process.cwd(), "prisma", "scripts", "migrate-lead-status.sql");
const migrate = spawnSync("node", [prismaCli, "db", "execute", "--file", migrateSql], {
  stdio: "inherit",
  env: process.env,
});
if (migrate.status !== 0) {
  console.warn("[entrypoint] lead status migration skipped or failed, continuing");
}

console.log("[entrypoint] prisma db push");
run("node", [prismaCli, "db", "push", "--skip-generate"]);

console.log("[entrypoint] seed super admin");
const seed = spawnSync("node", [tsxCli, "prisma/seed.ts"], {
  stdio: "inherit",
  env: process.env,
});
if (seed.status !== 0) {
  console.warn("[entrypoint] seed failed or skipped, continuing");
}

console.log("[entrypoint] starting next");
run("node", ["server.js"]);
