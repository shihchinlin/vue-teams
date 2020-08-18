import * as msal from "@azure/msal-browser";
import { MSALAuthenticationProviderOptions } from "@microsoft/microsoft-graph-client/lib/src/MSALAuthenticationProviderOptions";
import * as MicrosoftGraphClient from "@microsoft/microsoft-graph-client";
import store from "@/store";
import { PresenceAvailabilities } from "../utils/enums";

const msalBaseConfig = {
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
        switch (level) {
          case msal.LogLevel.Error:
            console.error(message);
            return;
          case msal.LogLevel.Info:
            console.info(message);
            return;
          case msal.LogLevel.Verbose:
            console.debug(message);
            return;
          case msal.LogLevel.Warning:
            console.warn(message);
            return;
        }
      }
    }
  }
};

const loginRequestScopes = ["User.Read"];

const tokenRequestScopes = [
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
  "ChannelMessage.Delete"
];

class MSALAuthenticationProvider {
  constructor(msalApplication, options, account) {
    this.options = options;
    this.msalApplication = msalApplication;
    this.account = account;
  }

  async getAccessToken(authenticationProviderOptions) {
    const options = authenticationProviderOptions;
    let scopes;
    if (typeof options !== "undefined") {
      scopes = options.scopes;
    }
    if (typeof scopes === "undefined" || scopes.length === 0) {
      scopes = this.options.scopes;
    }
    if (scopes.length === 0) {
      const error = new Error();
      error.name = "EmptyScopes";
      error.message = "Scopes cannot be empty, Please provide a scopes";
      throw error;
    }
    if (this.msalApplication.getAccountByUsername(this.account.username)) {
      const popupTokenRequest = {
        scopes
      };
      const silentTokenRequest = {
        account: this.account,
        scopes
      };
      try {
        const authResponse = await this.msalApplication.acquireTokenSilent(
          silentTokenRequest
        );
        return authResponse.accessToken;
      } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
          try {
            const authResponse = await this.msalApplication.acquireTokenPopup(
              popupTokenRequest
            );
            return authResponse.accessToken;
          } catch (error) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      try {
        const popupTokenRequest = {
          scopes
        };
        const silentTokenRequest = {
          account: this.account,
          scopes
        };
        await this.msalApplication.loginPopup(popupTokenRequest);
        const authResponse = await this.msalApplication.acquireTokenSilent(
          silentTokenRequest
        );
        return authResponse.accessToken;
      } catch (error) {
        throw error;
      }
    }
  }
}

export const login = (tenantId, clientId, redirectUri) => {
  const msalConfig = Object.assign(msalBaseConfig, {
    auth: {
      clientId: clientId,
      authority: "https://login.microsoftonline.com/" + tenantId,
      redirectUri: redirectUri
    }
  });
  const msalApplication = new msal.PublicClientApplication(msalConfig);
  const loginRequest = Object.assign({}, { scopes: loginRequestScopes });
  return msalApplication.loginPopup(loginRequest).then(loginResponse => {
    if (loginResponse !== null) {
      const msalAuthenticationProvider = new MSALAuthenticationProvider(
        msalApplication,
        new MSALAuthenticationProviderOptions(tokenRequestScopes),
        loginResponse.account
      );
      const graphClient = MicrosoftGraphClient.Client.initWithMiddleware({
        authProvider: msalAuthenticationProvider
      });
      return [msalApplication, graphClient];
    } else {
      return Promise.reject(new Error("Not support multiple accounts"));
    }
  });
};

export const logout = async username => {
  const logoutRequest = {
    account: store.state.microsoft.msal.app.getAccountByUsername(username)
  };

  return store.state.microsoft.msal.app.logout(logoutRequest);
};

export const getUser = async (id = null) => {
  if (id)
    return await store.state.microsoft.graph.client.api(`/users/${id}`).get();
  else return await store.state.microsoft.graph.client.api("/me").get();
};

export const refreshPresences = async () => {
  return await store.state.microsoft.graph.client
    .api("/communications/getPresencesByUserId")
    .version("beta")
    .post({ ids: Object.keys(store.state.microsoft.presences) })
    .then(res => {
      for (let presence of res.value) {
        store.state.microsoft.presences[presence.id] =
          PresenceAvailabilities[presence.availability];
      }
    });
};

export const getTeam = async teamId => {
  return await store.state.microsoft.graph.client.api(`/teams/${teamId}`).get();
};

export const getChannel = async (teamId, channelId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}`)
    .get();
};

export const listChannelMembers = async (teamId, channelId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/members`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const listChannelMessages = async (teamId, channelId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const listMessageReplies = async (teamId, channelId, messageId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const getHostedContent = async (
  teamId,
  channelId,
  messageId,
  hostedContentId
) => {
  return await store.state.microsoft.graph.client
    .api(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}/hostedContents/${hostedContentId}/$value`
    )
    .version("beta")
    .get();
};

export const sendMessage = async (teamId, channelId, message) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .post(message);
};

export const replyToMessage = async (teamId, channelId, messageId, message) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
    .post(message);
};
