process.env.VUE_APP_VERSION = require("./package.json").version;
module.exports = {
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: process.env.NODE_ENV === "production" ? "/vue-teams/" : "/",
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "VueTeams"
    }
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "~@/assets/scss/prepend.scss";`
      }
    }
  },
  transpileDependencies: ["@microsoft/microsoft-graph-client"]
};
