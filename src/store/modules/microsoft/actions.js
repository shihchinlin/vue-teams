import {
  CHANGE_GRAPH_STATUS,
  SIGNIN_GRAPH_REQUEST,
  SIGNIN_GRAPH_SUCCESS,
  SIGNIN_GRAPH_FAILED,
  SIGNOUT_GRAPH_REQUEST,
  SIGNOUT_GRAPH_SUCCESS,
  SIGNOUT_GRAPH_FAILED
} from "./types";
import { MicrosoftStatus } from "../../../utils/enums";
import { login, logout, getUser } from "../../../api/microsoft";

export default {
  [SIGNIN_GRAPH_REQUEST]: async (
    { commit, state },
    { tenantId, clientId, redirectUri }
  ) => {
    if (
      state.status !== MicrosoftStatus.LoggedIn ||
      !state.msal.app ||
      !state.graph.client
    ) {
      commit(CHANGE_GRAPH_STATUS, MicrosoftStatus.LoggingIn);
      login(tenantId, clientId, redirectUri)
        .then(client => {
          commit(SIGNIN_GRAPH_SUCCESS, client);
          getUser().then(me => {
            commit(SIGNIN_GRAPH_SUCCESS, [...client, me]);
            commit(CHANGE_GRAPH_STATUS, MicrosoftStatus.LoggedIn);
          });
        })
        .catch(error => {
          commit(CHANGE_GRAPH_STATUS, MicrosoftStatus.LoggedOut);
          commit(SIGNIN_GRAPH_FAILED, error);
        });
    }
  },
  [SIGNOUT_GRAPH_REQUEST]: async ({ commit, state }) => {
    logout(state.me.userPrincipalName)
      .then(() => {
        commit(SIGNOUT_GRAPH_SUCCESS);
        commit(CHANGE_GRAPH_STATUS, MicrosoftStatus.LoggedOut);
      })
      .catch(error => {
        commit(CHANGE_GRAPH_STATUS, MicrosoftStatus.LoggedOut);
        commit(SIGNOUT_GRAPH_FAILED, error);
      });
  }
};
