export const msalBaseConfig = {
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        // switch (level) {
        //   case msal.LogLevel.Error:
        //     console.error(message);
        //     return;
        //   case msal.LogLevel.Info:
        //     console.info(message);
        //     return;
        //   case msal.LogLevel.Verbose:
        //     console.debug(message);
        //     return;
        //   case msal.LogLevel.Warning:
        //     console.warn(message);
        //     return;
        // }
      }
    }
  }
};

export const loginRequestScopes = ["User.Read"];

export const tokenRequestScopes = [
  "User.Read",
  "User.ReadWrite.All",
  "Group.Read.All",
  "Group.ReadWrite.All",
  "Presence.Read.All",
  "Directory.Read.All",
  "Directory.ReadWrite.All",
  "Directory.AccessAsUser.All",
  "Channel.ReadBasic.All",
  "ChannelMessage.Read.All",
  "ChannelMessage.Send",
  "ChannelMessage.Edit",
  "ChannelMessage.Delete",
  // "Calendars.ReadWrite"
];
