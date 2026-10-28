const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const workspaceDir = path.resolve(__dirname, '..', 'workspace');
const outDir = path.join(workspaceDir, 'out');

console.log('Initializing Motion Studio workspace at:', workspaceDir);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write .gitignore for workspace
const gitignoreContent = `node_modules
.remotion
out
*.mp4
`;
fs.writeFileSync(path.join(workspaceDir, '.gitignore'), gitignoreContent);

try {
  const isGit = fs.existsSync(path.join(workspaceDir, '.git'));
  if (!isGit) {
    console.log('Running git init...');
    execSync('git init', { cwd: workspaceDir, stdio: 'inherit' });
    execSync('git config user.name "Motion Studio Agent"', { cwd: workspaceDir, stdio: 'ignore' });
    execSync('git config user.email "agent@motionstudio.local"', { cwd: workspaceDir, stdio: 'ignore' });
    execSync('git add .', { cwd: workspaceDir, stdio: 'inherit' });
    execSync('git commit -m "chore: initial workspace commit with rules and example compositions"', {
      cwd: workspaceDir,
      stdio: 'inherit',
    });
    console.log('Workspace git repository initialized and committed successfully.');
  } else {
    console.log('Workspace is already a git repository.');
  }
} catch (err) {
  console.error('Error initializing workspace git repo:', err.message);
}
