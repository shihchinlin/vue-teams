<template>
  <div
    :class="[
      'message',
      'clearfix',
      'animated',
      'fadeIn',
      'rounded',
      is_message_hovered ? 'hovered' : '',
    ]"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
  >
    <div
      :class="[
        'bg-light',
        'rounded-top',
        is_replying || (is_in_channel && is_message_hovered)
          ? ''
          : 'rounded-bottom',
        'p-1',
        'border-left',
        message.from.user.id === $store.state.microsoft.me.id
          ? 'border-' + color_variant
          : '',
      ]"
      v-if="!is_deleted"
    >
      <div class="d-flex align-items-center mb-2 position-relative">
        <b-avatar
          class="d-flex mr-2"
          :variant="color_variant"
          button
          badge
          :badge-variant="
            $store.state.microsoft.presences[message.from.user.id]
              ? $store.state.microsoft.presences[message.from.user.id]
                  .color_variant
              : 'secondary'
          "
          :text="formatNameInitials(message.from.user.displayName)"
          @click="
            mention('member', {
              value: message.from.user.displayName,
              mentioned_user_id: message.from.user.id,
            })
          "
        ></b-avatar>
        <div class="d-flex flex-column align-items-start">
          <div
            class="cursor-pointer"
            @click="
              mention('member', {
                value: message.from.user.displayName,
                mentioned_user_id: message.from.user.id,
              })
            "
          >
            {{ message.from.user.displayName }}
          </div>
          <small class="d-block text-muted">
            {{ formatDateTimeFromNow(message.createdDateTime) }}
          </small>
        </div>
        <b-button-group
          size="sm"
          class="actions position-absolute"
          v-if="is_message_hovered"
        >
          <b-button
            class="text-dark"
            variant="transparent"
            pill
            v-if="
              message.from.user.id === $store.state.microsoft.me.id &&
                !is_delete_confirmed &&
                !is_editing
            "
            @click="is_editing = true"
          >
            <i class="fa fa-edit" />
          </b-button>
          <b-button
            :class="is_delete_confirmed ? 'text-danger' : 'text-dark'"
            variant="transparent"
            pill
            v-if="message.from.user.id === $store.state.microsoft.me.id"
            @click="deleteMessage()"
            @blur="is_delete_confirmed = false"
          >
            <i
              :class="[
                'fa',
                is_delete_confirmed ? 'fa-question-circle' : 'fa-trash-alt',
              ]"
            />
            {{ is_delete_confirmed ? "確認刪除" : "" }}
          </b-button>
        </b-button-group>
      </div>
      <div>
        <div
          ref="content"
          class="content overflow-hidden"
          v-html="message_body_content"
          v-if="!is_editing"
        ></div>
        <MessageEditor
          class="content border-0"
          :teamId="teamId"
          :channelId="channelId"
          :message_id="message.id"
          :message="message"
          v-else
          @reset="handleEditorReset"
        />
        <!-- <pre>{{ message }}</pre> -->
        <div class="replies" v-if="is_in_channel">
          <Message
            class="reply my-2"
            :teamId="teamId"
            :channelId="channelId"
            :message="reply"
            v-for="reply in replies"
            :key="reply.id"
            @loaded="$emit('loaded')"
            @mentioned="mention($event.type, $event.mention)"
            @refresh-replies="loadRepliesThrottled()"
          />
        </div>
      </div>
    </div>
    <div
      :class="[
        'bg-light',
        'rounded-top',
        is_replying ? '' : 'rounded-bottom',
        'p-1',
        'border-left',
      ]"
      v-else-if="is_recoverable"
    >
      <div class="d-flex align-items-center mb-1">
        <b-avatar class="d-flex mr-2" variant="secondary" text="刪"></b-avatar>
        <div class="d-flex flex-column align-items-start">
          <div class="text-center text-muted font-italic">
            已刪除此訊息。
          </div>
        </div>
      </div>
      <div class="replies" v-if="is_in_channel">
        <Message
          class="reply my-2"
          :teamId="teamId"
          :channelId="channelId"
          :message="reply"
          v-for="reply in replies"
          :key="reply.id"
          @loaded="$emit('loaded')"
        />
      </div>
    </div>
    <div
      class="w-100 cursor-pointer text-muted"
      v-if="
        is_in_channel &&
          (!is_deleted || is_recoverable) &&
          !isMobile &&
          !is_replying
      "
      @click="is_replying = true"
    >
      <i class="fa fa-reply" /> 回覆
    </div>
    <MessageEditor
      ref="reply_editor"
      :class="['reply', 'rounded-bottom', 'border-' + color_variant_me]"
      :teamId="teamId"
      :channelId="channelId"
      :message_id="message.id"
      v-if="
        is_in_channel &&
          (!is_deleted || is_recoverable) &&
          !isMobile &&
          is_replying
      "
      @replied="handleReplyCreated"
      @reset="is_replying = false"
    />
  </div>
</template>

<script>
import _ from "lodash";
import { mapGetters } from "vuex";
import mixin from "@/mixins/Format";
import { MicrosoftGraphStatus, UserPresences } from "@/utils/enums";
import {
  listMessageReplies,
  refreshPresences,
  getHostedContent,
} from "@/api/microsoft";
import MessageEditor from "@/components/microsoft/teams/MessageEditor";

export default {
  name: "Message",
  mixins: [mixin],
  components: {
    MessageEditor,
  },
  props: {
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
    message: {
      type: Object,
      required: true,
    },
  },
  data: () => {
    return {
      replies: [],
      color_variants: ["info", "primary", "success", "warning", "danger"],
      is_message_hovered: false,
      is_delete_confirmed: false,
      is_editing: false,
      is_replying: false,
    };
  },
  computed: {
    ...mapGetters("session", ["isMobile", "is_apple_ios_webview"]),
    message_body_content() {
      const content_node = document.createElement("div");
      content_node.innerHTML = this.message.body.content;
      Array.from(content_node.getElementsByTagName("img"))
        .filter((i) =>
          i.src.match(
            /^https:\/\/graph.microsoft.com\/beta\/teams\/.*\/channels\/.*\/messages\/.*\/hostedContents\/.*\/\$value$/
          )
        )
        .map((i) => {
          i.setAttribute("target-src", i.src);
          i.removeAttribute("src");
        });

      return content_node.innerHTML;
    },
    is_in_channel() {
      return this.$parent.$options.name === "Channel";
    },
    is_deleted() {
      return this.message.deletedDateTime;
    },
    is_recoverable() {
      return (
        this.is_deleted &&
        (new Date(this.message.deletedDateTime) > new Date() - 3600000 ||
          this.replies.filter((i) => {
            return (
              i.deletedDateTime &&
              new Date(i.deletedDateTime) > new Date() - 3600000
            );
          }).length)
      );
    },
    color_variant() {
      return this.color_variants[
        Object.keys(this.$store.state.microsoft.presences).indexOf(
          this.message.from.user.id
        ) % this.color_variants.length
      ];
    },
    color_variant_me() {
      return this.color_variants[
        Object.keys(this.$store.state.microsoft.presences).indexOf(
          this.$store.state.microsoft.me.id
        ) % this.color_variants.length
      ];
    },
  },
  methods: {
    loadReplies() {
      //[TODO] check channel message is existed
      if (
        this.$store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn
      ) {
        return listMessageReplies(
          this.teamId,
          this.channelId,
          this.message.id
        ).then((replies) => {
          this.replies = replies.reverse();
        });
      } else return Promise.reject();
    },
    loadRepliesThrottled: _.throttle(function() {
      this.loadReplies();
    }, 5000),
    focusCard(card_name) {
      document
        .querySelectorAll(".card-wrapper .card[name='" + card_name + "']")
        .forEach((i) => {
          i.parentNode.classList.add("focused");
        });
    },
    blurCards() {
      document.querySelectorAll(".card-wrapper").forEach((i) => {
        i.classList.remove("focused");
      });
    },
    mention(type, mention) {
      if (this.is_in_channel) {
        this.is_replying = true;
        this.$nextTick(() => {
          if (this.$refs["reply_editor"])
            this.$refs["reply_editor"].mention(type, mention);
          else this.$emit("mentioned", { type: type, mention: mention });
        });
      } else this.$emit("mentioned", { type: type, mention: mention });
    },
    deleteMessage() {
      if (this.is_delete_confirmed) {
        this.toastMessage(
          "尚未支援刪除討論訊息",
          "Microsoft Graph API目前尚不支援編輯Microsoft Teams訊息功能，請開啟Microsoft Teams桌面版或網頁版客戶端執行刪除。",
          "warning"
        );
        this.is_delete_confirmed = false;
      } else {
        this.is_delete_confirmed = true;
      }
    },
    formatMentions() {
      if (this.$refs["content"]) {
        Array.from(this.$refs["content"].getElementsByTagName("at")).map(
          (i) => {
            let member_name = i.textContent;
            let menber_id = this.message.mentions[i.getAttribute("id")]
              .mentioned.user.id;
            i.title = member_name;
            i.innerHTML = '<i class="fa fa-user"></i> ' + member_name;
            i.classList.add("badge-secondary");
            i.classList.add("badge-pill");
            i.classList.add("text-light");
            i.classList.add("cursor-pointer");
            i.addEventListener("click", () => {
              this.mention("member", {
                value: member_name,
                mentioned_user_id: menber_id,
              });
            });
          }
        );

        Array.from(this.$refs["content"].getElementsByTagName("a"))
          .filter((i) => i.href.match(/^https:\/\/localhost:8080\/v2\/.*#.*/))
          .map((i) => {
            let card_name = decodeURIComponent(
              i.href.replace(/^https:\/\/localhost:8080\/v2\/.*#/, "")
            );
            i.title = card_name;
            i.innerHTML = '<i class="fa fa-chart-bar"></i> ' + card_name;
            i.removeAttribute("href");
            i.classList.add("badge-secondary");
            i.classList.add("badge-pill");
            i.classList.add("text-light");
            i.classList.add("cursor-pointer");
            i.addEventListener("click", () => {
              this.focusCard(card_name);
              this.mention("card", {
                value: card_name,
                href: encodeURI(
                  "https://localhost:8080/v2" +
                    this.$route.path +
                    "#" +
                    card_name
                ),
              });
            });
            i.addEventListener("mouseenter", () => {
              this.blurCards();
              this.focusCard(card_name);
            });
            i.addEventListener("mouseleave", () => {
              if (!this.isMobile && !this.is_apple_ios_webview)
                this.blurCards();
            });
          });

        Array.from(this.$refs["content"].getElementsByTagName("img"))
          .filter((i) => {
            return (
              i.getAttribute("target-src") &&
              i
                .getAttribute("target-src")
                .match(
                  /^https:\/\/graph.microsoft.com\/beta\/teams\/.*\/channels\/.*\/messages\/.*\/hostedContents\/.*\/\$value$/
                )
            );
          })
          .map((i) => {
            const hosted_content_id = decodeURI(
              i.getAttribute("target-src")
            ).split("/")[11];
            getHostedContent(
              this.teamId,
              this.channelId,
              this.message.id,
              hosted_content_id
            )
              .then((img) => {
                i.src = URL.createObjectURL(img);
              })
              .catch(() => {
                i.src = "/v2/img/image.svg";
                i.removeAttribute("style");
              });
          });
      }
    },
    handleEditorReset() {
      this.is_editing = false;
      this.$nextTick(this.formatMentions);
    },
    handleReplyCreated(event) {
      if (event) {
        if (
          !Object.keys(this.$store.state.microsoft.presences).includes(
            event.from.user.id
          )
        )
          this.$store.state.microsoft.presences[event.from.user.id] =
            UserPresences.PresenceUnknown;

        this.replies.push(event);
      }
    },
    handleMouseOver(event) {
      event.stopPropagation();
      this.is_message_hovered = true;
      if (!this.is_in_channel && this.$parent.is_message_hovered)
        this.$parent.is_message_hovered = false;
      if (this.is_in_channel) this.loadRepliesThrottled();
      else this.$emit("refresh-replies");
    },
    handleMouseLeave(event) {
      this.is_message_hovered = false;
    },
  },
  mounted() {
    if (this.is_in_channel)
      this.loadReplies().then(() => {
        this.$emit("loaded");
      });

    this.formatMentions();
  },
};
</script>
