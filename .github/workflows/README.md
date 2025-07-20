# GitHub Actions Workflows

This directory contains automated workflows for the MCP Auto-Starter extension.

## Workflows

### 🔄 CI (`ci.yml`)
**Trigger**: Push/PR to main or develop branches
**Purpose**: Continuous integration testing

- Runs on Node.js 18.x and 20.x
- Lints code with ESLint
- Compiles TypeScript
- Runs tests with VS Code test framework
- Packages extension for validation
- Uploads VSIX artifact

### 🚀 Publish (`publish.yml`)
**Trigger**: GitHub releases or manual dispatch
**Purpose**: Publish extension to VS Code Marketplace

**Requirements**:
- Repository secret `VSCE_PAT` must be set with your Personal Access Token

**Features**:
- Automatic publishing on GitHub releases
- Manual publishing with version control
- Dry run option for testing
- VSCE_PAT validation
- Comprehensive error handling

**Manual Usage**:
1. Go to Actions tab → "Publish to Marketplace"
2. Click "Run workflow"
3. Choose version bump or specific version
4. Enable "Dry run" to test without publishing

### 📦 Release (`release.yml`)
**Trigger**: Git tags (v*) or manual dispatch
**Purpose**: Create GitHub releases with VSIX files

- Builds and tests extension
- Packages VSIX file
- Creates GitHub release with changelog
- Uploads VSIX as release asset

## Setup Instructions

### 1. Personal Access Token (PAT)
1. Go to https://dev.azure.com/
2. Sign in with Microsoft account
3. Create Personal Access Token with **Marketplace → Manage** permissions
4. Copy the token

### 2. Repository Secret
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `VSCE_PAT`
4. Value: Your Personal Access Token
5. Click "Add secret"

### 3. Verify Setup
- The publish workflow will validate the secret exists
- Use "Dry run" option to test without publishing

## Publishing Process

### Automatic (Recommended)
1. Create and push a git tag: `git tag v0.1.3 && git push origin v0.1.3`
2. Release workflow creates GitHub release
3. Publish workflow automatically publishes to marketplace

### Manual
1. Go to Actions → "Publish to Marketplace" → "Run workflow"
2. Choose version bump type
3. Optionally enable dry run for testing
4. Click "Run workflow"

## Troubleshooting

### Common Issues
- **"VSCE_PAT secret is not set"**: Add the repository secret
- **"Authentication failed"**: Verify PAT has correct permissions
- **"Unknown error occurred"**: The workflow uses environment variable method which should work

### Debug Steps
1. Check Actions logs for detailed error messages
2. Verify PAT permissions at https://dev.azure.com/
3. Test locally with `export VSCE_PAT=your_token && npm run publish`
4. Use dry run option to test workflow without publishing
