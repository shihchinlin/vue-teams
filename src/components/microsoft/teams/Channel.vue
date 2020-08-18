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
import { mapGetters, mapMutations } from "vuex";

import { MicrosoftStatus, PresenceAvailabilities } from "../../../utils/enums";
import {
  getTeam,
  getChannel,
  refreshPresences,
  listChannelMessages
} from "../../../api/microsoft";
import Message from "./Message";
import Spinner from "../../Spinner";

export default {
  name: "Channel",
  components: {
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
      messages: []
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
        return listChannelMessages(this.teamId, this.channelId).then(
          messages => {
            for (let message of messages) {
              if (
                message.from &&
                !Object.keys(this.presences).includes(message.from.user.id)
              )
                this.presences[message.from.user.id] =
                  PresenceAvailabilities.PresenceUnknown;
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
      if (!Object.keys(this.presences).includes(event.from.user.id))
        this.presences[event.from.user.id] =
          PresenceAvailabilities.PresenceUnknown;
      refreshPresences();

      this.messages.push(event);
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
    }
  }
};
</script>

<style lang="scss">
@import "./Channel";
</style>
