module.exports = {
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: "/v2/",
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "~@/assets/scss/prepend.scss";`,
      },
    },
  },
};
