<template>
  <div
    :class="[
      'message',
      'clearfix',
      'animated',
      'fadeIn',
      'rounded',
      isMessageHovered ? 'hovered' : ''
    ]"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
  >
    <div
      :class="[
        'bg-light',
        'rounded-top',
        isReplying || (isInChannel && isMessageHovered) ? '' : 'rounded-bottom',
        'p-1',
        'border-left',
        message.from.user.id === $store.state.microsoft.me.id
          ? 'border-' + colorVariant
          : ''
      ]"
      v-if="!isDeleted"
    >
      <div class="d-flex align-items-center mb-2 position-relative">
        <b-avatar
          class="d-flex mr-2"
          :variant="colorVariant"
          button
          badge
          :badge-variant="
            $store.state.microsoft.presences[message.from.user.id]
              ? $store.state.microsoft.presences[message.from.user.id]
                  .colorVariant
              : 'secondary'
          "
          :text="formatNameInitials(message.from.user.displayName)"
          @click="
            mention('member', {
              value: message.from.user.displayName,
              mentionedUserId: message.from.user.id
            })
          "
        ></b-avatar>
        <div class="d-flex flex-column align-items-start">
          <div
            class="cursor-pointer"
            @click="
              mention('member', {
                value: message.from.user.displayName,
                mentionedUserId: message.from.user.id
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
          v-if="isMessageHovered"
        >
          <b-button
            class="text-dark"
            variant="transparent"
            pill
            v-if="
              message.from.user.id === $store.state.microsoft.me.id &&
                !isDeleteConfirmed &&
                !isEditing
            "
            @click="isEditing = true"
          >
            <i class="fa fa-edit" />
          </b-button>
          <b-button
            :class="isDeleteConfirmed ? 'text-danger' : 'text-dark'"
            variant="transparent"
            pill
            v-if="message.from.user.id === $store.state.microsoft.me.id"
            @click="deleteMessage()"
            @blur="isDeleteConfirmed = false"
          >
            <i
              :class="[
                'fa',
                isDeleteConfirmed ? 'fa-question-circle' : 'fa-trash-alt'
              ]"
            />
            {{ isDeleteConfirmed ? "確認刪除" : "" }}
          </b-button>
        </b-button-group>
      </div>
      <div>
        <div
          ref="content"
          class="content overflow-hidden"
          v-html="messageBodyContent"
          v-if="!isEditing"
        ></div>
        <MessageEditor
          class="content border-0"
          :teamId="teamId"
          :channelId="channelId"
          :messageId="message.id"
          :message="message"
          v-else
          @reset="handleEditorReset"
        />
        <!-- <pre>{{ message }}</pre> -->
        <div class="replies" v-if="isInChannel">
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
        isReplying ? '' : 'rounded-bottom',
        'p-1',
        'border-left'
      ]"
      v-else-if="isRecoverable"
    >
      <div class="d-flex align-items-center mb-1">
        <b-avatar class="d-flex mr-2" variant="secondary" text="刪"></b-avatar>
        <div class="d-flex flex-column align-items-start">
          <div class="text-center text-muted font-italic">
            已刪除此訊息。
          </div>
        </div>
      </div>
      <div class="replies" v-if="isInChannel">
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
        isInChannel && (!isDeleted || isRecoverable) && !isMobile && !isReplying
      "
      @click="isReplying = true"
    >
      <i class="fa fa-reply" /> 回覆
    </div>
    <MessageEditor
      ref="reply_editor"
      :class="['reply', 'rounded-bottom', 'border-' + colorVariantMe]"
      :teamId="teamId"
      :channelId="channelId"
      :messageId="message.id"
      v-if="
        isInChannel && (!isDeleted || isRecoverable) && !isMobile && isReplying
      "
      @replied="handleReplyCreated"
      @reset="isReplying = false"
    />
  </div>
</template>

<script>
import _ from "lodash";
import { mapGetters } from "vuex";

import { MicrosoftGraphStatus, UserPresences } from "../../../utils/enums";
import {
  formatDateTimeFromNow,
  formatNameInitials
} from "../../../utils/utils";
import {
  listMessageReplies,
  refreshPresences,
  getHostedContent
} from "../../../api/microsoft";
import MessageEditor from "./MessageEditor";

export default {
  name: "Message",
  components: {
    MessageEditor
  },
  props: {
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
    message: {
      type: Object,
      required: true
    }
  },
  data: () => {
    return {
      isMobile: false,
      isAppleIOSWebView: false,
      replies: [],
      colorVariants: ["info", "primary", "success", "warning", "danger"],
      isMessageHovered: false,
      isDeleteConfirmed: false,
      isEditing: false,
      isReplying: false
    };
  },
  computed: {
    messageBodyContent() {
      const contentNode = document.createElement("div");
      contentNode.innerHTML = this.message.body.content;
      Array.from(contentNode.getElementsByTagName("img"))
        .filter(i =>
          i.src.match(
            /^https:\/\/graph.microsoft.com\/beta\/teams\/.*\/channels\/.*\/messages\/.*\/hostedContents\/.*\/\$value$/
          )
        )
        .map(i => {
          i.setAttribute("target-src", i.src);
          i.removeAttribute("src");
        });

      return contentNode.innerHTML;
    },
    isInChannel() {
      return this.$parent.$options.name === "Channel";
    },
    isDeleted() {
      return this.message.deletedDateTime;
    },
    isRecoverable() {
      return (
        this.isDeleted &&
        (new Date(this.message.deletedDateTime) > new Date() - 3600000 ||
          this.replies.filter(i => {
            return (
              i.deletedDateTime &&
              new Date(i.deletedDateTime) > new Date() - 3600000
            );
          }).length)
      );
    },
    colorVariant() {
      return this.colorVariants[
        Object.keys(this.$store.state.microsoft.presences).indexOf(
          this.message.from.user.id
        ) % this.colorVariants.length
      ];
    },
    colorVariantMe() {
      return this.colorVariants[
        Object.keys(this.$store.state.microsoft.presences).indexOf(
          this.$store.state.microsoft.me.id
        ) % this.colorVariants.length
      ];
    }
  },
  methods: {
    formatDateTimeFromNow,
    formatNameInitials,
    loadReplies() {
      //[TODO] check channel message is existed
      if (
        this.$store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn
      ) {
        return listMessageReplies(
          this.teamId,
          this.channelId,
          this.message.id
        ).then(replies => {
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
        .forEach(i => {
          i.parentNode.classList.add("focused");
        });
    },
    blurCards() {
      document.querySelectorAll(".card-wrapper").forEach(i => {
        i.classList.remove("focused");
      });
    },
    mention(type, mention) {
      if (this.isInChannel) {
        this.isReplying = true;
        this.$nextTick(() => {
          if (this.$refs["reply_editor"])
            this.$refs["reply_editor"].mention(type, mention);
          else this.$emit("mentioned", { type: type, mention: mention });
        });
      } else this.$emit("mentioned", { type: type, mention: mention });
    },
    deleteMessage() {
      if (this.isDeleteConfirmed) {
        this.$bvToast.toast(
          "Microsoft Graph API目前尚不支援刪除訊息功能，請開啟Microsoft Teams桌面版或網頁版客戶端執行刪除。",
          {
            title: "尚未支援刪除討論訊息",
            variant: "warning",
            noAutoHide: true,
            autoHideDelay: 3000,
            dismissible: true,
            toaster: "b-toaster-bottom-right"
          }
        );
        this.isDeleteConfirmed = false;
      } else {
        this.isDeleteConfirmed = true;
      }
    },
    formatMentions() {
      if (this.$refs["content"]) {
        Array.from(this.$refs["content"].getElementsByTagName("at")).map(i => {
          let memberName = i.textContent;
          let memberId = this.message.mentions[i.getAttribute("id")].mentioned
            .user.id;
          i.title = memberName;
          i.innerHTML = '<i class="fa fa-user"></i> ' + memberName;
          i.classList.add("badge-secondary");
          i.classList.add("badge-pill");
          i.classList.add("text-light");
          i.classList.add("cursor-pointer");
          i.addEventListener("click", () => {
            this.mention("member", {
              value: memberName,
              mentionedUserId: memberId
            });
          });
        });

        let re = "^" + location.href + process.env.BASE_URL + ".*#";
        Array.from(this.$refs["content"].getElementsByTagName("a"))
          .filter(i => i.href.match(new RegExp(re + ".*")))
          .map(i => {
            let card_name = decodeURIComponent(
              i.href.replace(new RegExp(re), "")
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
                  location.origin +
                    process.env.BASE_URL +
                    this.$route.path +
                    "#" +
                    card_name
                )
              });
            });
            i.addEventListener("mouseenter", () => {
              this.blurCards();
              this.focusCard(card_name);
            });
            i.addEventListener("mouseleave", () => {
              if (!this.isMobile && !this.isAppleIOSWebView) this.blurCards();
            });
          });

        Array.from(this.$refs["content"].getElementsByTagName("img"))
          .filter(i => {
            return (
              i.getAttribute("target-src") &&
              i
                .getAttribute("target-src")
                .match(
                  /^https:\/\/graph.microsoft.com\/beta\/teams\/.*\/channels\/.*\/messages\/.*\/hostedContents\/.*\/\$value$/
                )
            );
          })
          .map(i => {
            const hosted_content_id = decodeURI(
              i.getAttribute("target-src")
            ).split("/")[11];
            getHostedContent(
              this.teamId,
              this.channelId,
              this.message.id,
              hosted_content_id
            )
              .then(img => {
                i.src = URL.createObjectURL(img);
              })
              .catch(() => {
                i.src = process.env.BASE_URL.slice(0, -1) + "/img/image.svg";
                i.removeAttribute("style");
              });
          });
      }
    },
    handleEditorReset() {
      this.isEditing = false;
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
      this.isMessageHovered = true;
      if (!this.isInChannel && this.$parent.isMessageHovered)
        this.$parent.isMessageHovered = false;
      if (this.isInChannel) this.loadRepliesThrottled();
      else this.$emit("refresh-replies");
    },
    handleMouseLeave(event) {
      this.isMessageHovered = false;
    }
  },
  mounted() {
    if (this.isInChannel)
      this.loadReplies().then(() => {
        this.$emit("loaded");
      });

    this.formatMentions();
  }
};
</script>
