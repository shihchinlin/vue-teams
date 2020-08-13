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
        is_discussable
    "
    class="discuss position-relative"
  >
    <VuePerfectScrollbar
      ref="channel_wrapper"
      class="channel-wrapper"
      v-if="!showing_modal"
    >
      <Channel
        ref="channel"
        :tenant_id="$store.state.session.config.MICROSOFT_GRAPH.TENANT_ID"
        :team_id="team_id"
        :channel_id="channel_id"
        @loaded="scrollToBottom($refs['channel_wrapper'])"
        @reset="scrollToTop($refs['channel_wrapper'])"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
    </VuePerfectScrollbar>
    <MessageEditor
      ref="message_editor"
      :team_id="team_id"
      :channel_id="channel_id"
      :default_opened="true"
      class="channel fixed"
      v-if="!showing_modal"
      @replied="
        $refs['channel'].loadMessages().then(() => {
          scrollToBottom($refs['channel_wrapper']);
        })
      "
    />
    <b-modal
      ref="discuss_modal"
      v-model="showing_modal"
      modal-class="discuss-modal"
      size="lg"
      centered
      hide-header
      hide-footer
    >
      <Channel
        ref="channel"
        :tenant_id="$store.state.session.config.MICROSOFT_GRAPH.TENANT_ID"
        :team_id="team_id"
        :channel_id="channel_id"
        @loaded="
          (showing_message_editor_in_modal = true) &&
            scrollToBottom($refs['discuss_modal'])
        "
        @reset="scrollToTop($refs['discuss_modal'])"
        @mentioned="
          $refs['message_editor'].mention($event.type, $event.mention)
        "
      />
      <MessageEditor
        ref="message_editor"
        :team_id="team_id"
        :channel_id="channel_id"
        :default_opened="true"
        class="channel fixed"
        v-if="showing_message_editor_in_modal"
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
      v-if="!showing_modal"
      @click="showing_modal = true"
    >
      <i class="fa fa-expand"></i>
    </b-button>
  </div>
  <UndiscussableMediaType v-else-if="!is_discussable" />
</template>

<script>
import { MicrosoftGraphStatus } from "@/utils/enums";
import VuePerfectScrollbar from "vue-perfect-scrollbar";
import Forbidden from "@/components/errors/Forbidden";
import GatewayTimeout from "@/components/errors/GatewayTimeout";
import InternalServerError from "@/components/errors/InternalServerError";
import ServiceUnavailable from "@/components/errors/ServiceUnavailable";
import Unauthorized from "@/components/errors/Unauthorized";
import UndiscussableMediaType from "@/components/errors/UndiscussableMediaType";
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
    UndiscussableMediaType,
    Channel,
    MessageEditor,
    Spinner,
  },
  data: () => {
    return {
      MicrosoftGraphStatus: MicrosoftGraphStatus,
      showing_modal: false,
      showing_message_editor_in_modal: false,
      is_discussable: true,
      team_id: "",
      channel_id: "",
    };
  },
  methods: {
    async loadDiscuss() {
      if (this.$store.state.microsoft.status !== MicrosoftGraphStatus.LoggedIn)
        await this.$store.dispatch("microsoft/SIGNIN_GRAPH_REQUEST");
      try {
        const response = {
          teamId: this.$store.state.session.config.MICROSOFT_GRAPH._TEAM_ID,
          channelId: this.$store.state.session.config.MICROSOFT_GRAPH,
        };

        if (response.teamId && response.channelId) {
          this.team_id = response.teamId;
          this.channel_id = response.channelId;
          this.is_discussable = true;
        } else {
          this.is_discussable = false;
        }
      } catch (e) {
        this.team_id = "";
        this.channel_id = "";
      }
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
    this.loadDiscuss();
  },
  watch: {
    "$route.path": function() {
      this.loadDiscuss();
    },
  },
};
</script>

<style lang="scss">
.aside-menu-fixed {
  .aside-menu {
    .discuss {
      .channel-wrapper {
        height: calc(100vh - 1px - 150px);
      }

      > .action {
        bottom: 8px;
        left: 8px;
        z-index: 1030;
        box-shadow: map-get($shadow, "component_hovered");
      }
    }

    .tab-pane > .error .icon {
      float: none !important;
      margin-right: auto !important;

      + div .h3 {
        text-align: center !important;
      }
    }
  }
}

.aside-menu-fixed .app.presentation {
  .aside-menu {
    .discuss .channel-wrapper {
      height: calc(100vh - 1px - 150px);
    }
  }
}

// @include media-breakpoint-down("sm") {
//   .aside-menu-fixed {
//     .aside-menu {
//       .discuss .channel-wrapper {
//         height: calc(100vh - 1px - 150px);
//       }
//     }
//   }
// }
</style>
