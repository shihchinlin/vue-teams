import camelCase from "lodash/camelCase";

const modulesFiles = require.context("./", true, /\.js$/);
const modules = {};

modulesFiles.keys().forEach(fileName => {
  if (fileName === "./index.js") return;
  const [moduleName, partName] = fileName
    .replace(/(\.\/|\.js)/g, "")
    .split("/");
  if (!modules[moduleName]) {
    modules[moduleName] = {
      namespaced: true
    };
  }
  modules[moduleName][partName] = modulesFiles(fileName).default;
});

export default modules;
