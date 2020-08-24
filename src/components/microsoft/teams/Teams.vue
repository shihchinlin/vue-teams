<template>
  <Spinner
    class="vue-teams"
    v-if="$store.state.microsoft.status === MicrosoftStatus.LoggingIn"
  />
  <Forbidden
    v-else-if="$store.state.microsoft.status === MicrosoftStatus.Forbidden"
  />
  <GatewayTimeout
    v-else-if="$store.state.microsoft.status === MicrosoftStatus.GatewayTimeout"
  />
  <InternalServerError
    v-else-if="
      $store.state.microsoft.status === MicrosoftStatus.InternalServerError
    "
  />
  <ServiceUnavailable
    v-else-if="
      $store.state.microsoft.status === MicrosoftStatus.ServiceUnavailable
    "
  />
  <Unauthorized
    v-else-if="$store.state.microsoft.status === MicrosoftStatus.Unauthorized"
  />
  <div
    v-else-if="$store.state.microsoft.status === MicrosoftStatus.LoggedIn"
    ref="channel_side"
    class="vue-teams channel-side position-relative"
  >
    <Channel
      ref="channel"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      v-if="!showingModal"
      @loaded="handleChannelLoaded($event, $refs['channel'].$refs['channel'])"
      @reset="scrollToTop($refs['channel'].$refs['channel'])"
      @scroll-to="scrollFromBottomTo($refs['channel'].$refs['channel'], $event)"
      @mentioned="$refs['message_editor'].mention($event.type, $event.mention)"
    />
    <MessageEditor
      ref="message_editor"
      class="channel fixed"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      v-if="!showingModal"
      @replied="
        $refs['channel'].loadMessages().then(() => {
          scrollToBottom($refs['channel'].$refs['channel']);
        })
      "
    />
    <b-button
      class="action d-sm-down-none position-absolute"
      variant="white"
      size="sm"
      pill
      v-b-tooltip.hover="'放大檢視'"
      v-if="!showingModal"
      @click="showingModal = true"
    >
      <i class="fa fa-expand"></i>
    </b-button>
    <b-modal
      ref="channel_modal"
      v-model="showingModal"
      modal-class="channel-modal"
      size="lg"
      centered
      hide-header
      hide-footer
      @show="isTeamsLoaded = false"
      @hidden="isTeamsLoaded = false"
    >
      <Channel
        ref="channel"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        @loaded="handleChannelLoaded($event, $refs['channel_modal'])"
        @reset="scrollToTop($refs['channel_modal'])"
        @scroll-to="scrollFromBottomTo($refs['channel_modal'], $event)"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
      <MessageEditor
        ref="message_editor"
        class="channel fixed"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        @replied="
          $refs['channel'].loadMessages().then(() => {
            scrollToBottom($refs['channel_modal']);
          })
        "
      />
    </b-modal>
  </div>
  <UnsupportedMediaType v-else-if="!isTeamsLoaded" />
</template>

<script>
import modules from "../../../store/modules";

import Forbidden from "../../errors/Forbidden";
import GatewayTimeout from "../../errors/GatewayTimeout";
import InternalServerError from "../../errors/InternalServerError";
import ServiceUnavailable from "../../errors/ServiceUnavailable";
import Unauthorized from "../../errors/Unauthorized";
import UnsupportedMediaType from "../../errors/UnsupportedMediaType";

import { MicrosoftStatus } from "../../../utils/enums";
import Channel from "./Channel";
import MessageEditor from "./MessageEditor";
import Spinner from "../../Spinner";

export default {
  components: {
    Forbidden,
    GatewayTimeout,
    InternalServerError,
    ServiceUnavailable,
    Unauthorized,
    UnsupportedMediaType,
    Channel,
    MessageEditor,
    Spinner
  },
  props: {
    tenantId: { type: String, required: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    teamId: { type: String, required: true },
    channelId: { type: String, required: true }
  },
  data: () => {
    return {
      MicrosoftStatus: MicrosoftStatus,
      showingModal: false,
      showingMessageEditorInModal: false,
      isTeamsLoaded: true
    };
  },
  computed: {
    config() {
      return JSON.stringify({
        tenantId: this.tenantId,
        clientId: this.clientId,
        redirectUri: this.redirectUri,
        teamId: this.teamId,
        channelId: this.channelId
      });
    }
  },
  methods: {
    async loadChannel() {
      this.isTeamsLoaded = false;
      if (this.$store.state.microsoft.status !== MicrosoftStatus.LoggedIn)
        await this.$store.dispatch("microsoft/SIGNIN_GRAPH_REQUEST", {
          tenantId: this.tenantId,
          clientId: this.clientId,
          redirectUri: this.redirectUri
        });
    },
    scrollToTop(element) {
      this.$nextTick(() => {
        if (
          element.$el &&
          element.$el.classList &&
          element.$el.classList.contains("ps")
        ) {
          element.update();
          element.$el.scrollTop = 0;
        } else if (element.modalId) {
          element.$refs["modal"].scrollTop = 0;
        }
      });
    },
    scrollToBottom(element) {
      this.$nextTick(() => {
        if (
          element.$el &&
          element.$el.classList &&
          element.$el.classList.contains("ps")
        ) {
          element.update();
          element.$el.scrollTop = element.$el.scrollHeight;
        } else if (element.modalId) {
          element.$refs["modal"].scrollTop =
            element.$refs["modal"].scrollHeight;
        }
      });
    },
    scrollFromBottomTo(element, scrollBottom) {
      if (
        element.$el &&
        element.$el.classList &&
        element.$el.classList.contains("ps")
      ) {
        element.update();
        element.$el.scrollTop = element.$el.scrollHeight - scrollBottom;
      } else if (element.modalId) {
        element.$refs["modal"].scrollTop =
          element.$refs["modal"].scrollHeight - scrollBottom;
      }
    },
    handleChannelLoaded(event, element) {
      if (!this.isTeamsLoaded) this.scrollToBottom(element);
      setTimeout(() => {
        this.isTeamsLoaded = true;
      }, 5000);
    }
  },
  created() {
    if (!this.$store.hasModule("microsoft"))
      this.$store.registerModule("microsoft", modules.microsoft);
    if (!this.$store.hasModule("card"))
      this.$store.registerModule("card", modules.card);
  },
  mounted() {
    this.loadChannel();
  },
  watch: {
    config: function() {
      this.loadChannel();
    }
  }
};
</script>

<style lang="scss">
.vue-teams {
  width: 250px;
  height: 100%;
  float: right;
  box-shadow: -2px 0px 2px 1px rgba(0, 0, 0, 0.2);

  &.channel-side {
    > .vue-teams-channel {
      height: calc(100% - 1px - 150px) !important;
    }

    > .action {
      bottom: 8px;
      left: 8px;
      z-index: 1030;
      box-shadow: map-get($shadow, "component_hovered");
    }
  }

  &.error .icon {
    float: none !important;
    margin-right: auto !important;

    + div .h3 {
      text-align: center !important;
    }
  }
}
</style>
