<template>
  <div
    :class="[
      'message-editor',
      'mask-wrapper',
      isCardDragging ? 'droppable' : ''
    ]"
    @dragover.prevent=""
    @drop="handleCardDrop"
  >
    <div class="mask d-none text-nowrap overflow-hidden" />
    <VueQuillEditor
      ref="editor"
      v-model="body.content"
      :options="quillEditorOptions"
      @blur="handleEditorBlur"
    >
    </VueQuillEditor>
    <b-button-group
      class="actions position-absolute p-2"
      size="sm"
      @mouseover="toggleActions(true)"
      @mouseleave="toggleActions(false)"
    >
      <b-button
        :class="
          isActionsHovered || isCardMentioned || isMentioningCard
            ? 'mx-1'
            : 'position-absolute invisible'
        "
        :variant="isCardMentioned || isMentioningCard ? 'danger' : 'white'"
        pill
        v-b-tooltip.hover="'標註報表'"
        @click="toggleCardsSelection()"
      >
        <i class="fa fa-hashtag"></i>
      </b-button>
      <b-button
        :class="
          isActionsHovered ||
          isMemberMentioned ||
          isMentioningMember ||
          isCardMentioned ||
          isMentioningCard
            ? 'mx-1'
            : 'position-absolute invisible'
        "
        :variant="isMemberMentioned || isMentioningMember ? 'danger' : 'white'"
        pill
        v-b-tooltip.hover="'標註使用者'"
        @click="toggleMembersSelection()"
      >
        <i class="fa fa-at"></i>
      </b-button>
      <b-button
        :class="
          isActionsHovered ||
          isMemberMentioned ||
          isMentioningMember ||
          isCardMentioned ||
          isMentioningCard ||
          body.content
            ? 'mx-1'
            : 'position-absolute invisible'
        "
        variant="danger"
        pill
        v-b-tooltip.hover="'取消'"
        :disabled="!Boolean(body.content)"
        @click="cancelMessageEdit()"
      >
        <i class="fa fa-times"></i>
      </b-button>
      <b-button
        class="mx-1"
        variant="success"
        pill
        v-b-tooltip.hover="isEditingMessage ? '完成' : '傳送'"
        @click="sendMessage()"
        :disabled="body.content === ''"
      >
        <i
          :class="['fa', isEditingMessage ? 'fa-check' : 'fa-paper-plane']"
        ></i>
      </b-button>
    </b-button-group>
    <!-- <pre>{{ message }}</pre> -->
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import { quillEditor as VueQuillEditor } from "vue-quill-editor";
import Mention from "quill-mention";

import { MicrosoftStatus, PresenceAvailabilities } from "../../../utils/enums";
import { formatNameInitials } from "../../../utils/utils";
import {
  sendMessage,
  replyToMessage,
  listChannelMembers
} from "../../../api/microsoft";

Quill.register("modules/mention", Mention);

export default {
  components: {
    VueQuillEditor
  },
  props: {
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    message: { type: Object, default: null }
  },
  data: function() {
    return {
      isMobile: false,
      isAppleIOSWebView: false,
      isActionsHovered: false,
      isMentioningMember: false,
      isMemberMentioned: false,
      isCardMentioned: false,
      colorVariants: ["info", "primary", "success", "warning", "danger"],
      members: null,
      body: {
        content: ""
      },
      mentions: []
    };
  },
  computed: {
    ...mapGetters("microsoft", ["status", "presences"]),
    ...mapGetters({
      isMentioningCard: "card/isCardSelectable",
      isCardDragging: "card/isCardDragging"
    }),
    quillEditorOptions() {
      return {
        theme: "snow",
        placeholder: "請輸入您的討論訊息",
        modules: {
          toolbar: [
            [
              "bold",
              "italic",
              "underline",
              "strike",
              { background: [] },
              { color: [] },
              { align: [] }
            ]
          ],
          clipboard: {
            matchers: [["span.mention", this.trimMentionBadgeStyle]]
          },
          mention: {
            source: this.showMentionSuggestions,
            renderItem: this.renderMentionSuggestion,
            allowedChars: /^[a-zA-Z0-9_\-\p{Unified_Ideograph}]*$/u,
            mentionDenotationChars: ["@", "#"],
            defaultMenuOrientation: "top",
            dataAttributes: [
              "id",
              "value",
              "denotationChar",
              "mentionedUserId",
              "href"
            ],
            onSelect: this.handleMentionSuggestionSelected,
            mentionContainerClass: "ql-mention-list-container",
            mentionListClass: "ql-mention-list list-group",
            listItemClass:
              "ql-mention-list-item list-group-item list-group-item-action p-2"
          }
        }
      };
    },
    isEditingMessage() {
      return this.message !== null;
    },
    messageDraft() {
      return {
        body: {
          contentType: "html",
          content: this.body.content
        },
        mentions: this.mentions
      };
    }
  },
  methods: {
    ...mapMutations({
      _toggleCardsSelection: "card/TOGGLE_SELECTABLE",
      toggleDragging: "card/TOGGLE_DRAGGING"
    }),
    mention(type, mention) {
      if (!this.$refs["editor"].quill.getModule("mention").mentionCharPos)
        this.$refs["editor"].quill.getModule("mention").mentionCharPos = 0;
      if (type === "member") {
        this.$refs["editor"].quill.getModule("mention").insertItem(
          Object.assign(
            {
              id: 0,
              denotationChar: "@"
            },
            mention
          )
        );
      }
      if (type === "card") {
        this.$refs["editor"].quill.getModule("mention").insertItem(
          Object.assign(
            {
              id: 0,
              denotationChar: "#"
            },
            mention
          )
        );
      }
    },
    showMentionSuggestions: async function(keyword, renderList, mentionChar) {
      let suggestions = [];
      if (mentionChar === "@") suggestions = await this.suggestMembers(keyword);
      if (mentionChar === "#") suggestions = this.suggestCards(keyword);
      renderList(suggestions);
    },
    renderMentionSuggestion(item) {
      if (item.mentionedUserId) {
        return (
          '<div class="d-flex align-items-center"><span class="b-avatar mr-2 badge-' +
          this.colorVariants[
            Object.keys(this.presences).indexOf(item.mentionedUserId) %
              this.colorVariants.length
          ] +
          ' rounded-circle" style="width: 2.5em; height: 2.5em;"><span class="b-avatar-text"><span>' +
          formatNameInitials(item.value) +
          '</span></span></span><div class="d-flex flex-column align-items-start"> ' +
          item.value +
          ' <small class="d-block text-muted"> ' +
          (item.email ? item.email : item.mentionedUserId) +
          " </small></div></div>"
        );
      } else if (item.href) {
        return (
          '<div class="d-flex align-items-center"><span class="b-avatar mr-2 badge-secondary rounded-circle" style="width: 2.5em; height: 2.5em;"><span class="b-avatar-text"><span class="fa fa-chart-bar"></span></span></span><div class="d-flex flex-column align-items-start text-truncate" style="width: 150px;"> ' +
          item.value +
          ' <small class="d-block text-muted text-truncate" style="width: 150px;"  title="' +
          decodeURIComponent(location.pathname) +
          '"> ' +
          decodeURIComponent(location.pathname) +
          " </small></div></div>"
        );
      }
    },
    handleMentionSuggestionSelected(item, insertItem) {
      this._toggleCardsSelection(false);
      this.isMentioningMember = false;
      insertItem(item);
    },
    async suggestMembers(keyword) {
      if (this.members === null) {
        this.members = await listChannelMembers(this.teamId, this.channelId);
        this.members.forEach(i => {
          if (!Object.keys(this.presences).includes(i.userId))
            this.presences[i.userId] = PresenceAvailabilities.PresenceUnknown;
        });
        this.members.sort((a, b) => {
          let a_order = Object.keys(this.presences).indexOf(a.userId);
          let b_order = Object.keys(this.presences).indexOf(b.userId);
          return a_order - b_order;
        });
      }
      return this.members
        .filter(
          member =>
            (member.displayName.includes(keyword) ||
              member.email.includes(keyword)) &&
            member.userId !== this.myId
        )
        .map((member, memberIndex) => {
          return {
            id: memberIndex,
            value: member.displayName,
            mentionedUserId: member.userId,
            email: member.email
          };
        });
    },
    suggestCards(keyword) {
      const cards = Array.from(
        document.querySelectorAll(".card-wrapper .card")
      ).map((card, cardIndex) => {
        return {
          id: cardIndex,
          value: card.getAttribute("name"),
          href:
            location.href + "#" + encodeURIComponent(card.getAttribute("name"))
        };
      });
      return cards.filter(card => card.value.includes(keyword));
    },
    sendMessage() {
      if (this.status === MicrosoftStatus.LoggedIn)
        if (this.body.content !== "") {
          {
            if (this.message) {
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
            } else {
              let api = this.messageId
                ? replyToMessage(
                    this.teamId,
                    this.channelId,
                    this.messageId,
                    this.transformMessageFromQuillToGraph(
                      this.body.content,
                      this.mentions
                    )
                  )
                : sendMessage(
                    this.teamId,
                    this.channelId,
                    this.transformMessageFromQuillToGraph(
                      this.body.content,
                      this.mentions
                    )
                  );
              api.then(res => {
                this.$emit("replied", res);
              });
              this.body.content = "";
              this.$emit("reset");
            }
          }
        }
    },
    cancelMessageEdit() {
      this.body.content = "";
      if (this.isMentioningCard) this._toggleCardsSelection(false);
      this.$emit("reset");
    },
    toggleActions(force = null) {
      if (force !== null) {
        if (force) this.isActionsHovered = force;
        else
          setTimeout(() => {
            this.isActionsHovered = force;
          }, 500);
      } else this.isActionsHovered = !this.isActionsHovered;
      if (!this.isActionsHovered && (this.isMobile || this.isAppleIOSWebView))
        this.isActionsHovered = true;
    },
    toggleMembersSelection() {
      if (!this.isMentioningMember) {
        this.$refs["editor"].quill.insertText(
          this.$refs["editor"].quill.getSelection(true).index,
          "@"
        );
        this.$refs["editor"].quill.getModule("mention").onSomethingChange();
      } else {
        this.$refs["editor"].quill.deleteText(
          this.$refs["editor"].quill.getModule("mention").mentionCharPos,
          this.$refs["editor"].quill.getModule("mention").cursorPos -
            this.$refs["editor"].quill.getModule("mention").mentionCharPos
        );
        this.$refs["editor"].quill.getModule("mention").hideMentionList();
      }
      this.isMentioningMember = !this.isMentioningMember;
    },
    toggleCardsSelection() {
      if (!this.isMentioningCard) {
        this.$refs["editor"].quill.insertText(
          this.$refs["editor"].quill.getSelection(true).index,
          "#"
        );
        this.$refs["editor"].quill.getModule("mention").onSomethingChange();
      } else {
        this.$refs["editor"].quill.deleteText(
          this.$refs["editor"].quill.getModule("mention").mentionCharPos,
          this.$refs["editor"].quill.getModule("mention").cursorPos -
            this.$refs["editor"].quill.getModule("mention").mentionCharPos
        );
        this.$refs["editor"].quill.getModule("mention").hideMentionList();
      }
      this._toggleCardsSelection();
    },
    handleCardDrop(event) {
      var payload = JSON.parse(event.dataTransfer.getData("text"));
      if (payload.type === "card")
        this.mention("card", {
          value: payload.content.name,
          href:
            location.origin +
            location.pathname +
            "#" +
            encodeURIComponent(payload.content.name)
        });
      this.toggleDragging(false);
      this._toggleCardsSelection();
    },
    handleEditorBlur(event) {
      if (
        this.body.content === "" ||
        (this.message && this.body.content === this.message.body.content)
      )
        this.cancelMessageEdit();
    },
    async transformMessageFromGraphToQuill(message) {
      const contentNode = document.createElement("div");
      contentNode.innerHTML = message.body.content;
      let mentionNodes = Array.from(contentNode.getElementsByTagName("at"));
      mentionNodes.forEach((mentionNode, mentionNodeIndex) => {
        const mentionUser = message.mentions[mentionNode.id].mentioned.user;
        mentionNode.innerHTML =
          '<span class="mention" data-index="0" data-denotation-char="@" data-id="0" data-value="' +
          mentionUser.displayName +
          '" data-mentionedUserId="' +
          mentionUser.id +
          '">﻿<span contenteditable="true"><span class="ql-mention-denotation-char">@</span>' +
          mentionUser.displayName +
          "</span>﻿</span>";
        mentionNode.parentNode.insertBefore(
          mentionNode.firstChild,
          mentionNode
        );
        mentionNode.parentNode.removeChild(mentionNode);
      });

      let re =
        "^" + location.origin + process.env.BASE_URL.slice(0, -1) + ".*#";
      mentionNodes = Array.from(
        contentNode.getElementsByTagName("a")
      ).filter(i => i.href.match(new RegExp(re + ".*")));
      mentionNodes.forEach((mentionNode, mentionNodeIndex) => {
        const mentionCardName = decodeURI(mentionNode.href).split("#")[1];
        mentionNode.innerHTML =
          '<span class="mention" data-index="0" data-denotation-char="#" data-id="0" data-value="' +
          mentionCardName +
          '" data-href="' +
          mentionNode.href +
          '">﻿<span contenteditable="false"><span class="ql-mention-denotation-char">#</span>' +
          mentionCardName +
          "</span>﻿</span>";

        mentionNode.parentNode.insertBefore(
          mentionNode.firstChild,
          mentionNode
        );
        mentionNode.parentNode.removeChild(mentionNode);
      });
      return contentNode.innerHTML;
    },
    transformMessageFromQuillToGraph(content) {
      let mentions = [];
      let contentNode = document.createElement("div");
      contentNode.innerHTML = content;
      let mentionNodes = Array.from(
        contentNode.getElementsByClassName("mention")
      );
      mentionNodes.forEach(mentionNode => {
        let denotationChar = mentionNode.getAttribute("data-denotation-char");
        if (denotationChar === "@") {
          let mentionsLookup = mentions.filter(
            i =>
              i.mentioned.user.id ===
              mentionNode.getAttribute("data-mentioned-user-id")
          );
          let mentionsIndex = -1;
          if (mentionsLookup.length > 0) mentionsIndex = mentionsLookup[0].id;
          else {
            mentionsIndex = mentions.length;
            mentions.push({
              id: mentions.length,
              mentionText: mentionNode.getAttribute("data-value"),
              mentioned: {
                user: {
                  displayName: mentionNode.getAttribute("data-value"),
                  id: mentionNode.getAttribute("data-mentioned-user-id"),
                  userIdentityType: "aadUser"
                }
              }
            });
          }
          mentionNode.innerHTML =
            '<at id="' +
            mentionsIndex +
            '">' +
            mentionNode.getAttribute("data-value") +
            "</at>";
        }
        if (denotationChar === "#") {
          mentionNode.innerHTML =
            '<a href="' +
            mentionNode.getAttribute("data-href") +
            '" target="_blank">' +
            mentionNode.getAttribute("data-value") +
            "</a>";
        }
        mentionNode.parentNode.insertBefore(
          mentionNode.firstChild,
          mentionNode
        );
        mentionNode.parentNode.removeChild(mentionNode);
      });
      return {
        body: {
          contentType: "html",
          content: contentNode.innerHTML
        },
        mentions: mentions
      };
    },
    trimMentionBadgeStyle(node, delta) {
      delta.forEach(e => {
        if (e.attributes) {
          e.attributes.color = "";
          e.attributes.background = "";
        }
      });
      return delta;
    }
  },
  async mounted() {
    if (this.isMobile || this.isAppleIOSWebView) {
      this.isActionsHovered = true;
    }

    if (this.message)
      this.body.content = await this.transformMessageFromGraphToQuill(
        this.message
      );
    this.$refs["editor"].quill.focus();
  },
  watch: {
    body: {
      handler() {
        this.isMemberMentioned =
          this.body.content.indexOf('data-denotation-char="@"') >= 0;
        this.isCardMentioned =
          this.body.content.indexOf('data-denotation-char="#"') >= 0;

        this.isMentioningMember = this.body.content
          .replace(/<\/?[^>]+(>|$)/g, "")
          .endsWith("@");
        this._toggleCardsSelection(
          this.body.content.replace(/<\/?[^>]+(>|$)/g, "").endsWith("#")
        );
      },
      deep: true
    },
    teamId() {
      this.members = null;
    },
    channelId() {
      this.members = null;
    }
  }
};
</script>
