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

class ImplicitMSALAuthenticationProvider {
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

class PageIterator {
  constructor(client, pageCollection, callback) {
    this.client = client;
    this.collection = pageCollection.value;
    this.nextLink = pageCollection["@odata.nextLink"];
    this.deltaLink = pageCollection["@odata.deltaLink"];
    this.callback = callback;
    this.complete = false;
  }

  iterationHelper() {
    if (this.collection === undefined) {
      return false;
    }
    let advance = true;
    while (advance && this.collection.length !== 0) {
      const item = this.collection.shift();
      advance = this.callback(item);
    }
    return advance;
  }

  async fetchAndUpdateNextPageData() {
    try {
      const response = await this.client.api(this.nextLink).get();
      this.collection = response.value;
      this.nextLink = response["@odata.nextLink"];
      this.deltaLink = response["@odata.deltaLink"];
    } catch (error) {
      throw error;
    }
  }

  getDeltaLink() {
    return this.deltaLink;
  }

  async iterate() {
    try {
      let advance = this.iterationHelper();
      while (advance) {
        if (this.nextLink !== undefined) {
          await this.fetchAndUpdateNextPageData();
          advance = this.iterationHelper();
        } else {
          advance = false;
        }
      }
      if (this.nextLink === undefined && this.collection.length === 0) {
        this.complete = true;
      }
    } catch (error) {
      throw error;
    }
  }

  async resume() {
    try {
      return this.iterate();
    } catch (error) {
      throw error;
    }
  }

  isComplete() {
    return this.complete;
  }
}

export const login = (
  tenantId,
  clientId,
  redirectUri,
  authProvider = undefined
) => {
  if (!authProvider) {
    const msalConfig = Object.assign(msalBaseConfig, {
      auth: {
        clientId: clientId,
        authority: "https://login.microsoftonline.com/" + tenantId,
        redirectUri: redirectUri
      },
      cache: {
        cacheLocation: "localStorage"
      }
    });
    const msalApplication = new msal.PublicClientApplication(msalConfig);
    const loginRequest = Object.assign({}, { scopes: loginRequestScopes });
    return msalApplication.loginPopup(loginRequest).then(loginResponse => {
      if (loginResponse !== null) {
        const msalAuthenticationProvider = new ImplicitMSALAuthenticationProvider(
          msalApplication,
          new MSALAuthenticationProviderOptions(tokenRequestScopes),
          loginResponse.account
        );
        const graphClient = MicrosoftGraphClient.Client.initWithMiddleware({
          authProvider: msalAuthenticationProvider
        });
        return graphClient;
      } else {
        return Promise.reject(new Error("Not support multiple accounts"));
      }
    });
  } else {
    const graphClient = MicrosoftGraphClient.Client.initWithMiddleware({
      authProvider: authProvider
    });
    return new Promise(resolve => {
      resolve(graphClient);
    });
  }
};

export const logout = async username => {
  const logoutRequest = {
    account: store.state.microsoft.graph.client.httpClient.middleware.authenticationProvider.msalApplication.getAccountByUsername(
      username
    )
  };

  return store.state.microsoft.graph.client.httpClient.middleware.authenticationProvider.msalApplication.logout(
    logoutRequest
  );
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

export const searchTeamsByName = async teamNameRegExp => {
  const teams = await store.state.microsoft.graph.client
    .api(`/me/joinedTeams`)
    .get()
    .then(res => res.value);
  return teams.filter(e => teamNameRegExp.test(e.displayName));
};

export const getChannel = async (teamId, channelId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}`)
    .get();
};

export const searchTeamChannelsByName = async (
  teamNameRegExp,
  channelNameRegExp
) => {
  const foundTeams = await searchTeamsByName(teamNameRegExp);
  if (foundTeams.length) {
    var foundTeamChannels = [];
    for (var foundTeam of foundTeams) {
      const channels = await store.state.microsoft.graph.client
        .api(`/teams/${foundTeam.id}/channels`)
        .get()
        .then(res => res.value);
      const foundChannels = channels.filter(e =>
        channelNameRegExp.test(e.displayName)
      );
      foundChannels.forEach(foundChannel => {
        foundTeamChannels.push({ team: foundTeam, channel: foundChannel });
      });
    }
    return foundTeamChannels;
  } else return [];
};

export const listChannelMembers = async (teamId, channelId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/members`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const listChannelMessagesIterator = async (
  teamId,
  channelId,
  callback
) => {
  let res = await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages`)
    .version("beta")
    .get();
  let pageIterator = new PageIterator(
    store.state.microsoft.graph.client,
    res,
    callback
  );
  pageIterator.iterate();
  return pageIterator;
};

export const listChannelMessages = async (teamId, channelId, top = null) => {
  return await store.state.microsoft.graph.client
    .api(
      `/teams/${teamId}/channels/${channelId}/messages` +
        (top ? `?$top=${top}` : "")
    )
    .version("beta")
    .get()
    .then(res => res.value);
};

export const getMessage = async (teamId, channelId, messageId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
    .version("beta")
    .get();
};

export const listMessageReplies = async (teamId, channelId, messageId) => {
  return await store.state.microsoft.graph.client
    .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`)
    .version("beta")
    .get()
    .then(res => res.value);
};

export const getHostedContent = async uri => {
  const endpoint = uri.replace("https://graph.microsoft.com/beta", "");
  return await store.state.microsoft.graph.client
    .api(endpoint)
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
