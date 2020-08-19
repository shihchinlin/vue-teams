<template>
  <Spinner v-if="$store.state.microsoft.status === MicrosoftStatus.LoggingIn" />
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
    v-else-if="
      $store.state.microsoft.status === MicrosoftStatus.LoggedIn && isLoaded
    "
    class="discuss position-relative"
  >
    <VuePerfectScrollbar
      ref="channel_wrapper"
      class="channel-wrapper"
      v-if="!showingModal"
    >
      <Channel
        ref="channel"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        @loaded="scrollToBottom($refs['channel_wrapper'])"
        @reset="scrollToTop($refs['channel_wrapper'])"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
    </VuePerfectScrollbar>
    <MessageEditor
      ref="message_editor"
      v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
      :default_opened="true"
      class="channel fixed"
      v-if="!showingModal"
      @replied="
        $refs['channel'].loadMessages().then(() => {
          scrollToBottom($refs['channel_wrapper']);
        })
      "
    />
    <b-modal
      ref="discuss_modal"
      v-model="showingModal"
      modal-class="discuss-modal"
      size="lg"
      centered
      hide-header
      hide-footer
    >
      <Channel
        ref="channel"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        @loaded="
          (showingMessageEditorInModal = true) &&
            scrollToBottom($refs['discuss_modal'])
        "
        @reset="scrollToTop($refs['discuss_modal'])"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
      <MessageEditor
        ref="message_editor"
        v-bind="{ tenantId, clientId, redirectUri, teamId, channelId }"
        :default_opened="true"
        class="channel fixed"
        v-if="showingMessageEditorInModal"
        @replied="
          $refs['channel'].loadMessages().then(() => {
            scrollToBottom($refs['discuss_modal']);
          })
        "
      />
    </b-modal>
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
  </div>
  <UnsupportedMediaType v-else-if="!isLoaded" />
</template>

<script>
import VuePerfectScrollbar from "vue-perfect-scrollbar";
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
    VuePerfectScrollbar,
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
      isLoaded: true
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
      this.isLoaded = false;
      if (this.$store.state.microsoft.status !== MicrosoftStatus.LoggedIn)
        await this.$store.dispatch("microsoft/SIGNIN_GRAPH_REQUEST", {
          tenantId: this.tenantId,
          clientId: this.clientId,
          redirectUri: this.redirectUri
        });
      this.isLoaded = true;
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
.teams {
  .channel-wrapper {
    height: calc(100% - 1px - 150px);
  }

  > .action {
    bottom: 8px;
    left: 8px;
    z-index: 1030;
    box-shadow: map-get($shadow, "component_hovered");
  }
}

.error .icon {
  float: none !important;
  margin-right: auto !important;

  + div .h3 {
    text-align: center !important;
  }
}
</style>
