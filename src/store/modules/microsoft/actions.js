import { PublicClientApplication } from "@azure/msal-browser";

import {
  CHANGE_GRAPH_STATE,
  SIGNIN_GRAPH_REQUEST,
  SIGNIN_GRAPH_SUCCESS,
  SIGNIN_GRAPH_FAILED,
  SIGNOUT_GRAPH_REQUEST,
  SIGNOUT_GRAPH_SUCCESS,
  SIGNOUT_GRAPH_FAILED,
  REFRESH_PRESENCES,
  REFRESH_PRESENCES_SUCCESS
} from "./types";
import { MicrosoftStates } from "../../../utils/enums";
import { getUser, refreshPresences } from "../../../api/microsoft";
import {
  setClient,
  msalBaseConfig,
  loginRequestScopes,
  tokenRequestScopes,
  createGraphClient
} from "../../../msal-services";

export default {
  [SIGNIN_GRAPH_REQUEST]: async (
    { commit, state },
    { tokenScopes = tokenRequestScopes, authProvider = undefined }
  ) => {
    const { clientId, tenantId, redirectUri } = state.msal;
    let client;
    commit(CHANGE_GRAPH_STATE, MicrosoftStates.LoggingIn);
    try {
      if (!authProvider) {
        const msalApplication = new PublicClientApplication(
          Object.assign({}, msalBaseConfig, {
            auth: {
              clientId,
              authority: "https://login.microsoftonline.com/" + tenantId,
              redirectUri
            },
            cache: {
              cacheLocation: "localStorage"
            }
          })
        );
        // if (msalApplication.getAllAccounts().length > 0) {
        //   client = createGraphClient(
        //     msalApplication,
        //     msalApplication.getAllAccounts()[0],
        //     tokenScopes
        //   );
        // } else {
        //   const account = (
        //     await msalApplication.loginPopup({ scopes: loginRequestScopes })
        //   ).account;
        //   client = createGraphClient(msalApplication, account, tokenScopes);
        // }
        const account = (
          await msalApplication.loginPopup({ scopes: loginRequestScopes })
        ).account;
        client = createGraphClient(msalApplication, account, tokenScopes);
      } else {
        client = MicrosoftGraphClient.Client.initWithMiddleware({
          authProvider: authProvider
        });
      }
      setClient(client);
      const me = await getUser();
      commit(SIGNIN_GRAPH_SUCCESS, [client, me]);
      commit(CHANGE_GRAPH_STATE, MicrosoftStates.LoggedIn);
    } catch (error) {
      commit(CHANGE_GRAPH_STATE, MicrosoftStates.LoggedOut);
      commit(SIGNIN_GRAPH_FAILED, error);
    }
  },
  [SIGNOUT_GRAPH_REQUEST]: async ({ commit, state }) => {
    try {
      await state.graph.client.httpClient.middleware.authenticationProvider.msalApplication.logoutPopup();
      commit(SIGNOUT_GRAPH_SUCCESS);
      commit(CHANGE_GRAPH_STATE, MicrosoftStates.LoggedOut);
    } catch (error) {
      commit(SIGNOUT_GRAPH_FAILED, error);
      commit(CHANGE_GRAPH_STATE, MicrosoftStates.LoggedOut);
    }
  },
  [REFRESH_PRESENCES]: async ({ commit, state }) => {
    try {
      const response = await refreshPresences(Object.keys(state.presences));
      commit(REFRESH_PRESENCES_SUCCESS, response);
    } catch (error) {
      // no-op;
    }
  }
};
