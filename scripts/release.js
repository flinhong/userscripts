const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

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

function bumpVersion(base, bump) {
  switch (bump) {
    case "major":
      return { major: base.major + 1, minor: 0, patch: 0, prerelease: null };
    case "minor":
      return {
        major: base.major,
        minor: base.minor + 1,
        patch: 0,
        prerelease: null,
      };
    case "patch":
      return { ...base, patch: base.patch + 1, prerelease: null };
    default:
      fail(`unknown bump type: ${bump}`);
  }
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

function determineBump(commits) {
  let bump = null;

  for (const message of commits) {
    const subject = message.split("\n")[0];

    if (BREAKING_RE.test(message) || BREAKING_SUBJECT_RE.test(subject)) {
      return "major";
    }

    if (FEAT_RE.test(subject)) {
      bump = "minor";
    } else if (PATCH_RE.test(subject) && !bump) {
      bump = "patch";
    }
  }

  return bump;
}

const pkgPath = path.join(ROOT_DIR, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const packageVersion = parseVersion(pkg.version);

// Only strict MAJOR.MINOR.PATCH tags are considered; legacy date tags
// (e.g. v2026.10.21.0) are intentionally ignored.
const tags = run("git tag --list 'v*'")
  .split("\n")
  .filter(Boolean)
  .map(tag => ({ tag, version: tag.slice(1) }))
  .filter(({ version }) => parseVersion(version))
  .sort((a, b) =>
    compareVersions(parseVersion(a.version), parseVersion(b.version)),
  );

const latestTag = tags.at(-1) || null;
let base = latestTag
  ? parseVersion(latestTag.version)
  : packageVersion || { major: 0, minor: 0, patch: 0, prerelease: null };

// Prefer package.json if it has been bumped ahead of the latest tag.
if (packageVersion && compareVersions(packageVersion, base) > 0) {
  base = packageVersion;
}

const releaseAs = getOption("--release-as") || process.env.RELEASE_AS || null;
let version;

if (releaseAs) {
  if (["major", "minor", "patch"].includes(releaseAs)) {
    version = formatVersion(bumpVersion(base, releaseAs));
  } else {
    const parsed = parseVersion(releaseAs);
    if (!parsed) {
      fail(`invalid --release-as value: ${releaseAs}`);
    }
    if (compareVersions(parsed, base) <= 0) {
      fail(
        `--release-as ${releaseAs} must be greater than current version ${formatVersion(base)}`,
      );
    }
    version = formatVersion(parsed);
  }
} else {
  const commits = getCommitsSince(latestTag?.tag);
  const bump = determineBump(commits);

  if (!bump) {
    console.log(
      `no release-worthy commits since ${latestTag ? latestTag.tag : "the first commit"}; nothing to do`,
    );
    process.exit(0);
  }

  version = formatVersion(bumpVersion(base, bump));
  console.log(
    `release version: v${version} (${bump} bump from v${formatVersion(base)})`,
  );
}

if (releaseAs) {
  console.log(
    `release version: v${version} (release-as from v${formatVersion(base)})`,
  );
}

if (DRY_RUN) {
  console.log("dry run: skipped version bump/build/commit/tag/push");
  process.exit(0);
}

const tagName = `v${version}`;
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
run("git push origin HEAD");
run(`git push origin ${tagName}`);
