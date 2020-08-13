<template>
  <div id="app">
    <Teams />
  </div>
</template>

<script>
import Teams from "@/components/microsoft/teams/Teams.vue";

export default {
  name: "App",
  components: {
    Teams,
  },
};
</script>

<style lang="scss">
$fa-font-path: "~@fortawesome/fontawesome-free/webfonts";
@import "~@fortawesome/fontawesome-free/scss/fontawesome.scss";
@import "~@fortawesome/fontawesome-free/scss/brands.scss";
@import "~@fortawesome/fontawesome-free/scss/regular.scss";
@import "~@fortawesome/fontawesome-free/scss/solid.scss";
@import "assets/scss/style";
</style>
