process.env.EXPO_NO_TELEMETRY = '1';
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
    '--port': process.env.EXPO_PORT || '8081',
    '--web': true,
    '--clear': true,
    '--max-workers': '1'
  });

  await startAsync(process.cwd(), options, { webOnly: true });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
