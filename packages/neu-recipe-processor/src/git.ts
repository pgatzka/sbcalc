import { existsSync } from "node:fs";
import simpleGit from "simple-git";
import { createTimer } from "./log.js";

const REPO_URL =
  "https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO.git";

export async function ensureRepo(repoDir: string): Promise<void> {
  if (existsSync(repoDir)) {
    const done = createTimer("Pulling latest changes");
    const git = simpleGit(repoDir);
    await git.pull();
    done();
  } else {
    const done = createTimer("Cloning repository");
    await simpleGit().clone(REPO_URL, repoDir);
    done();
  }
}
