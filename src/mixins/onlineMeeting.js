import {
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  getOnlineMeetingByUrl
} from "../api/microsoft";
import { replaceOnlineMeetingBodyContent } from "../utils/utils";

export default {
  props: {
    id: { type: String, default: null },
    subject: { type: String, default: "" },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    location: { type: String, default: "" },
    content: { type: String, default: "" },
    attendees: { type: Array, default: () => [] },
    attendeesCC: { type: Array, default: () => [] },
    cancelComment: { type: String, default: "" }
  },
  methods: {
    _generateOnlineMeetingPayload() {
      return {
        subject: this.subject,
        start: {
          dateTime: this.start,
          timeZone: "Asia/Taipei"
        },
        end: {
          dateTime: this.end,
          timeZone: "Asia/Taipei"
        },
        location: {
          displayName: this.location
        },
        body: {
          contentType: "HTML",
          content: `
            <div id="content-container">
              ${this.content}
            </div>
          `
        },
        isOnlineMeeting: true,
        allowNewTimeProposals: false,
        onlineMeetingProvider: "teamsForBusiness",
        attendees: [].concat(
          this.attendees.map(a => ({
            emailAddress: {
              address: a.address,
              name: a.name
            },
            type: "required"
          })),
          this.attendeesCC.map(a => ({
            emailAddress: {
              address: a.address,
              name: a.name
            },
            type: "optional"
          }))
        )
      };
    },
    async getOnlineMeeting() {
      try {
        const response = await getEvent(this.id);
        this.$emit("get-success", response);
        return response;
      } catch (error) {
        this.$emit("get-failed", error);
        return null;
      }
    },
    async createOnlineMeeting() {
      const payload = this._generateOnlineMeetingPayload();
      try {
        const event = await createEvent(payload);
        const onlineMeeting = await getOnlineMeetingByUrl(event.onlineMeeting.joinUrl);
        this.$emit("create-success", {
          id: onlineMeeting.value[0].id,
          eventId: event.id,
          url: event.onlineMeeting.joinUrl
        });
      } catch (error) {
        this.$emit("create-failed", error);
      }
    },
    async updateOnlineMeeting() {
      const existedMeeting = await this.getOnlineMeeting();
      if (!existedMeeting) {
        this.$emit("update-failed", "Could not get existed onlineMeeting.");
      }
      const content = replaceOnlineMeetingBodyContent(
        existedMeeting.body.content,
        this.content,
        "#content-container"
      );
      const payload = Object.assign({}, this._generateOnlineMeetingPayload(), {
        body: {
          contentType: "HTML",
          content
        }
      });
      try {
        const response = await updateEvent(this.id, payload);
        this.$emit("update-success", {
          id: response.id,
          url: response.onlineMeeting.joinUrl
        });
      } catch (error) {
        this.$emit("update-failed", error);
      }
    },
    async cancelOnlineMeeting() {
      try {
        await cancelEvent(this.id, { comment: this.cancelComment });
        this.$emit("cancel-success");
      } catch (error) {
        this.$emit("cancel-failed", error);
      }
    }
  }
};
