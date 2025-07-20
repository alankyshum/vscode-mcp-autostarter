import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Detect CI environment
		const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
		console.log(`Running tests in ${isCI ? 'CI' : 'local'} environment`);

		// Download VS Code, unzip it and run the integration test
		const testOptions = {
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--disable-extensions',
				'--disable-gpu',
				'--no-sandbox',
				'--disable-dev-shm-usage',
				'--disable-web-security',
				'--disable-features=VizDisplayCompositor' // Disable compositor for headless
			]
		};

		// Add CI-specific options
		if (isCI) {
			testOptions.launchArgs.push('--headless');
		}

		await runTests(testOptions);
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
