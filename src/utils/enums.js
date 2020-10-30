export const MicrosoftStates = Object.freeze({
  LoggedOut: "LoggedOut",
  LoggingIn: "LoggingIn",
  LoggedIn: "LoggedIn",
  Forbidden: "Forbidden",
  GatewayTimeout: "GatewayTimeout",
  InternalServerError: "InternalServerError",
  ServiceUnavailable: "ServiceUnavailable",
  Unauthorized: "Unauthorized"
});

export const PresenceAvailabilities = Object.freeze({
  Available: { value: "Available", colorVariant: "success" },
  AvailableIdle: { value: "AvailableIdle", colorVariant: "success" },
  Away: { value: "Away", colorVariant: "warning" },
  BeRightBack: { value: "BeRightBack", colorVariant: "warning" },
  Busy: { value: "Busy", colorVariant: "danger" },
  BusyIdle: { value: "BusyIdle", colorVariant: "danger" },
  DoNotDisturb: { value: "DoNotDisturb", colorVariant: "danger" },
  Offline: { value: "Offline", colorVariant: "secondary" },
  PresenceUnknown: { value: "PresenceUnknown", colorVariant: "secondary" }
});

export const MessageReactions = {
  Like: {
    icon: "fa fa-thumbs-up",
    colorVariant: "warning"
  },
  Heart: {
    icon: "fa fa-heart",
    colorVariant: "danger"
  },
  Laugh: {
    icon: "fa fa-laugh",
    colorVariant: "warning"
  },
  Surprised: {
    icon: "fa fa-surprise",
    colorVariant: "warning"
  },
  Sad: {
    icon: "fa fa-frown",
    colorVariant: "warning"
  },
  Angry: {
    icon: "fa fa-angry",
    colorVariant: "danger"
  }
};
