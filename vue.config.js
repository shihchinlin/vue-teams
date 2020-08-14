module.exports = {
  lintOnSave: false,
  runtimeCompiler: true,
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "VueTeams",
    },
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "~@/assets/scss/prepend.scss";`,
      },
    },
  },
};
