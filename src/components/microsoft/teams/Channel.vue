<template>
  <VuePerfectScrollbar
    ref="channel"
    class="vue-teams-channel p-2 mask-wrapper"
    @mouseover="handleMouseOver"
  >
    <div class="mask" v-if="!isChannelLoaded" />
    <div class="hr-desc" v-if="isChannelLoaded">
      <Intersect @enter="loadMoreMessages()">
        <span>
          <a
            id="channel_info"
            :href="
              'https://teams.microsoft.com/l/channel/' +
                encodeURI(channelId) +
                '/' +
                encodeURI(encodeURI(channel.displayName)) +
                '?groupId=' +
                teamId +
                '&tenantId=' +
                tenantId
            "
            target="_blank"
            v-b-tooltip.hover="
              '您目前在「' +
                team.displayName +
                '」團隊的「' +
                channel.displayName +
                '」頻道中。'
            "
          >
            以Microsoft Teams開啟
          </a>
        </span>
      </Intersect>
    </div>
    <Spinner v-if="!isChannelLoaded" />
    <div
      class="message my-5 clearfix animated fadeIn text-center text-light"
      v-if="messages.length <= 0"
    >
      <i class="fa fa-comment-slash fa-5x"></i>
    </div>
    <Message
      ref="message"
      :teamId="teamId"
      :channelId="channelId"
      :message="message"
      v-for="message in messages"
      :key="message.id"
      @loaded="emitEventDebounced('loaded')"
      @replied="handleMessageCreated"
      @mentioned="$emit('mentioned', $event)"
      @refresh="getMessageThrottled(message)"
    />
  </VuePerfectScrollbar>
</template>

<script>
import _ from "lodash";
import Vue from "vue";
import { mapGetters, mapMutations } from "vuex";
import VuePerfectScrollbar from "vue-perfect-scrollbar";
import Intersect from "vue-intersect";

import { MicrosoftStatus, PresenceAvailabilities } from "../../../utils/enums";
import {
  getTeam,
  getChannel,
  refreshPresences,
  listChannelMessages,
  listChannelMessagesIterator,
  getMessage
} from "../../../api/microsoft";
import Message from "./Message";
import Spinner from "../../Spinner";

export default {
  name: "Channel",
  components: {
    VuePerfectScrollbar,
    Intersect,
    Message,
    Spinner
  },
  props: {
    tenantId: { type: String, required: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    teamId: { type: String, required: true },
    channelId: { type: String, required: true }
  },
  data: function() {
    return {
      team: {},
      channel: {},
      messages: [],
      messageIterator: null,
      isChannelLoaded: false,
      batchSize: 10
    };
  },
  computed: {
    ...mapGetters("microsoft", ["status", "presences"]),
    teamId_channelId() {
      return this.teamId + this.channelId;
    }
  },
  methods: {
    ...mapMutations({
      changeGraphStatus: "microsoft/CHANGE_GRAPH_STATUS"
    }),
    loadChannel() {
      if (this.status === MicrosoftStatus.LoggedIn) {
        this.isChannelLoaded = false;
        this.messageIterator = null;
        this.messages = [];
        this.$emit("reset");
        getTeam(this.teamId)
          .then(team => {
            this.team = team;
            getChannel(this.teamId, this.channelId).then(channel => {
              this.channel = channel;
              return this.loadMessages().then(() => {
                this.$nextTick(() => {
                  this.$root.$emit("bv::show::tooltip", "channel_info");
                  setTimeout(() => {
                    this.$root.$emit("bv::hide::tooltip", "channel_info");
                  }, 4000);
                });
                this.emitEventDebounced("loaded");
              });
            });
          })
          .catch(error => {
            if (error.statusCode === 403)
              this.changeGraphStatus(MicrosoftStatus.LoggingIn);
            else if (error.statusCode === 500)
              this.changeGraphStatus(MicrosoftStatus.InternalServerError);
            else if (error.statusCode === 503)
              this.changeGraphStatus(MicrosoftStatus.ServiceUnavailable);
            else if (error.statusCode === 504)
              this.changeGraphStatus(MicrosoftStatus.GatewayTimeout);
            else this.changeGraphStatus(MicrosoftStatus.ServiceUnavailable);
          });
      }
    },
    loadMessages() {
      if (this.status === MicrosoftStatus.LoggedIn) {
        let count = 0;
        let callback = incomingMessage => {
          if (incomingMessage.from)
            this.refreshPresences(incomingMessage.from.user.id);

          let lookup = this.messages.findIndex(
            message => message.id === incomingMessage.id
          );
          if (lookup >= 0) this.$set(this.messages, lookup, incomingMessage);
          else this.messages.unshift(incomingMessage);
          count++;
          if (count === this.batchSize) {
            count = 0;
            return false;
          }
          return true;
        };
        return listChannelMessagesIterator(
          this.teamId,
          this.channelId,
          callback
        ).then(res => {
          this.messageIterator = res;
          setTimeout(() => {
            this.isChannelLoaded = true;
          }, 3000);
        });
      } else return Promise.reject();
    },
    refreshMessages() {
      if (this.status === MicrosoftStatus.LoggedIn) {
        return listChannelMessages(
          this.teamId,
          this.channelId,
          this.batchSize
        ).then(messages => {
          for (let incomingMessage of messages) {
            if (incomingMessage.from)
              this.refreshPresences(incomingMessage.from.user.id);

            let lookup = this.messages.findIndex(
              message => message.id === incomingMessage.id
            );
            if (lookup >= 0) this.$set(this.messages, lookup, incomingMessage);
            else this.messages.push(incomingMessage);
          }
        });
      } else return Promise.reject();
    },
    loadMoreMessages() {
      if (
        this.messageIterator &&
        !this.messageIterator.isComplete() &&
        this.isChannelLoaded
      ) {
        let messageElements = this.$refs["channel"].$el.getElementsByClassName(
          "message"
        );
        let lastSeenMessage =
          messageElements.length > 0 ? messageElements[0] : undefined;
        this.isChannelLoaded = false;
        this.messageIterator.resume();
        setTimeout(() => {
          if (lastSeenMessage) lastSeenMessage.scrollIntoView();
          this.isChannelLoaded = true;
        }, 3000);
      }
    },
    getMessage(message) {
      if (this.status === MicrosoftStatus.LoggedIn) {
        return getMessage(this.teamId, this.channelId, message.id).then(
          incomingMessage => {
            let messageIndex = this.messages.indexOf(message);
            if (messageIndex > 0)
              this.$set(this.messages, messageIndex, incomingMessage);
          }
        );
      }
    },
    refreshPresences(id) {
      if (!Object.keys(this.presences).includes(id))
        this.presences[id] = PresenceAvailabilities.PresenceUnknown;
      this.refreshPresencesThrottled();
    },
    refreshMessagesThrottled: _.throttle(function() {
      this.refreshMessages();
    }, 5000),
    getMessageThrottled: _.throttle(function(message) {
      this.getMessage(message);
    }, 3000),
    refreshPresencesThrottled: _.throttle(function() {
      refreshPresences();
    }, 2000),
    handleMessageCreated(message) {
      this.refreshPresences(message.from.user.id);
      this.messages.push(message);
    },
    handleMouseOver(event) {
      this.refreshMessagesThrottled();
    },
    emitEventDebounced: _.debounce(function(event) {
      this.$emit(event);
    }, 500)
  },
  mounted() {
    if (this.teamId_channelId) this.loadChannel();
  },
  watch: {
    teamId_channelId() {
      this.loadChannel();
    },
    isChannelLoaded: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          this.$refs["channel"].ps.settings.suppressScrollY = !this
            .isChannelLoaded;
          this.$refs["channel"].update();
        });
      }
    }
  }
};
</script>

<style lang="scss">
@import "./Channel";
</style>
