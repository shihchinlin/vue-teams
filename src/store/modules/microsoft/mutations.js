import {
  SIGNIN_GRAPH_SUCCESS,
  SIGNIN_GRAPH_FAILED,
  SIGNOUT_GRAPH_SUCCESS,
  SIGNOUT_GRAPH_FAILED,
} from "./types";
import { UserPresences, MicrosoftGraphStatus } from "../../../utils/enums";

export default {
  [SIGNIN_GRAPH_SUCCESS]: (state, payload) => {
    state.msal.app = payload[0];
    state.graph.client = payload[1];
    if (payload.length >= 3) {
      state.me = payload[2];
      state.presences[state.me.id] = UserPresences.PresenceUnknown;
    }
    state.status = MicrosoftGraphStatus.LoggedIn;
  },
  [SIGNIN_GRAPH_FAILED]: (state, error) => {
    state.error = error;
    state.status = MicrosoftGraphStatus.LoggedOut;
  },
  [SIGNOUT_GRAPH_SUCCESS]: (state) => {
    state.msal.app = undefined;
    state.graph.client = undefined;
    state.status = MicrosoftGraphStatus.LoggedOut;
  },
  [SIGNOUT_GRAPH_FAILED]: (state, error) => {
    state.error = error;
    state.status = MicrosoftGraphStatus.LoggedOut;
  },
};
