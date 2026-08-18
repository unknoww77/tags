const { spawnSync } = require("child_process");

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("[entrypoint] prisma db push");
run("npx", ["prisma", "db", "push", "--skip-generate"]);

console.log("[entrypoint] seed super admin");
spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("[entrypoint] starting next");
run("node", ["server.js"]);
