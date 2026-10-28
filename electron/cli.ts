#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { runAgent, getAgyExecutable } from './agent';
import { runTsc } from './validate';
import { runRender } from './render';
import { gitCommitAll, gitRollback, gitUndo, gitHistory, git, ensureWorkspaceGit } from './git';

const WORKSPACE_DIR = path.resolve(__dirname, '..', 'workspace');

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function banner() {
  console.log(`\n${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.cyan}${c.bold}║           ⚡ MOTION STUDIO — Google CLI Agent Wrapper        ║${c.reset}`);
  console.log(`${c.cyan}${c.bold}╚══════════════════════════════════════════════════════════════╝${c.reset}\n`);
}

function printUsage() {
  banner();
  console.log(`${c.bold}Usage:${c.reset}`);
  console.log(`  motion <command> [options]\n`);
  console.log(`${c.bold}Commands:${c.reset}`);
  console.log(`  ${c.green}motion "<prompt>"${c.reset}               Generate / edit an animation via agy`);
  console.log(`  ${c.green}motion login${c.reset}                    Interactive Google agy login & account check`);
  console.log(`  ${c.green}motion list${c.reset}                     List all compositions in the workspace`);
  console.log(`  ${c.green}motion render [comp]${c.reset}            Render a composition to MP4 (headless)`);
  console.log(`  ${c.green}motion studio [--open]${c.reset}          Start Remotion Studio dev server`);
  console.log(`  ${c.green}motion undo${c.reset}                     Roll back the workspace to previous commit`);
  console.log(`  ${c.green}motion history${c.reset}                  Show recent generation commits`);
  console.log(`  ${c.green}motion status${c.reset}                   Check CLI, Node, and Remotion dependencies\n`);
  console.log(`${c.bold}Options for prompt:${c.reset}`);
  console.log(`  ${c.cyan}-c, --comp <name>${c.reset}               Target composition (e.g. TitleCard)`);
  console.log(`  ${c.cyan}-f, --frames <range>${c.reset}             Target frame range (e.g. 0-90)`);
  console.log(`  ${c.cyan}-r, --render${c.reset}                    Render MP4 immediately after generation`);
  console.log(`  ${c.cyan}--retries <n>${c.reset}                   Max auto-repair retries (default: 2)\n`);
  console.log(`${c.bold}Examples:${c.reset}`);
  console.log(`  ${c.gray}motion "Create a futuristic neon title card with title 'AI MOTION' "${c.reset}`);
  console.log(`  ${c.gray}motion -c TitleCard -f 0-45 "Change text to 'WELCOME' and primary color to blue"${c.reset}`);
  console.log(`  ${c.gray}motion render TitleCard${c.reset}`);
  console.log(`  ${c.gray}motion login${c.reset}\n`);
}

async function cmdLogin() {
  banner();
  const agyBin = getAgyExecutable();
  console.log(`${c.cyan}⚡ Launching Google Antigravity CLI (agy) for login...${c.reset}`);
  console.log(`${c.gray}Executable: ${agyBin}${c.reset}\n`);

  // Run agy interactively so the user can log in or check status directly in this terminal
  const child = spawn(agyBin, [], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env },
  });

  child.on('close', (code) => {
    console.log(`\n${c.green}✓ agy session closed with exit code ${code}.${c.reset}`);
  });
}

async function cmdStatus() {
  banner();
  console.log(`${c.bold}Environment & Diagnostics:${c.reset}\n`);

  // 1. agy check
  const agyBin = getAgyExecutable();
  const agyExists = fs.existsSync(agyBin);
  console.log(`  • Google agy executable: ${agyExists ? c.green + agyBin : c.red + 'Not found at ' + agyBin}${c.reset}`);

  // 2. Node version
  console.log(`  • Node.js version:       ${c.green}${process.version}${c.reset}`);

  // 3. Workspace
  const wsExists = fs.existsSync(WORKSPACE_DIR);
  console.log(`  • Workspace directory:   ${wsExists ? c.green + WORKSPACE_DIR : c.red + 'Missing'}${c.reset}`);

  // 4. Git check
  try {
    const gitHead = await git(['rev-parse', '--short', 'HEAD'], WORKSPACE_DIR);
    console.log(`  • Workspace Git HEAD:    ${c.green}${gitHead}${c.reset}`);
  } catch (err) {
    console.log(`  • Workspace Git:         ${c.red}Not initialized or git error${c.reset}`);
  }

  // 5. Compositions count
  try {
    const compDir = path.join(WORKSPACE_DIR, 'src', 'compositions');
    const files = fs.readdirSync(compDir).filter((f) => f.endsWith('.tsx'));
    console.log(`  • Registered Comps:      ${c.green}${files.length} (${files.map((f) => path.basename(f, '.tsx')).join(', ')})${c.reset}`);
  } catch {
    console.log(`  • Registered Comps:      ${c.yellow}Cannot read compositions folder${c.reset}`);
  }

  console.log('');
}

async function cmdList() {
  banner();
  console.log(`${c.bold}Available Compositions in Workspace:${c.reset}\n`);
  const compDir = path.join(WORKSPACE_DIR, 'src', 'compositions');
  if (!fs.existsSync(compDir)) {
    console.log(`  ${c.red}Compositions directory not found: ${compDir}${c.reset}`);
    return;
  }

  const files = fs.readdirSync(compDir).filter((f) => f.endsWith('.tsx'));
  files.forEach((file, idx) => {
    const name = path.basename(file, '.tsx');
    console.log(`  ${c.cyan}${idx + 1}.${c.reset} ${c.bold}${name}${c.reset} ${c.gray}(src/compositions/${file})${c.reset}`);
  });
  console.log('');
}

async function cmdUndo() {
  banner();
  console.log(`${c.yellow}↩️ Rolling back workspace to previous commit...${c.reset}`);
  try {
    await gitUndo(WORKSPACE_DIR);
    console.log(`${c.green}✓ Workspace rolled back successfully to HEAD~1.${c.reset}`);
  } catch (err: unknown) {
    console.error(`${c.red}❌ Undo failed: ${err instanceof Error ? err.message : String(err)}${c.reset}`);
  }
}

async function cmdHistory() {
  banner();
  console.log(`${c.bold}Recent Workspace Commit History:${c.reset}\n`);
  const commits = await gitHistory(8, WORKSPACE_DIR);
  if (commits.length === 0) {
    console.log(`  ${c.gray}No commits found.${c.reset}`);
    return;
  }
  commits.forEach((line) => {
    console.log(`  ${c.yellow}${line}${c.reset}`);
  });
  console.log('');
}

async function cmdStudio(openBrowser: boolean) {
  banner();
  console.log(`${c.cyan}Starting Remotion Studio on port 3010...${c.reset}`);
  if (!openBrowser) {
    console.log(`${c.gray}(Browser auto-open disabled; use --open to launch browser)${c.reset}`);
  }
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['remotion', 'studio', 'src/index.ts', '--port', '3010'];
  if (!openBrowser) {
    args.push('--no-open');
  }

  const child = spawn(npxCmd, args, {
    cwd: WORKSPACE_DIR,
    stdio: 'inherit',
    shell: true,
  });

  child.on('close', (code) => {
    console.log(`Studio exited with code ${code}`);
  });
}

function renderProgressBar(percent: number, width = 30): string {
  const completed = Math.round((percent / 100) * width);
  const remaining = width - completed;
  const bar = '█'.repeat(completed) + '░'.repeat(remaining);
  return `[${bar}] ${percent}%`;
}

async function cmdRender(compositionId: string) {
  banner();
  console.log(`${c.cyan}⚡ Rendering composition: ${c.bold}${compositionId}${c.reset} to MP4...\n`);

  let lastPercent = -1;
  try {
    const outputPath = await runRender(compositionId, {}, WORKSPACE_DIR, (percent) => {
      if (percent !== lastPercent) {
        lastPercent = percent;
        process.stdout.write(`\r  ${c.green}${renderProgressBar(percent)}${c.reset}`);
      }
    });
    console.log(`\n\n${c.green}${c.bold}✅ Render Complete!${c.reset}`);
    console.log(`  Output file: ${c.cyan}${outputPath}${c.reset}\n`);
  } catch (err: unknown) {
    console.error(`\n${c.red}❌ Render failed: ${err instanceof Error ? err.message : String(err)}${c.reset}`);
  }
}

async function cmdPrompt(
  promptText: string,
  targetComp?: string,
  frames?: string,
  autoRender?: boolean,
  maxRetries = 2
) {
  banner();
  await git(['config', 'core.autocrlf', 'false'], WORKSPACE_DIR).catch(() => {});

  let composedPrompt = promptText.trim();
  if (frames) {
    composedPrompt += `\n\n[Only affect frames ${frames.trim()}]`;
  }
  if (targetComp) {
    composedPrompt = `[Context: Active composition is "${targetComp}" in src/compositions/${targetComp}.tsx]\n${composedPrompt}`;
  }

  console.log(`${c.bold}Target Composition:${c.reset} ${targetComp ? c.cyan + targetComp : c.gray + '(Auto)'}${c.reset}`);
  if (frames) console.log(`${c.bold}Frame Window:${c.reset}       ${c.yellow}${frames}${c.reset}`);
  console.log(`${c.bold}Prompt:${c.reset}             "${promptText}"\n`);

  console.log(`${c.cyan}⚡ Invoking Google agy agent in workspace...${c.reset}`);

  try {
    await runAgent(composedPrompt, WORKSPACE_DIR, (line) => {
      // Pretty-print stream log lines
      if (line.startsWith('⚡') || line.startsWith('⚙️') || line.startsWith('✓')) {
        console.log(`  ${c.dim}${line}${c.reset}`);
      } else if (line.startsWith('[agent info]')) {
        console.log(`  ${c.gray}${line}${c.reset}`);
      } else {
        console.log(`  ${line}`);
      }
    });

    // Validation loop
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`\n${c.cyan}🔍 Checking TypeScript (tsc --noEmit)...${c.reset}`);
      const errors = await runTsc(WORKSPACE_DIR);
      if (!errors) {
        console.log(`${c.green}✨ TypeScript validation passed with zero errors!${c.reset}`);
        break;
      }

      if (attempt < maxRetries - 1) {
        console.log(`${c.yellow}⚠️ TypeScript errors found. Auto-repairing with agy (attempt ${attempt + 1}/${maxRetries})...${c.reset}`);
        console.log(`${c.dim}${errors.slice(0, 300)}...${c.reset}`);
        await runAgent(
          `Fix these TypeScript errors in the workspace compositions:\n${errors}\nFollow AGENTS.md rules strictly.`,
          WORKSPACE_DIR,
          (line) => console.log(`  ${c.dim}${line}${c.reset}`)
        );
      } else {
        const finalErrors = await runTsc(WORKSPACE_DIR);
        if (finalErrors) {
          console.log(`\n${c.red}🔄 Max retries exceeded. Rolling back workspace changes...${c.reset}`);
          await gitRollback(WORKSPACE_DIR);
          console.error(`\n${c.red}❌ Generation failed:\n${finalErrors}${c.reset}`);
          process.exit(1);
        }
      }
    }

    // Stage and commit
    const shortPrompt = promptText.replace(/\r?\n+/g, ' ').slice(0, 50).trim();
    const commitResult = await gitCommitAll(`agent: ${shortPrompt}`, WORKSPACE_DIR);

    if (commitResult.committed) {
      console.log(`\n${c.green}${c.bold}✅ Success! Generation committed to workspace Git.${c.reset}`);
    } else {
      console.log(`\n${c.yellow}ℹ️ Agent finished (no file changes made).${c.reset}`);
    }

    // Auto-render if requested
    if (autoRender) {
      const compToRender = targetComp || 'TitleCard';
      console.log('');
      await cmdRender(compToRender);
    }
  } catch (err: unknown) {
    console.error(`\n${c.red}❌ Execution error: ${err instanceof Error ? err.message : String(err)}${c.reset}`);
    process.exit(1);
  }
}

// ─── Entrypoint CLI Parser ───────────────────────────────────────────────────

async function main() {
  await ensureWorkspaceGit(WORKSPACE_DIR).catch(() => {});
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    return;
  }

  const firstArg = args[0];

  if (firstArg === 'login' || firstArg === 'auth') {
    await cmdLogin();
    return;
  }

  if (firstArg === 'status' || firstArg === 'check') {
    await cmdStatus();
    return;
  }

  if (firstArg === 'list' || firstArg === 'ls') {
    await cmdList();
    return;
  }

  if (firstArg === 'undo') {
    await cmdUndo();
    return;
  }

  if (firstArg === 'history' || firstArg === 'log') {
    await cmdHistory();
    return;
  }

  if (firstArg === 'studio') {
    const open = args.includes('--open');
    await cmdStudio(open);
    return;
  }

  if (firstArg === 'render') {
    let comp = args[1];
    if (!comp) {
      // Default to TitleCard or first available
      comp = 'TitleCard';
    }
    await cmdRender(comp);
    return;
  }

  // Parse prompt command
  let promptText = '';
  let targetComp: string | undefined;
  let frames: string | undefined;
  let autoRender = false;
  let maxRetries = 2;

  let i = 0;
  if (firstArg === 'prompt') i = 1;

  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-c' || arg === '--comp' || arg === '--composition') {
      targetComp = args[++i];
    } else if (arg === '-f' || arg === '--frames' || arg === '--frame') {
      frames = args[++i];
    } else if (arg === '-r' || arg === '--render') {
      autoRender = true;
    } else if (arg === '--retries') {
      maxRetries = parseInt(args[++i], 10) || 2;
    } else if (!promptText) {
      promptText = arg;
    } else {
      promptText += ' ' + arg;
    }
  }

  if (!promptText) {
    console.error(`${c.red}Error: No prompt provided.${c.reset}\n`);
    printUsage();
    process.exit(1);
  }

  await cmdPrompt(promptText, targetComp, frames, autoRender, maxRetries);
}

main().catch((err) => {
  console.error(`Fatal error:`, err);
  process.exit(1);
});
