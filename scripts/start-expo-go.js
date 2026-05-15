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
