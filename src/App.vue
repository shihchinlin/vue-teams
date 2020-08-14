<template>
  <div id="app" class="app">
    <Teams
      class="teams"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      v-if="tenantId && clientId && redirectUri && teamId && channelId"
    />
    <form class="config">
      <img src="/img/logo.png" />
      <div role="group" class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">tenantId</div>
        </div>
        <b-form-input v-model="tenantId" placeholder="Enter your tenantId">
        </b-form-input>
      </div>
      <div role="group" class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">clientId</div>
        </div>
        <b-form-input v-model="clientId" placeholder="Enter your clientId">
        </b-form-input>
      </div>
      <div role="group" class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">redirectUri</div>
        </div>
        <b-form-input
          v-model="redirectUri"
          placeholder="Enter your redirectUri"
        >
        </b-form-input>
      </div>
      <div role="group" class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">teamId</div>
        </div>
        <b-form-input v-model="teamId" placeholder="Enter your teamId">
        </b-form-input>
      </div>
      <div role="group" class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">channelId</div>
        </div>
        <b-form-input v-model="channelId" placeholder="Enter your channelId">
        </b-form-input>
      </div>
    </form>
  </div>
</template>

<script>
import Teams from "@/components/microsoft/teams/Teams.vue";

export default {
  name: "App",
  components: {
    Teams,
  },
  data() {
    return {
      tenantId: "",
      clientId: "",
      redirectUri: location.origin + process.env.BASE_URL.slice(0, -1),
      teamId: "",
      channelId: "",
    };
  },
  mounted() {
    console.log();
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

.app {
  width: 98vw;
  max-width: 960px;
  height: 100vh;
  margin-right: auto;
  margin-left: auto;
  background-color: #fff;

  > .teams {
    width: 250px;
    height: 100%;
    float: right;
    box-shadow: -2px 0px 2px 1px rgba(0, 0, 0, 0.2);
  }

  > form {
    width: calc(100% - 250px);
    padding: 0.5rem;

    > img {
      display: block;
      margin-top: 3rem;
      margin-bottom: 3rem;
      margin-right: auto;
      margin-left: auto;
    }

    > .input-group {
      width: 75%;
      margin-top: 1.5rem;
      margin-right: auto;
      margin-left: auto;

      > .input-group-prepend > .input-group-text {
        width: 100px;
        text-align: right;
      }
    }
  }
}
</style>
