<template>
  <VuePerfectScrollbar
    ref="channel"
    class="vue-teams-channel p-2 mask-wrapper"
    :settings="settingsPerfectScrollbar"
    @mouseover="handleMouseOver"
  >
    <div class="mask" v-if="isChannelLoading" />
    <div class="hr-desc" v-if="!isChannelLoading">
      <Intersect @enter="loadMoreMessages()">
        <span>
          <a
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
      :members="members"
      :message="message"
      :customized-url-prefix="customizedUrlPrefix"
      v-for="message in messages"
      :key="message.id"
      @loaded="emitChannelLoadedDelayed('loaded')"
      @mentioned="$emit('mentioned', $event)"
      @replied="$emit('replied', $event)"
      @refresh="getMessageThrottled(message)"
    />
  </VuePerfectScrollbar>
</template>

<script>
import _ from "lodash";
import Vue from "vue";
import { mapGetters, mapMutations, mapActions } from "vuex";
import VuePerfectScrollbar from "vue-perfect-scrollbar";
import Intersect from "vue-intersect";

import { MicrosoftStates, PresenceAvailabilities } from "../../../utils/enums";
import {
  getTeam,
  getChannel,
  listChannelMembers,
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
    channelId: { type: String, required: true },
    customizedUrlPrefix: {
      type: String,
      default: window.location.origin + process.env.BASE_URL.slice(0, -1)
    }
  },
  data: function() {
    return {
      team: {},
      channel: {},
      members: [],
      messages: [],
      messageIterator: null,
      isChannelLoaded: false,
      isChannelLoading: false,
      timerChannelLoadedEvent: null,
      batchSize: 10,
      settingsPerfectScrollbar: {
        maxScrollbarLength: 200,
        minScrollbarLength: 40,
        suppressScrollX: true,
        suppressScrollY: false
      }
    };
  },
  computed: {
    ...mapGetters("microsoft", ["state", "presences"]),
    teamId_channelId() {
      return this.teamId + this.channelId;
    }
  },
  methods: {
    ...mapMutations({
      changeGraphState: "microsoft/CHANGE_GRAPH_STATE"
    }),
    ...mapActions({
      _refreshPresences: "microsoft/REFRESH_PRESENCES"
    }),
    loadChannel() {
      if (this.state === MicrosoftStates.LoggedIn) {
        this.isChannelLoaded = false;
        this.isChannelLoading = true;
        this.messageIterator = null;
        this.messages = [];
        this.$emit("reset");
        getTeam(this.teamId)
          .then(team => {
            this.team = team;
            getChannel(this.teamId, this.channelId).then(channel => {
              this.channel = channel;
              listChannelMembers(this.teamId, this.channelId).then(members => {
                this.members = members;
                this.$emit("members", this.members);
                return this.loadMessages();
              });
            });
          })
          .catch(error => {
            if (error.stateCode === 403)
              this.changeGraphState(MicrosoftStates.LoggingIn);
            else if (error.stateCode === 500)
              this.changeGraphState(MicrosoftStates.InternalServerError);
            else if (error.stateCode === 503)
              this.changeGraphState(MicrosoftStates.ServiceUnavailable);
            else if (error.stateCode === 504)
              this.changeGraphState(MicrosoftStates.GatewayTimeout);
            else this.changeGraphState(MicrosoftStates.ServiceUnavailable);
          });
      }
    },
    loadMessages() {
      if (this.state === MicrosoftStates.LoggedIn) {
        let count = 0;
        let callback = incomingMessage => {
          if (incomingMessage.from)
            this.refreshPresences(incomingMessage.from.user.id);

          let lookup = this.messages.findIndex(
            message => message.id === incomingMessage.id
          );
          if (lookup >= 0) this.$set(this.messages, lookup, incomingMessage);
          else if (!this.isChannelLoaded || this.isChannelLoading)
            this.messages.unshift(incomingMessage);
          else this.messages.push(incomingMessage);
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
          this.$nextTick(() => {
            this.emitChannelLoadedDelayed("loaded");
            this.$nextTick(() => {
              this.isChannelLoading = false;
            });
          });
        });
      } else return Promise.reject();
    },
    loadMoreMessages() {
      if (
        this.messageIterator &&
        !this.messageIterator.isComplete() &&
        this.isChannelLoaded
      ) {
        this.isChannelLoading = true;
        let messageElements = this.$refs["channel"].$el.getElementsByClassName(
          "message"
        );
        let lastSeenMessage =
          messageElements.length > 0 ? messageElements[0] : undefined;
        this.messageIterator.resume().then(() => {
          this.$nextTick(() => {
            if (lastSeenMessage) lastSeenMessage.scrollIntoView();
          });
          this.isChannelLoading = false;
        });
      }
    },
    refreshMessages() {
      if (this.state === MicrosoftStates.LoggedIn) {
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
    getMessage(message) {
      if (this.state === MicrosoftStates.LoggedIn) {
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
      this._refreshPresences();
    }, 2000),
    handleMouseOver(event) {
      this.refreshMessagesThrottled();
    },
    emitChannelLoadedDelayed() {
      if (!this.isChannelLoaded) {
        if (this.timerChannelLoadedEvent)
          clearTimeout(this.timerChannelLoadedEvent);
        this.timerChannelLoadedEvent = setTimeout(() => {
          this.$emit("loaded");
          this.isChannelLoaded = true;
          this.timerChannelLoadedEvent = null;
        }, 1000);
      }
    }
  },
  mounted() {
    if (this.teamId_channelId) this.loadChannel();
  },
  watch: {
    teamId_channelId() {
      this.loadChannel();
    },
    isChannelLoading: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          this.$refs[
            "channel"
          ].ps.settings.suppressScrollY = this.isChannelLoading;
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
