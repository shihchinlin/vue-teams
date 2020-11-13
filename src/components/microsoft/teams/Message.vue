<template>
  <div
    :class="[
      'message',
      !isDeleted || isRecoverable || hasReplies
        ? hasReactions && isReplyHeaderOmitted
          ? 'mt-4 mb-2'
          : 'my-2'
        : '',
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
        isReplyHeaderOmitted ? 'mt-n1' : '',
        isMessageHovered || !isReplyHeaderOmitted ? 'rounded-top' : '',
        isReplying || (isMessage && isMessageHovered) ? '' : 'rounded-bottom',
        'p-1',
        'border-left',
        !isDeleted && message.from.user.id === $store.state.microsoft.me.id
          ? 'border-' + colorVariant
          : ''
      ]"
      v-if="!isDeleted || isRecoverable || hasReplies"
    >
      <!-- Header -->
      <div
        :class="[
          'd-flex',
          'align-items-center',
          isReplyHeaderOmitted ? '' : 'mb-2',
          'position-relative'
        ]"
        v-if="!isDeleted"
      >
        <b-avatar
          class="d-flex mr-2"
          :variant="colorVariant"
          button
          badge
          :badge-variant="
            presences[message.from.user.id]
              ? presences[message.from.user.id].colorVariant
              : 'secondary'
          "
          :text="formatNameInitials(message.from.user.displayName)"
          v-if="!isReplyHeaderOmitted"
          @click="
            mention('member', {
              value: message.from.user.displayName,
              mentionedUserId: message.from.user.id
            })
          "
        ></b-avatar>
        <div
          class="d-flex flex-column align-items-start"
          v-if="!isReplyHeaderOmitted"
        >
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
          :class="[
            'actions',
            'position-absolute',
            isReplyHeaderOmitted ? 'no-header' : ''
          ]"
          v-if="isMessageHovered || true"
        >
          <!-- <b-button
            class="text-dark"
            variant="transparent"
            v-if="
              isMessageHovered &&
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
            v-if="
              isMessageHovered &&
                message.from.user.id === $store.state.microsoft.me.id
            "
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
          </b-button> -->
          <template v-for="reaction in Object.keys(MessageReactions)">
            <b-button
              :class="'text-' + MessageReactions[reaction].colorVariant"
              variant="transparent"
              v-if="message.reactions && formatReactionCount(reaction)"
              v-b-tooltip.hover="formatReactionUserDisplayName(reaction)"
              :key="reaction"
            >
              <i :class="MessageReactions[reaction].icon" />
              {{ formatReactionCount(reaction) }}
            </b-button>
          </template>
        </b-button-group>
      </div>
      <div
        class="d-flex align-items-center"
        v-else-if="isRecoverable || hasReplies"
      >
        <b-avatar
          class="d-flex mr-2"
          variant="secondary"
          text="刪"
          v-if="!isReplyHeaderOmitted"
        ></b-avatar>
        <div class="d-flex flex-column align-items-start">
          <div class="text-center text-muted font-italic">
            已刪除此訊息。
          </div>
        </div>
      </div>
      <!-- Content -->
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
          :members="members"
          :messageId="message.id"
          :message="message"
          v-else
          @reset="handleEditorReset"
        />
        <div class="replies" v-if="isMessage">
          <Message
            class="reply"
            :teamId="teamId"
            :channelId="channelId"
            :members="members"
            :message="reply"
            v-for="reply in replies"
            :key="reply.id"
            @loaded="$emit('loaded')"
            @mentioned="mention($event.type, $event.mention)"
            @refresh="loadRepliesThrottled()"
          />
        </div>
      </div>
    </div>
    <!-- Reply Editor -->
    <div
      class="w-100 cursor-pointer text-muted"
      v-if="
        isMessage &&
          (!isDeleted || isRecoverable || hasReplies) &&
          !isMobile &&
          !isReplying
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
      :members="members"
      :messageId="message.id"
      v-if="
        isMessage &&
          (!isDeleted || isRecoverable || hasReplies) &&
          !isMobile &&
          isReplying
      "
      @replied="handleReplyCreated"
      @reset="isReplying = false"
    />
  </div>
</template>

<script>
import _ from "lodash";
import { mapGetters } from "vuex";

import {
  MicrosoftStates,
  PresenceAvailabilities,
  MessageReactions
} from "../../../utils/enums";
import {
  formatDateTimeFromNow,
  formatNameInitials
} from "../../../utils/utils";
import { listMessageReplies, getHostedContent } from "../../../api/microsoft";
import MessageEditor from "./MessageEditor";

export default {
  name: "Message",
  components: {
    MessageEditor
  },
  props: {
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
    members: { type: Array, required: true },
    message: {
      type: Object,
      required: true
    }
  },
  data: () => {
    return {
      MessageReactions,
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
    ...mapGetters("microsoft", ["myId", "state", "presences"]),
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
    isMessage() {
      return this.$parent.$el.classList.contains("vue-teams-channel");
    },
    isDeleted() {
      return this.message.deletedDateTime;
    },
    isRecoverable() {
      return (
        this.isDeleted &&
        new Date(this.message.deletedDateTime) > new Date() - 3600000
      );
    },
    isReplyHeaderOmitted() {
      if (!this.isMessage) {
        let previousReplyIndex =
          this.$parent.replies.findIndex(
            reply => reply.id === this.message.id
          ) - 1;
        if (previousReplyIndex >= 0) {
          return (
            !this.$parent.replies[previousReplyIndex].deletedDateTime &&
            this.$parent.replies[previousReplyIndex].from.user.id ===
              this.message.from.user.id &&
            Math.abs(
              new Date(this.message.createdDateTime) -
                new Date(
                  this.$parent.replies[previousReplyIndex].createdDateTime
                )
            ) <= 600000
          );
        }
      }
      return false;
    },
    hasReplies() {
      return (
        this.replies.filter(reply => {
          return (
            !reply.deletedDateTime ||
            new Date(reply.deletedDateTime) <= new Date() - 3600000
          );
        }).length > 0
      );
    },
    hasReactions() {
      return this.message.reactions && this.message.reactions.length;
    },
    colorVariant() {
      return this.colorVariants[
        Object.keys(this.presences).indexOf(this.message.from.user.id) %
          this.colorVariants.length
      ];
    },
    colorVariantMe() {
      return this.colorVariants[
        Object.keys(this.presences).indexOf(this.myId) %
          this.colorVariants.length
      ];
    }
  },
  methods: {
    formatDateTimeFromNow,
    formatNameInitials,
    loadReplies() {
      if (this.state === MicrosoftStates.LoggedIn) {
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
    }, 3000),
    focusCard(cardName) {
      document
        .querySelectorAll(".card-wrapper .card[name='" + cardName + "']")
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
      if (this.isMessage) {
        this.isReplying = true;
        this.$nextTick(() => {
          if (this.$refs["reply_editor"])
            this.$refs["reply_editor"].mention(type, mention);
          else this.$emit("mentioned", { type: type, mention: mention });
        });
      } else this.$emit("mentioned", { type: type, mention: mention });
    },
    deleteMessage() {
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
      if (this.isDeleteConfirmed) {
        this.isDeleteConfirmed = false;
      } else {
        this.isDeleteConfirmed = true;
      }
    },
    formatMentions() {
      if (this.$refs["content"]) {
        Array.from(this.$refs["content"].getElementsByTagName("at")).map(i => {
          let memberName = i.textContent;
          let member = this.message.mentions[i.getAttribute("id")].mentioned
            .user;
          if (member) {
            let memberId = member.id;
            i.title = memberName;
            i.innerHTML = '<i class="fa fa-user"></i> ' + memberName;
            i.classList.add("badge-secondary");
            i.classList.add("badge-pill");
            i.classList.add("text-light");
            i.classList.add("text-nowrap");
            i.classList.add("cursor-pointer");
            i.addEventListener("click", () => {
              this.mention("member", {
                value: memberName,
                mentionedUserId: memberId
              });
            });
          }
        });

        let re =
          "^" + location.origin + process.env.BASE_URL.slice(0, -1) + ".*#";
        Array.from(this.$refs["content"].getElementsByTagName("a"))
          .filter(i => i.href.match(new RegExp(re + ".*")))
          .map(i => {
            let cardName = decodeURIComponent(
              i.href.replace(new RegExp(re), "")
            );
            i.title = cardName;
            i.innerHTML = '<i class="fa fa-chart-bar"></i> ' + cardName;
            i.removeAttribute("href");
            i.classList.add("badge-secondary");
            i.classList.add("badge-pill");
            i.classList.add("text-light");
            i.classList.add("text-nowrap");
            i.classList.add("cursor-pointer");
            i.addEventListener("click", () => {
              this.focusCard(cardName);
              this.mention("card", {
                value: cardName,
                href:
                  location.origin +
                  location.pathname +
                  "#" +
                  encodeURIComponent(cardName)
              });
            });
            i.addEventListener("mouseenter", () => {
              this.blurCards();
              this.focusCard(cardName);
            });
            i.addEventListener("mouseleave", () => {
              if (!this.isMobile && !this.isAppleIOSWebView) this.blurCards();
            });
          });

        const images = Array.from(
          this.$refs["content"].getElementsByTagName("img")
        );
        images
          .filter(i => {
            return (
              i.getAttribute("target-src") &&
              i
                .getAttribute("target-src")
                .match(
                  /^https:\/\/graph.microsoft.com\/beta\/.*\/hostedContents\/.*\/\$value$/
                )
            );
          })
          .map(i => {
            getHostedContent(i.getAttribute("target-src"))
              .then(img => {
                i.src = URL.createObjectURL(img);
                i.removeAttribute("style");
                i.removeAttribute("height");
                i.removeAttribute("width");
              })
              .catch(() => {
                i.src =
                  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNDY0IDY0SDQ4QzIxLjQ5IDY0IDAgODUuNDkgMCAxMTJ2Mjg4YzAgMjYuNTEgMjEuNDkgNDggNDggNDhoNDE2YzI2LjUxIDAgNDgtMjEuNDkgNDgtNDhWMTEyYzAtMjYuNTEtMjEuNDktNDgtNDgtNDh6bS02IDMzNkg1NGE2IDYgMCAwIDEtNi02VjExOGE2IDYgMCAwIDEgNi02aDQwNGE2IDYgMCAwIDEgNiA2djI3NmE2IDYgMCAwIDEtNiA2ek0xMjggMTUyYy0yMi4wOTEgMC00MCAxNy45MDktNDAgNDBzMTcuOTA5IDQwIDQwIDQwIDQwLTE3LjkwOSA0MC00MC0xNy45MDktNDAtNDAtNDB6TTk2IDM1MmgzMjB2LTgwbC04Ny41MTUtODcuNTE1Yy00LjY4Ni00LjY4Ni0xMi4yODQtNC42ODYtMTYuOTcxIDBMMTkyIDMwNGwtMzkuNTE1LTM5LjUxNWMtNC42ODYtNC42ODYtMTIuMjg0LTQuNjg2LTE2Ljk3MSAwTDk2IDMwNHY0OHoiIGZpbGw9IiM5MDkwOTAiLz48L3N2Zz4=";
                i.removeAttribute("style");
                i.removeAttribute("height");
                i.removeAttribute("width");
              });
          });
        images.map(i => {
          i.setAttribute("class", "mw-100 cursor-pointer");
          i.setAttribute("title", "點擊以原始比例檢視圖片");
          i.addEventListener("click", () => {
            this.showImageModal(i.src);
          });
        });
      }
    },
    formatReactionCount(reactionType) {
      return this.message.reactions.filter(
        e => e.reactionType === reactionType.toLowerCase()
      ).length;
    },
    formatReactionUserDisplayName(reactionType) {
      return this.message.reactions
        .filter(
          e => e.reactionType === reactionType.toLowerCase() && e.user.user
        )
        .map(e => {
          const foundMember = this.members.find(
            member => member.userId === e.user.user.id
          );
          return foundMember ? foundMember.displayName : e.user.user.id;
        })
        .join("、");
    },
    showImageModal(src) {
      const contentNode = this.$createElement("b-img", {
        class: {
          "mw-100": true,
          "bg-white": true,
          "p-2": true,
          border: true,
          rounded: true
        },
        props: { src: src }
      });
      this.$bvModal.msgBoxOk([contentNode], {
        size: "xl",
        centered: true,
        buttonSize: "sm",
        bodyClass: "text-center",
        contentClass: "bg-transparent border-0 shadow-none",
        footerClass: "border-0",
        okVariant: "light",
        okTitle: "關閉"
      });
    },
    handleEditorReset() {
      this.isEditing = false;
      this.$nextTick(this.formatMentions);
    },
    handleReplyCreated(event) {
      if (event) {
        if (!Object.keys(this.presences).includes(event.from.user.id))
          this.presences[event.from.user.id] =
            PresenceAvailabilities.PresenceUnknown;
        this.replies.push(event);
      }
    },
    handleMouseOver(event) {
      event.stopPropagation();
      this.isMessageHovered = true;
      if (this.isMessage) {
        this.$emit("refresh");
        this.loadRepliesThrottled();
      } else {
        this.$parent.isMessageHovered = false;
        this.$emit("refresh");
      }
    },
    handleMouseLeave(event) {
      this.isMessageHovered = false;
    }
  },
  mounted() {
    if (this.isMessage)
      this.loadReplies().then(() => {
        this.$emit("loaded");
      });
    this.formatMentions();
  },
  watch: {
    isEditing() {
      if (this.isEditing)
        this.$bvToast.toast(
          "Microsoft Graph API目前尚不支援編輯訊息功能，請開啟Microsoft Teams桌面版或網頁版客戶端執行編輯。",
          {
            title: "尚未支援編輯討論訊息",
            variant: "warning",
            noAutoHide: true,
            autoHideDelay: 3000,
            dismissible: true,
            toaster: "b-toaster-bottom-right"
          }
        );
    }
  }
};
</script>
