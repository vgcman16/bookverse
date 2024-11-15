const webpack = require("@nativescript/webpack");
const { resolve } = require("path");

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig("typescript");

  webpack.chainWebpack((config) => {
    // Add any custom webpack configurations here
    config.resolve.alias.set("@", resolve(__dirname, "src"));
  });

  return webpack.resolveConfig();
};
