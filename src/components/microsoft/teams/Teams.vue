<template>
  <Spinner
    class="vue-teams"
    v-if="
      !$store.state.microsoft.state ||
        $store.state.microsoft.state === MicrosoftStates.LoggingIn
    "
  />
  <Forbidden
    v-else-if="$store.state.microsoft.state === MicrosoftStates.Forbidden"
  />
  <GatewayTimeout
    v-else-if="$store.state.microsoft.state === MicrosoftStates.GatewayTimeout"
  />
  <InternalServerError
    v-else-if="
      $store.state.microsoft.state === MicrosoftStates.InternalServerError
    "
  />
  <ServiceUnavailable
    v-else-if="
      $store.state.microsoft.state === MicrosoftStates.ServiceUnavailable
    "
  />
  <Unauthorized
    v-else-if="
      $store.state.microsoft.state === MicrosoftStates.Unauthorized ||
        $store.state.microsoft.state === MicrosoftStates.LoggedOut
    "
  />
  <UnsupportedMediaType v-else-if="!teamId && !channelId" />
  <div
    v-else-if="
      $store.state.microsoft.state === MicrosoftStates.LoggedIn &&
        teamId !== undefined &&
        channelId !== undefined
    "
    ref="channel_side"
    class="vue-teams channel-side position-relative"
  >
    <Channel
      ref="channel"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      v-if="!isShowingModal"
      @loaded="handleChannelLoaded($event, $refs['channel'].$refs['channel'])"
      @members="members = $event"
      @reset="scrollToTop($refs['channel'].$refs['channel'])"
      @mentioned="$refs['message_editor'].mention($event.type, $event.mention)"
    />
    <MessageEditor
      ref="message_editor"
      class="channel fixed"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      :members="members"
      v-if="!isShowingModal"
      @replied="$refs['channel'].loadMessages()"
    />
    <b-button
      class="action d-sm-down-none position-absolute"
      variant="white"
      pill
      v-b-tooltip.hover="'放大檢視'"
      v-if="!isShowingModal"
      @click="isShowingModal = true"
    >
      <i class="fa fa-expand"></i>
    </b-button>
    <b-modal
      ref="channel_modal"
      v-model="isShowingModal"
      modal-class="channel-modal"
      size="lg"
      centered
      hide-header
      hide-footer
    >
      <Channel
        ref="channel"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        @loaded="handleChannelLoaded($event, $refs['channel_modal'])"
        @members="members = $event"
        @reset="scrollToTop($refs['channel_modal'])"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
      <MessageEditor
        ref="message_editor"
        class="channel fixed"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        :members="members"
        @replied="$refs['channel'].loadMessages()"
      />
    </b-modal>
  </div>
  <Spinner class="vue-teams" v-else />
</template>

<script>
import Forbidden from "../../errors/Forbidden";
import GatewayTimeout from "../../errors/GatewayTimeout";
import InternalServerError from "../../errors/InternalServerError";
import ServiceUnavailable from "../../errors/ServiceUnavailable";
import Unauthorized from "../../errors/Unauthorized";
import UnsupportedMediaType from "../../errors/UnsupportedMediaType";

import { MicrosoftStates } from "../../../utils/enums";
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
      MicrosoftStates: MicrosoftStates,
      members: [],
      isShowingModal: false
    };
  },
  // computed: {
  //   config() {
  //     return JSON.stringify({
  //       tenantId: this.tenantId,
  //       clientId: this.clientId,
  //       redirectUri: this.redirectUri,
  //       teamId: this.teamId,
  //       channelId: this.channelId
  //     });
  //   }
  // },
  methods: {
    async loginToMicrosoft() {
      if (this.$store.state.microsoft.state !== MicrosoftStates.LoggedIn)
        await this.$store.dispatch("microsoft/SIGNIN_GRAPH_REQUEST", {});
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
    handleChannelLoaded(event, element) {
      this.scrollToBottom(element);
    }
  },
  mounted() {
    this.loginToMicrosoft();
  },
  // watch: {
  //   config: function() {
  //     this.loginToMicrosoft();
  //   }
  // }
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

    > .action.btn {
      bottom: 8px;
      left: 8px;
      z-index: 1030;
      width: calc(14px + 0.9rem + 2px);
      padding: 0.45rem;
      font-size: 14px;
      line-height: 14px !important;
      box-shadow: map-get($shadow, "component_hovered");

      > i {
        line-height: 14px !important;
      }
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
