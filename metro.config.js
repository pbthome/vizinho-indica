const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /.*[\\/]_tmp[\\/].*/,
  /.*[\\/]_render_qa[\\/].*/,
  /.*[\\/]_lo[\\/].*/
];

module.exports = config;
