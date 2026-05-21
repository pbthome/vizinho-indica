const fs = require('fs');
const path = require('path');

process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.ALL_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';
process.env.all_proxy = '';
process.env.GIT_HTTP_PROXY = '';
process.env.GIT_HTTPS_PROXY = '';
process.env.EXPO_NO_TELEMETRY = 'true';
process.env.REACT_NATIVE_PACKAGER_HOSTNAME =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME ||
  Object.values(require('os').networkInterfaces())
    .flat()
    .find((item) => item && item.family === 'IPv4' && !item.internal && item.address.startsWith('192.168.'))?.address ||
  'localhost';
process.env.USERPROFILE = process.cwd();
process.env.HOME = process.cwd();

loadDotEnv(process.cwd());

(async () => {
  const cliPath = '../node_modules/expo/node_modules/@expo/cli/build/src';
  const { BundlerDevServer } = require(`${cliPath}/start/server/BundlerDevServer.js`);
  const { resolveOptionsAsync } = require(`${cliPath}/start/resolveOptions.js`);
  const { startAsync } = require(`${cliPath}/start/startAsync.js`);

  BundlerDevServer.prototype.openPlatformAsync = async () => undefined;

  const options = await resolveOptionsAsync(process.cwd(), {
    '--offline': true,
    '--port': process.env.EXPO_PORT || '8082',
    '--clear': true,
    '--max-workers': '1',
    '--go': true
  });

  await startAsync(process.cwd(), options, { webOnly: false });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

function loadDotEnv(cwd) {
  for (const name of ['.env', '.env.local']) {
    const filePath = path.join(cwd, name);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}
