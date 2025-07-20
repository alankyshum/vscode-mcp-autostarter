# Development Guide

This guide covers development setup, building, testing, and publishing the VSCode MCP Auto-Starter extension.

## Prerequisites

- Node.js 16.x or higher
- VSCode 1.74.0 or higher
- Git

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/alankyshum/vscode-mcp-autostarter.git
   cd vscode-mcp-autostarter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run compile
   ```

## Development Workflow

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run tests in CI mode
npm run test:ci

# Lint code
npm run lint
```

### Debugging

1. Open the project in VSCode
2. Press `F5` to start debugging
3. A new Extension Development Host window will open with the extension loaded
4. Test your changes in the new window

## Publishing

### Prerequisites for Publishing

1. **Personal Access Token (PAT)**
   - Go to https://dev.azure.com/
   - Sign in with your Microsoft account
   - Click your profile picture → "Personal access tokens"
   - Create a new token with **Marketplace → Manage** permissions

2. **Publisher Account**
   - Publisher "alankyshum" already exists on VS Code Marketplace
   - Verify at: https://marketplace.visualstudio.com/publishers/alankyshum

### Publishing Steps

1. **Set up environment variable with your PAT**
   ```bash
   export VSCE_PAT=your_personal_access_token_here
   ```

2. **Update version in package.json**
   ```bash
   # Update version number manually or use npm version
   npm version patch  # for patch version
   npm version minor  # for minor version
   npm version major  # for major version
   ```

3. **Build and publish**
   ```bash
   # Package the extension (optional, for testing)
   npm run package

   # Publish to marketplace
   npm run publish
   ```

### GitHub Actions Publishing

The repository includes automated publishing via GitHub Actions:

1. **Set up repository secret**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add a new repository secret named `VSCE_PAT`
   - Set the value to your Personal Access Token

2. **Automatic publishing**
   - Publishing happens automatically when you create a GitHub release
   - Or manually trigger via Actions tab → "Publish to Marketplace" workflow

3. **Manual workflow dispatch**
   ```bash
   # Go to Actions tab → "Publish to Marketplace" → "Run workflow"
   # Choose version bump: patch, minor, major, or specific version
   # Enable "Dry run" to test without publishing
   ```

### Alternative Publishing Methods

If the CLI method fails, you can use manual upload:

1. **Build the package**
   ```bash
   npm run package
   ```

2. **Manual upload**
   - Go to https://marketplace.visualstudio.com/manage/publishers/alankyshum
   - Sign in with your Microsoft account
   - Upload the generated `.vsix` file

### Pre-release Publishing

For beta versions:

```bash
# Package pre-release
npm run package:pre-release

# Publish pre-release
npm run publish:pre-release
```

## Project Structure

```
├── src/                    # Source code
│   ├── extension.ts        # Main extension entry point
│   ├── mcpConfigReader.ts  # MCP configuration reading
│   └── mcpProcessManager.ts # Process management
├── out/                    # Compiled JavaScript
├── test/                   # Test files
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
└── README.md              # User documentation
```

## Key Files

- **package.json**: Extension manifest with metadata, commands, and configuration
- **src/extension.ts**: Main extension activation and deactivation logic
- **src/mcpConfigReader.ts**: Handles reading MCP configuration files
- **src/mcpProcessManager.ts**: Manages MCP server processes

## Release Process

1. **Update version** in package.json
2. **Update CHANGELOG.md** with new features and fixes
3. **Test thoroughly** in development mode
4. **Build and test package** locally
5. **Publish to marketplace** using the steps above
6. **Create GitHub release** with release notes
7. **Update documentation** if needed

## Troubleshooting

### Publishing Issues

- **"Unknown error occurred"**: Use the `export VSCE_PAT` method instead of `vsce login`
- **Authentication failures**: Verify your PAT has Marketplace → Manage permissions
- **Package validation errors**: Check package.json for required fields

### Development Issues

- **TypeScript errors**: Run `npm run compile` to see detailed errors
- **Extension not loading**: Check the Extension Development Host console for errors
- **Tests failing**: Ensure all dependencies are installed with `npm install`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Ensure all tests pass before submitting PR

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
