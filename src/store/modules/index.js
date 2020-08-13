const requireModule = require.context(".", true, /\.js$/);
const modules = {};
const importedMembers = ["state", "getters", "mutations", "actions"];

requireModule.keys().forEach((filename) => {
  if (filename === "./index.js") return;
  // replace ./ and .js, filename will be look like app/index
  const path = filename.replace(/\.\/|\.js/g, "");
  const [moduleName, imported] = path.split("/");
  if (!modules[moduleName]) {
    modules[moduleName] = {
      namespaced: true,
    };
  }
  if (importedMembers.includes(imported)) {
    modules[moduleName][imported] = requireModule(filename).default;
  }
});

export default modules;
