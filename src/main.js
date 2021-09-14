import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import App from "./App.vue";
import store from "./store";
import { registerMicrosoftModule, registerCardModule } from "./utils/utils";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

registerMicrosoftModule(store);
registerCardModule(store);

new Vue({
  render: h => h(App),
  store
}).$mount("#app");
