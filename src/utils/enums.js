export const MicrosoftGraphStatus = Object.freeze({
  LoggedOut: "LoggedOut",
  LoggingIn: "LoggingIn",
  LoggedIn: "LoggedIn",
  Forbidden: "Forbidden",
  GatewayTimeout: "GatewayTimeout",
  InternalServerError: "InternalServerError",
  ServiceUnavailable: "ServiceUnavailable",
  Unauthorized: "Unauthorized"
});

export const UserPresences = Object.freeze({
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
