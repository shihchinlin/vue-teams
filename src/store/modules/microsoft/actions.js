import {
  SIGNIN_GRAPH_REQUEST,
  SIGNIN_GRAPH_SUCCESS,
  SIGNIN_GRAPH_FAILED,
  SIGNOUT_GRAPH_REQUEST,
  SIGNOUT_GRAPH_SUCCESS,
  SIGNOUT_GRAPH_FAILED,
} from "./types";
import { MicrosoftGraphStatus } from "../../../utils/enums";
import { login, logout, getUser } from "../../../api/microsoft";

export default {
  [SIGNIN_GRAPH_REQUEST]: async (
    { commit, state },
    { tenantId, clientId, redirectUri }
  ) => {
    if (
      state.status !== MicrosoftGraphStatus.LoggedIn ||
      !state.msal.app ||
      !state.graph.client
    ) {
      state.status = MicrosoftGraphStatus.LoggingIn;
      login(tenantId, clientId, redirectUri)
        .then((client) => {
          commit(SIGNIN_GRAPH_SUCCESS, client);
          getUser()
            .then((me) => {
              commit(SIGNIN_GRAPH_SUCCESS, [...client, me]);
            })
            .catch((error) => {
              commit(SIGNIN_GRAPH_FAILED, error);
            });
          state.status = MicrosoftGraphStatus.LoggedIn;
        })
        .catch((error) => {
          commit(SIGNIN_GRAPH_FAILED, error);
        });
    }
  },
  [SIGNOUT_GRAPH_REQUEST]: async ({ commit, state }) => {
    logout(state.me.userPrincipalName)
      .then(() => {
        commit(SIGNOUT_GRAPH_SUCCESS);
      })
      .catch((error) => {
        commit(SIGNOUT_GRAPH_FAILED, error);
      });
  },
};
