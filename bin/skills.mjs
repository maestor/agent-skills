#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const bundledSkillsDir = path.join(packageRoot, "skills");
const defaultDest = ".agents/skills";

function printHelp() {
  console.log(`skills

Usage:
  skills list
  skills install <skill-name...> [--dest <path>] [--cwd <path>] [--force]
  skills install --all [--dest <path>] [--cwd <path>] [--force]
  skills help

Defaults:
  destination: ${defaultDest}
`);
}

function parseArgs(argv) {
  const positional = [];
  let all = false;
  let force = false;
  let dest = defaultDest;
  let cwd = process.cwd();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--all") {
      all = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--dest") {
      i += 1;
      if (i >= argv.length) {
        throw new Error("Missing value for --dest");
      }
      dest = argv[i];
      continue;
    }
    if (arg === "--cwd") {
      i += 1;
      if (i >= argv.length) {
        throw new Error("Missing value for --cwd");
      }
      cwd = argv[i];
      continue;
    }
    positional.push(arg);
  }

  return { positional, all, force, dest, cwd };
}

function listBundledSkills() {
  return fs
    .readdirSync(bundledSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateSkillDir(skillName) {
  const skillDir = path.join(bundledSkillsDir, skillName);
  const skillMd = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillDir) || !fs.statSync(skillDir).isDirectory()) {
    throw new Error(`Unknown skill: ${skillName}`);
  }
  if (!fs.existsSync(skillMd)) {
    throw new Error(`Skill is missing SKILL.md: ${skillName}`);
  }
  return skillDir;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(sourceDir, targetDir, force) {
  if (fs.existsSync(targetDir)) {
    if (!force) {
      throw new Error(`Destination already exists: ${targetDir}`);
    }
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function runList() {
  const skills = listBundledSkills();
  if (skills.length === 0) {
    console.log("No bundled skills found.");
    return;
  }
  for (const skill of skills) {
    console.log(skill);
  }
}

function runInstall(options) {
  const projectRoot = path.resolve(options.cwd);
  const destinationRoot = path.resolve(projectRoot, options.dest);
  const availableSkills = listBundledSkills();
  const selectedSkills = options.all ? availableSkills : options.positional;

  if (selectedSkills.length === 0) {
    throw new Error("No skills selected. Use `skills list` or `skills install --all`.");
  }

  ensureDir(destinationRoot);

  for (const skillName of selectedSkills) {
    const sourceDir = validateSkillDir(skillName);
    const targetDir = path.join(destinationRoot, skillName);
    copyDir(sourceDir, targetDir, options.force);
    console.log(`Installed ${skillName} -> ${path.relative(projectRoot, targetDir)}`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] ?? "help";

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    runList();
    return;
  }

  if (command === "install") {
    const options = parseArgs(argv.slice(1));
    runInstall(options);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}
