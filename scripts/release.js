const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function run(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf-8" }).trim();
}

// Today in UTC as YYYY.MM.DD
const today = new Date().toISOString().slice(0, 10).replaceAll("-", ".");

// Find the highest existing sub-version for today's tag, e.g. v2026.10.12.0
const tags = run("git tag --list 'v*'").split("\n").filter(Boolean);
const pattern = new RegExp(`^v${today.replaceAll(".", "\\.")}\\.(\\d+)$`);
let max = -1;
for (const tag of tags) {
  const match = tag.match(pattern);
  if (match) max = Math.max(max, Number(match[1]));
}
const sub = max + 1; // 0 for the first release of the day
const version = `${today}.${sub}`;

console.log(
  `release version: v${version} (existing today: ${max < 0 ? "none" : max})`,
);

if (DRY_RUN) {
  console.log("dry run: skipped version bump/build/commit/tag/push");
  process.exit(0);
}

// Bump package.json version
const pkgPath = path.join(ROOT_DIR, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

run("bun run build");

run("git add -A");
run('git commit -m "chore: build files [skip ci]"');
// Annotated tag + explicit push: `--follow-tags` only pushes annotated tags,
// and a lightweight tag would silently fail to reach the remote.
run(`git tag -a v${version} -m "release v${version}"`);
run("git push origin HEAD");
run(`git push origin v${version}`);
