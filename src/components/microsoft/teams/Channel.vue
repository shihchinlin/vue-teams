<template>
  <Spinner v-if="messages.length <= 0" />
  <div
    ref="channel"
    class="channel p-2"
    v-else
    @mouseover="loadMessagesThrottled()"
  >
    <div class="hr-desc">
      <span
        ><a
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
    </div>
    <Message
      class="mt-3"
      :teamId="teamId"
      :channelId="channelId"
      :message="message"
      v-for="message in messages"
      :key="message.id"
      @loaded="emitEventDebounced('loaded')"
      @replied="handleMessageCreated"
      @mentioned="$emit('mentioned', $event)"
    />
  </div>
</template>

<script>
import _ from "lodash";
import Vue from "vue";
import { MicrosoftGraphStatus, UserPresences } from "@/utils/enums";
import {
  getTeam,
  getChannel,
  refreshPresences,
  listChannelMessages,
} from "@/api/microsoft";
import Message from "@/components/microsoft/teams/Message";
import Spinner from "@/components/Spinner";

export default {
  name: "Channel",
  components: {
    Message,
    Spinner,
  },
  props: {
    tenantId: { type: String, required: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
  },
  data: function() {
    return {
      team: {},
      channel: {},
      messages: [],
    };
  },
  computed: {
    teamId_channelId() {
      return this.teamId + this.channelId;
    },
  },
  methods: {
    loadChannel() {
      if (
        this.$store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn
      ) {
        this.messages = [];
        this.$emit("reset");
        getTeam(this.teamId)
          .then((team) => {
            this.team = team;
            getChannel(this.teamId, this.channelId).then((channel) => {
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
          .catch((error) => {
            if (error.statusCode === 403)
              this.$store.state.microsoft.status =
                MicrosoftGraphStatus.Forbidden;
            else if (error.statusCode === 500)
              this.$store.state.microsoft.status =
                MicrosoftGraphStatus.InternalServerError;
            else if (error.statusCode === 503)
              this.$store.state.microsoft.status =
                MicrosoftGraphStatus.ServiceUnavailable;
            else if (error.statusCode === 504)
              this.$store.state.microsoft.status =
                MicrosoftGraphStatus.GatewayTimeout;
            else
              this.$store.state.microsoft.status =
                MicrosoftGraphStatus.ServiceUnavailable;
          });
      }
    },
    loadMessages() {
      if (
        this.$store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn
      ) {
        return listChannelMessages(this.teamId, this.channelId).then(
          (messages) => {
            for (let message of messages) {
              if (
                message.from &&
                !Object.keys(this.$store.state.microsoft.presences).includes(
                  message.from.user.id
                )
              )
                this.$store.state.microsoft.presences[message.from.user.id] =
                  UserPresences.PresenceUnknown;
            }
            refreshPresences();
            this.messages = messages.reverse();
            /*this.messages = messages.sort((a, b) => {
              return (
                Date.parse(a.createdDateTime) - Date.parse(b.createdDateTime)
              );
            });*/
          }
        );
      } else return Promise.reject();
    },
    loadMessagesThrottled: _.throttle(function() {
      this.loadMessages();
    }, 5000),
    handleMessageCreated(event) {
      if (
        !Object.keys(this.$store.state.microsoft.presences).includes(
          event.from.user.id
        )
      )
        this.$store.state.microsoft.presences[event.from.user.id] =
          UserPresences.PresenceUnknown;
      refreshPresences();

      this.messages.push(event);
    },
    emitEventDebounced: _.debounce(function(event) {
      this.$emit(event);
    }, 500),
  },
  mounted() {
    if (this.teamId_channelId) this.loadChannel();
  },
  watch: {
    teamId_channelId() {
      this.loadChannel();
    },
  },
};
</script>

<style lang="scss">
@import "./Channel";
</style>
