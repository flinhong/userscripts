const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SCHEDULED =
  args.includes("--scheduled") || process.env.SCHEDULED === "true";

const SEMVER_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const BUILD_COMMIT_RE = /^chore: build files \[skip ci\]$/;
const BREAKING_RE = /\bBREAKING[ -]CHANGE:/;
const BREAKING_SUBJECT_RE = /^[a-z]+(?:\([^)]+\))?!:/;
const FEAT_RE = /^feat(?:\([^)]+\))?:/;
const PATCH_RE = /^(?:fix|perf|revert)(?:\([^)]+\))?:/;

function run(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf-8" }).trim();
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Returns the commit a tag points to on the remote, or null if the tag does
// not exist there (or the remote is unreachable). Best-effort.
function getRemoteTagCommit(tagName) {
  try {
    const output = run(`git ls-remote --tags origin refs/tags/${tagName}`);
    const lines = output.split("\n").filter(Boolean);
    const peeled = lines.find(line => line.endsWith(`${tagName}^{}`));
    const plain = lines.find(line => line.endsWith(tagName));
    const match = peeled || plain;
    return match ? match.split(/\s+/)[0] : null;
  } catch {
    return null;
  }
}

function getOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    fail(`${name} requires a value`);
  }
  return value;
}

function parseVersion(version) {
  const match = version.match(SEMVER_RE);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

function formatVersion({ major, minor, patch, prerelease }) {
  return `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ""}`;
}

function comparePrerelease(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const aParts = a.split(".");
  const bParts = b.split(".");
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    const aNumeric = /^\d+$/.test(aPart);
    const bNumeric = /^\d+$/.test(bPart);

    if (aNumeric && bNumeric) {
      const diff = Number(aPart) - Number(bPart);
      if (diff !== 0) return diff;
    } else if (aNumeric !== bNumeric) {
      // Numeric identifiers always have lower precedence than alphanumeric ones.
      return aNumeric ? -1 : 1;
    } else if (aPart !== bPart) {
      return aPart < bPart ? -1 : 1;
    }
  }

  return 0;
}

function compareVersions(a, b) {
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

function getCommitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const output = run(`git log ${range} --format=%B%x00`);
  if (!output) return [];

  return output
    .split("\0")
    .map(message => message.trim())
    .filter(Boolean)
    .filter(message => !BUILD_COMMIT_RE.test(message.split("\n")[0]));
}

function hasReleaseWorthyCommits(commits) {
  return commits.some(message => {
    const subject = message.split("\n")[0];

    return (
      BREAKING_RE.test(message) ||
      BREAKING_SUBJECT_RE.test(subject) ||
      FEAT_RE.test(subject) ||
      PATCH_RE.test(subject)
    );
  });
}

const pkgPath = path.join(ROOT_DIR, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const packageVersion = parseVersion(pkg.version);

// Sync local tags with the remote so we don't miss a tag that a previous run
// pushed (which would make us create a conflicting one), or reuse a stale tag.
if (!DRY_RUN) {
  try {
    run("git fetch --tags --prune origin");
  } catch {
    console.warn("warning: could not fetch remote tags; using local tags only");
  }
}

// Only strict SemVer tags are considered; legacy date tags such as
// v2026.10.21.0 are intentionally ignored.
const tags = run("git tag --list")
  .split("\n")
  .filter(Boolean)
  .filter(tag => tag.startsWith("v"))
  .map(tag => {
    const version = tag.slice(1);
    const parsed = parseVersion(version);
    return parsed ? { tag, version, parsed } : null;
  })
  .filter(Boolean)
  .sort((a, b) => compareVersions(a.parsed, b.parsed));

const latestTag = tags.at(-1) || null;
const latestStableTag =
  tags.filter(({ parsed }) => !parsed.prerelease).at(-1) || null;

// Follow the latest stable major. By default this is 1.
let current = latestStableTag?.parsed ||
  packageVersion || { major: 1, minor: 0, patch: 0, prerelease: null };
if (packageVersion && compareVersions(packageVersion, current) > 0) {
  current = packageVersion;
}
const major = current.major;

// Version format: MAJOR.YYYYMMDD.PATCH, e.g. 1.20261023.0
const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const dateNumber = Number(date);

const todayTags = tags.filter(
  ({ parsed }) =>
    parsed.major === major && parsed.minor === dateNumber && !parsed.prerelease,
);
const maxPatch = todayTags.reduce(
  (max, { parsed }) => Math.max(max, parsed.patch),
  -1,
);

const explicit = getOption("--release-as") || process.env.RELEASE_AS || null;
let version;
let reason;

if (explicit) {
  const parsed = parseVersion(explicit);
  if (!parsed) {
    fail(`invalid --release-as value: ${explicit}`);
  }
  if (compareVersions(parsed, current) <= 0) {
    fail(
      `--release-as ${explicit} must be greater than current version ${formatVersion(current)}`,
    );
  }
  version = formatVersion(parsed);
  reason = "release-as";
} else if (SCHEDULED) {
  if (todayTags.length > 0) {
    console.log(
      `daily release for ${date} already exists (${todayTags
        .map(({ tag }) => tag)
        .join(", ")}); nothing to do`,
    );
    process.exit(0);
  }

  version = `${major}.${date}.0`;
  reason = `daily release for ${date}`;
} else {
  const commits = getCommitsSince(latestTag?.tag);
  if (!hasReleaseWorthyCommits(commits)) {
    // A previous run may have committed the build (bumping package.json) but
    // failed to push the tag, leaving main ahead of the latest tag. Recover by
    // releasing the pending version instead of silently doing nothing.
    const floor =
      latestStableTag?.parsed || { major: 0, minor: 0, patch: 0, prerelease: null };
    const pendingTagOnRemote =
      packageVersion && !DRY_RUN
        ? getRemoteTagCommit(`v${formatVersion(packageVersion)}`)
        : null;

    if (
      packageVersion &&
      compareVersions(packageVersion, floor) > 0 &&
      !pendingTagOnRemote
    ) {
      version = formatVersion(packageVersion);
      reason = `recover pending release v${version}`;
    } else {
      console.log(
        `no release-worthy commits since ${latestTag ? latestTag.tag : "the first commit"}; nothing to do`,
      );
      process.exit(0);
    }
  } else {
    version = `${major}.${date}.${maxPatch + 1}`;
    reason = `same-day release ${maxPatch + 1} for ${date}`;
  }
}

console.log(`release version: v${version} (${reason})`);

if (DRY_RUN) {
  console.log("dry run: skipped version bump/build/commit/tag/push");
  process.exit(0);
}

const tagName = `v${version}`;

// Idempotency: if the tag already exists on the remote, either we're done
// (it points to HEAD) or there is a genuine conflict we must not overwrite.
if (!DRY_RUN) {
  const remoteCommit = getRemoteTagCommit(tagName);
  if (remoteCommit) {
    const headCommit = run("git rev-parse HEAD");
    if (remoteCommit === headCommit) {
      console.log(
        `tag ${tagName} already exists on remote and points to HEAD; nothing to do`,
      );
      process.exit(0);
    }
    fail(
      `tag ${tagName} already exists on remote (${remoteCommit}) but HEAD is ${headCommit}; refusing to overwrite`,
    );
  }
}

if (tags.some(({ tag }) => tag === tagName)) {
  fail(`tag ${tagName} already exists`);
}

pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

run("bun run build");

run("git add -A");
try {
  run("git diff --cached --quiet");
  console.log("no file changes to commit");
} catch {
  run('git commit -m "chore: build files [skip ci]"');
}

// Annotated tag + explicit push: `--follow-tags` only pushes annotated tags,
// and a lightweight tag would silently fail to reach the remote.
run(`git tag -a ${tagName} -m "release ${tagName}"`);

// Push the branch and the tag together (atomically) so a rejected tag can't
// leave the build commit on main without its tag; retry transient failures.
const pushCmd = `git push --atomic origin HEAD ${tagName}`;
for (let attempt = 1; ; attempt++) {
  try {
    run(pushCmd);
    break;
  } catch (err) {
    if (attempt >= 3) throw err;
    console.warn(`push failed (attempt ${attempt}/3), retrying...`);
  }
}
