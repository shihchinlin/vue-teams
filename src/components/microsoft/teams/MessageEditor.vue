<template>
  <div
    :class="[
      'message-editor',
      'position-relative',
      'mask-wrapper',
      $store.state.card.is_dragging ? 'droppable' : '',
    ]"
    @dragover.prevent=""
    @drop="handleCardDrop"
  >
    <div class="mask d-none text-nowrap overflow-hidden" />
    <VueQuillEditor
      ref="editor"
      v-model="body.content"
      :options="quilleditor_options"
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
          is_actions_hovered || is_card_mentioned || is_mentioning_card
            ? 'mx-1'
            : 'position-absolute invisible'
        "
        :variant="is_card_mentioned || is_mentioning_card ? 'danger' : 'white'"
        pill
        v-b-tooltip.hover="'標註報表'"
        @click="toggleCardsSelection()"
      >
        <i class="fa fa-hashtag"></i>
      </b-button>
      <b-button
        :class="
          is_actions_hovered ||
          is_member_mentioned ||
          is_mentioning_member ||
          is_card_mentioned ||
          is_mentioning_card
            ? 'mx-1'
            : 'position-absolute invisible'
        "
        :variant="
          is_member_mentioned || is_mentioning_member ? 'danger' : 'white'
        "
        pill
        v-b-tooltip.hover="'標註使用者'"
        @click="toggleMembersSelection()"
      >
        <i class="fa fa-at"></i>
      </b-button>
      <b-button
        :class="
          is_actions_hovered ||
          is_member_mentioned ||
          is_mentioning_member ||
          is_card_mentioned ||
          is_mentioning_card ||
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
        v-b-tooltip.hover="is_editing_message ? '完成' : '傳送'"
        @click="sendMessage()"
        :disabled="body.content === ''"
      >
        <i
          :class="['fa', is_editing_message ? 'fa-check' : 'fa-paper-plane']"
        ></i>
      </b-button>
    </b-button-group>
    <!-- <pre>{{ message }}</pre> -->
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import Quill from "quill";
import { quillEditor as VueQuillEditor } from "vue-quill-editor";
import Mention from "quill-mention";
import mixin from "@/mixins/Format";
import { MicrosoftGraphStatus, UserPresences } from "@/utils/enums";
import {
  sendMessage,
  replyToMessage,
  listChannelMembers,
} from "@/api/microsoft";
import quilleditor_options from "@/assets/json/quilleditor-options";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
Quill.register("modules/mention", Mention);

export default {
  mixins: [mixin],
  components: {
    VueQuillEditor,
  },
  props: {
    team_id: { type: String, required: true },
    channel_id: { type: String, required: true },
    message_id: { type: String, default: null },
    message: { type: Object, default: null },
  },
  data: function() {
    return {
      is_actions_hovered: false,
      is_mentioning_member: false,
      is_member_mentioned: false,
      is_card_mentioned: false,
      color_variants: ["info", "primary", "success", "warning", "danger"],
      members: null,
      body: {
        content: "",
      },
      mentions: [],
    };
  },
  computed: {
    ...mapGetters("session", ["isMobile", "is_apple_ios_webview"]),
    ...mapGetters({ is_mentioning_card: "card/is_selectable" }),
    quilleditor_options() {
      let modules = Object.assign({}, quilleditor_options.discuss.modules);
      modules.mention = {
        source: this.showMentionSuggestions,
        renderItem: this.renderMentionSuggestion,
        allowedChars: /^[a-zA-Z0-9_\-\p{Unified_Ideograph}]*$/u,
        mentionDenotationChars: ["@", "#"],
        defaultMenuOrientation: "top",
        dataAttributes: [
          "id",
          "value",
          "denotationChar",
          "mentioned_user_id",
          "href",
        ],
        onSelect: this.handleMentionSuggestionSelected,
        mentionContainerClass: "ql-mention-list-container",
        mentionListClass: "ql-mention-list list-group",
        listItemClass:
          "ql-mention-list-item list-group-item list-group-item-action p-2",
      };
      modules.clipboard = {
        matchers: [["span.mention", this.trimMentionBadgeStyle]],
      };
      let options = Object.assign({}, quilleditor_options.discuss);
      options.modules = modules;
      return options;
    },
    is_editing_message() {
      return this.message !== null;
    },
    message_draft() {
      return {
        body: {
          contentType: "html",
          content: this.body.content,
        },
        mentions: this.mentions,
      };
    },
  },
  methods: {
    ...mapMutations({ _toggleCardsSelection: "card/TOGGLE_MODE_SELECTABLE" }),
    mention(type, mention) {
      if (!this.$refs["editor"].quill.getModule("mention").mentionCharPos)
        this.$refs["editor"].quill.getModule("mention").mentionCharPos = 0;
      if (type === "member") {
        this.$refs["editor"].quill.getModule("mention").insertItem(
          Object.assign(
            {
              id: 0,
              denotationChar: "@",
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
              denotationChar: "#",
            },
            mention
          )
        );
      }
    },
    showMentionSuggestions: async function(keyword, renderList, mention_char) {
      let suggestions = [];
      if (mention_char === "@")
        suggestions = await this.suggestMembers(keyword);
      if (mention_char === "#") suggestions = this.suggestCards(keyword);
      renderList(suggestions);
    },
    renderMentionSuggestion(item) {
      if (item.mentioned_user_id) {
        return (
          '<div class="d-flex align-items-center"><span class="b-avatar mr-2 badge-' +
          this.color_variants[
            Object.keys(this.$store.state.microsoft.presences).indexOf(
              item.mentioned_user_id
            ) % this.color_variants.length
          ] +
          ' rounded-circle" style="width: 2.5em; height: 2.5em;"><span class="b-avatar-text"><span>' +
          this.formatNameInitials(item.value) +
          '</span></span></span><div class="d-flex flex-column align-items-start"> ' +
          item.value +
          ' <small class="d-block text-muted"> ' +
          item.email +
          " </small></div></div>"
        );
      } else if (item.href) {
        return (
          '<div class="d-flex align-items-center"><span class="b-avatar mr-2 badge-secondary rounded-circle" style="width: 2.5em; height: 2.5em;"><span class="b-avatar-text"><span class="fa fa-chart-bar"></span></span></span><div class="d-flex flex-column align-items-start text-truncate" style="width: 150px;"> ' +
          item.value +
          ' <small class="d-block text-muted text-truncate" style="width: 150px;"  title="' +
          this.$route.path +
          '"> ' +
          this.$route.path +
          " </small></div></div>"
        );
      }
    },
    handleMentionSuggestionSelected(item, insertItem) {
      this._toggleCardsSelection(false);
      this.is_mentioning_member = false;
      insertItem(item);
    },
    async suggestMembers(keyword) {
      if (this.members === null) {
        this.members = await listChannelMembers(this.team_id, this.channel_id);
        this.members.forEach((i) => {
          if (
            !Object.keys(this.$store.state.microsoft.presences).includes(
              i.userId
            )
          )
            this.$store.state.microsoft.presences[i.userId] =
              UserPresences.PresenceUnknown;
        });
        this.members.sort((a, b) => {
          let a_order = Object.keys(
            this.$store.state.microsoft.presences
          ).indexOf(a.userId);
          let b_order = Object.keys(
            this.$store.state.microsoft.presences
          ).indexOf(b.userId);
          return a_order - b_order;
        });
      }
      return this.members
        .filter(
          (member) =>
            (member.displayName.includes(keyword) ||
              member.email.includes(keyword)) &&
            member.userId !== this.$store.state.microsoft.me.id
        )
        .map((member, member_index) => {
          return {
            id: member_index,
            value: member.displayName,
            mentioned_user_id: member.userId,
            email: member.email,
          };
        });
    },
    suggestCards(keyword) {
      const cards = Array.from(
        document.querySelectorAll(".card-wrapper .card")
      ).map((card, card_index) => {
        return {
          id: card_index,
          value: card.getAttribute("name"),
          href: encodeURI(
            "https://localhost:8080/v2" +
              this.$route.path +
              "#" +
              card.getAttribute("name")
          ),
        };
      });
      return cards.filter((card) => card.value.includes(keyword));
    },
    sendMessage() {
      if (this.$store.state.microsoft.status === MicrosoftGraphStatus.LoggedIn)
        if (this.body.content !== "") {
          {
            if (this.message) {
              this.toastMessage(
                "尚未支援編輯討論訊息",
                "Microsoft Graph API目前尚不支援編輯Microsoft Teams訊息功能，請開啟Microsoft Teams桌面版或網頁版客戶端執行編輯。",
                "warning"
              );
            } else {
              let api = this.message_id
                ? replyToMessage(
                    this.team_id,
                    this.channel_id,
                    this.message_id,
                    this.transformMessageFromQuillToGraph(
                      this.body.content,
                      this.mentions
                    )
                  )
                : sendMessage(
                    this.team_id,
                    this.channel_id,
                    this.transformMessageFromQuillToGraph(
                      this.body.content,
                      this.mentions
                    )
                  );
              api.then((res) => {
                this.$emit("replied", res);
              });
              this.body.content = "";
              this.opened = false;
            }
          }
        }
    },
    cancelMessageEdit() {
      this.body.content = "";
      this.opened = false;
      if (this.is_mentioning_card) this._toggleCardsSelection(false);
      this.$emit("reset");
    },
    toggleActions(force = null) {
      if (force !== null) {
        if (force) this.is_actions_hovered = force;
        else
          setTimeout(() => {
            this.is_actions_hovered = force;
          }, 500);
      } else this.is_actions_hovered = !this.is_actions_hovered;
      if (
        !this.is_actions_hovered &&
        (this.isMobile || this.is_apple_ios_webview)
      )
        this.is_actions_hovered = true;
    },
    toggleMembersSelection() {
      if (!this.is_mentioning_member) {
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
      this.is_mentioning_member = !this.is_mentioning_member;
    },
    toggleCardsSelection() {
      if (!this.is_mentioning_card) {
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
          href: encodeURI(
            "https://localhost:8080/v2" +
              this.$route.path +
              "#" +
              payload.content.name
          ),
        });
      this.$store.state.card.is_dragging = false;
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
      const content_node = document.createElement("div");
      content_node.innerHTML = message.body.content;
      let mention_nodes = Array.from(content_node.getElementsByTagName("at"));
      mention_nodes.forEach((mention_node, mention_node_index) => {
        const mention_user = message.mentions[mention_node.id].mentioned.user;
        mention_node.innerHTML =
          '<span class="mention" data-index="0" data-denotation-char="@" data-id="0" data-value="' +
          mention_user.displayName +
          '" data-mentioned_user_id="' +
          mention_user.id +
          '">﻿<span contenteditable="true"><span class="ql-mention-denotation-char">@</span>' +
          mention_user.displayName +
          "</span>﻿</span>";
        mention_node.parentNode.insertBefore(
          mention_node.firstChild,
          mention_node
        );
        mention_node.parentNode.removeChild(mention_node);
      });
      mention_nodes = Array.from(
        content_node.getElementsByTagName("a")
      ).filter((i) => i.href.match(/https:\/\/localhost:8080\/v2\/.*#.*/));
      mention_nodes.forEach((mention_node, mention_node_index) => {
        const mention_card_name = decodeURI(mention_node.href).split("#")[1];
        mention_node.innerHTML =
          '<span class="mention" data-index="0" data-denotation-char="#" data-id="0" data-value="' +
          mention_card_name +
          '" data-href="' +
          mention_node.href +
          '">﻿<span contenteditable="false"><span class="ql-mention-denotation-char">#</span>' +
          mention_card_name +
          "</span>﻿</span>";

        mention_node.parentNode.insertBefore(
          mention_node.firstChild,
          mention_node
        );
        mention_node.parentNode.removeChild(mention_node);
      });
      return content_node.innerHTML;
    },
    transformMessageFromQuillToGraph(content) {
      let mentions = [];
      let content_node = document.createElement("div");
      content_node.innerHTML = content;
      let mention_nodes = Array.from(
        content_node.getElementsByClassName("mention")
      );
      mention_nodes.forEach((mention_node) => {
        let denotation_char = mention_node.getAttribute("data-denotation-char");
        if (denotation_char === "@") {
          let mentions_lookup = mentions.filter(
            (i) =>
              i.mentioned.user.id ===
              mention_node.getAttribute("data-mentioned_user_id")
          );
          let mentions_index = -1;
          if (mentions_lookup.length > 0)
            mentions_index = mentions_lookup[0].id;
          else {
            mentions_index = mentions.length;
            mentions.push({
              id: mentions.length,
              mentionText: mention_node.getAttribute("data-value"),
              mentioned: {
                user: {
                  displayName: mention_node.getAttribute("data-value"),
                  id: mention_node.getAttribute("data-mentioned_user_id"),
                  userIdentityType: "aadUser",
                },
              },
            });
          }
          mention_node.innerHTML =
            '<at id="' +
            mentions_index +
            '">' +
            mention_node.getAttribute("data-value") +
            "</at>";
        }
        if (denotation_char === "#") {
          mention_node.innerHTML =
            '<a href="' +
            mention_node.getAttribute("data-href") +
            '" target="_blank">' +
            mention_node.getAttribute("data-value") +
            "</a>";
        }
        mention_node.parentNode.insertBefore(
          mention_node.firstChild,
          mention_node
        );
        mention_node.parentNode.removeChild(mention_node);
      });
      return {
        body: {
          contentType: "html",
          content: content_node.innerHTML,
        },
        mentions: mentions,
      };
    },
    trimMentionBadgeStyle(node, delta) {
      delta.forEach((e) => {
        if (e.attributes) {
          e.attributes.color = "";
          e.attributes.background = "";
        }
      });
      return delta;
    },
  },
  async mounted() {
    if (this.isMobile || this.is_apple_ios_webview) {
      this.is_actions_hovered = true;
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
        this.is_member_mentioned =
          this.body.content.indexOf('data-denotation-char="@"') >= 0;
        this.is_card_mentioned =
          this.body.content.indexOf('data-denotation-char="#"') >= 0;

        this.is_mentioning_member = this.body.content
          .replace(/<\/?[^>]+(>|$)/g, "")
          .endsWith("@");
        this._toggleCardsSelection(
          this.body.content.replace(/<\/?[^>]+(>|$)/g, "").endsWith("#")
        );
      },
      deep: true,
    },
    team_id() {
      this.members = null;
    },
    channel_id() {
      this.members = null;
    },
  },
};
</script>
