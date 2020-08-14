<template>
  <Spinner
    v-if="$store.state.microsoft.status === MicrosoftGraphStatus.LoggingIn"
  />
  <Forbidden
    v-else-if="$store.state.microsoft.status === MicrosoftGraphStatus.Forbidden"
  />
  <GatewayTimeout
    v-else-if="
      $store.state.microsoft.status === MicrosoftGraphStatus.GatewayTimeout
    "
  />
  <InternalServerError
    v-else-if="
      $store.state.microsoft.status === MicrosoftGraphStatus.InternalServerError
    "
  />
  <ServiceUnavailable
    v-else-if="
      $store.state.microsoft.status === MicrosoftGraphStatus.ServiceUnavailable
    "
  />
  <Unauthorized
    v-else-if="
      $store.state.microsoft.status === MicrosoftGraphStatus.Unauthorized
    "
  />
  <div
    v-else-if="
      $store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn &&
        isLoaded
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
import { MicrosoftGraphStatus } from "@/utils/enums";
import VuePerfectScrollbar from "vue-perfect-scrollbar";
import Forbidden from "@/components/errors/Forbidden";
import GatewayTimeout from "@/components/errors/GatewayTimeout";
import InternalServerError from "@/components/errors/InternalServerError";
import ServiceUnavailable from "@/components/errors/ServiceUnavailable";
import Unauthorized from "@/components/errors/Unauthorized";
import UnsupportedMediaType from "@/components/errors/UnsupportedMediaType";
import Channel from "@/components/microsoft/teams/Channel";
import MessageEditor from "@/components/microsoft/teams/MessageEditor";
import Spinner from "@/components/Spinner";

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
    Spinner,
  },
  props: {
    tenantId: { type: String, required: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
  },
  data: () => {
    return {
      MicrosoftGraphStatus: MicrosoftGraphStatus,
      showingModal: false,
      showingMessageEditorInModal: false,
      isLoaded: true,
    };
  },
  computed: {
    config() {
      return JSON.stringify({
        tenantId: this.tenantId,
        clientId: this.clientId,
        redirectUri: this.redirectUri,
        teamId: this.teamId,
        channelId: this.channelId,
      });
    },
  },
  methods: {
    async loadChannel() {
      this.isLoaded = false;
      if (this.$store.state.microsoft.status !== MicrosoftGraphStatus.LoggedIn)
        await this.$store.dispatch("microsoft/SIGNIN_GRAPH_REQUEST", {
          tenantId: this.tenantId,
          clientId: this.clientId,
          redirectUri: this.redirectUri,
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
    },
  },
  mounted() {
    this.loadChannel();
  },
  watch: {
    config: function() {
      this.loadChannel();
    },
  },
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
