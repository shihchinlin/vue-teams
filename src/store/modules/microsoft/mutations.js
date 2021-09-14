import {
  CHANGE_GRAPH_STATE,
  SIGNIN_GRAPH_SUCCESS,
  SIGNIN_GRAPH_FAILED,
  SIGNOUT_GRAPH_SUCCESS,
  SIGNOUT_GRAPH_FAILED,
  REFRESH_PRESENCES_SUCCESS
} from "./types";
import { PresenceAvailabilities, MicrosoftStates } from "../../../utils/enums";

export default {
  [CHANGE_GRAPH_STATE]: (state, payload) => {
    if (Object.values(MicrosoftStates).includes(payload)) state.state = payload;
  },
  [SIGNIN_GRAPH_SUCCESS]: (state, payload) => {
    state.graph.client = payload[0];
    if (payload.length >= 2) {
      state.me = payload[1];
      state.presences[state.me.id] = PresenceAvailabilities.PresenceUnknown;
    }
  },
  [SIGNIN_GRAPH_FAILED]: (state, error) => {
    state.error = error;
  },
  [SIGNOUT_GRAPH_SUCCESS]: state => {
    state.graph.client = undefined;
  },
  [SIGNOUT_GRAPH_FAILED]: (state, error) => {
    state.error = error;
  },
  [REFRESH_PRESENCES_SUCCESS]: (state, payload) => {
    for (let presence of payload.value) {
      state.presences[presence.id] =
        PresenceAvailabilities[presence.availability];
    }
  }
};
