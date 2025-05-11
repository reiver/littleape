// scripts/prepare.js
const fs = require("fs");
const { execSync } = require("child_process");

const isCI = process.env.CI === "true";
const isGitRepo = fs.existsSync(".git");

if (!isCI && isGitRepo) {
  execSync("husky install", { stdio: "inherit" });
} else {
  console.log("Skipping husky install (CI or no .git directory)");
}
