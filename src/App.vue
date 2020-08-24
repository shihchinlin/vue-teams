<template>
  <div id="app" class="app">
    <Teams
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      v-if="tenantId && clientId && redirectUri && teamId && channelId"
    />
    <VuePerfectScrollbar class="config">
      <b-row>
        <b-col
          class="d-flex flex-column justify-content-center align-items-center p-3"
        >
          <img class="d-block mb-3" src="@/assets/img/logo.png" />
          <div>a Vue.js component for Microsoft Teams</div>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          class="d-flex flex-column justify-content-center align-items-center"
        >
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
            <b-form-input
              v-model="channelId"
              placeholder="Enter your channelId"
            >
            </b-form-input>
          </div>
        </b-col>
        <b-col>
          <Card name="MentionCard">
            <h6>
              This is an example card for Teams #mentions. You can trigger the
              feature by typing or clicking # in any editor. Then you might
              select a card from the list or drag the card to the editor to
              complete the mention.
            </h6>
            <h6>
              The #mention will be regarded as a hyperlink in Teams, which
              linked back to the same website and anchor of the same card name
              (i.e.
              <a
                href="https://shihchinlin.github.io/vue-teams/#MentionCard"
                target="_blank"
                >link</a
              >). You can copy and extend src/components/Card.vue in your own
              project.
            </h6>
          </Card>
        </b-col>
      </b-row>
      <h6>Username: <strong>vue-teams@shihchinlin.onmicrosoft.com</strong></h6>
      <h6>Password: <strong>NTT5ySrZaMKvfFgh</strong></h6>
      <h6>
        Above default parameters represent a pre-created channel in Microsoft
        Teams resided in a trial Azure Active Directory Tenant provided by
        Microsoft 365 Developer Program.
      </h6>
      <h6>
        Due to the limited trial time, you may not be able to load the channel
        at the time.
        <a href="https://github.com/shihchinlin/vue-teams/issues">
          Send an issue
        </a>
        to acknowledge me to renewal the developer subscription.
      </h6>
    </VuePerfectScrollbar>
  </div>
</template>

<script>
import VuePerfectScrollbar from "vue-perfect-scrollbar";

import Teams from "@/components/microsoft/teams/Teams.vue";
import Card from "@/components/Card.vue";

export default {
  name: "App",
  components: {
    VuePerfectScrollbar,
    Teams,
    Card
  },
  data() {
    return {
      process: process,
      tenantId: "4c1aa070-de27-4274-8885-cf5ab1606285",
      clientId: "e809aed6-6e8b-4398-ac0f-3ab2b196a9c6",
      redirectUri: location.origin + process.env.BASE_URL,
      teamId: "0b5efd71-a75a-4963-8ee2-578a286e089c",
      channelId: "19:06e30d5c6be44f4eb7edfe1fad0ab24c@thread.tacv2"
    };
  }
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

  > .config {
    width: calc(100% - 253px);
    height: 100%;
    padding: 3rem;
    margin-right: 3px;

    .input-group {
      margin-bottom: 1.5rem;
      margin-right: auto;
      margin-left: auto;

      > .input-group-prepend > .input-group-text {
        width: 100px;
        text-align: right;
      }
    }

    .input-group:last-child {
      margin-bottom: 0;
    }

    > h6 {
      margin-top: 1.5rem;
      margin-right: auto;
      margin-left: auto;
    }
  }
}
</style>
