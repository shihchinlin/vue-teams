import { TOGGLE_MODE_SELECTABLE } from "./types";

export default {
  [TOGGLE_MODE_SELECTABLE]: (state, force = null) => {
    if (force !== null) state.capabilities.selectable = force;
    else state.capabilities.selectable = !state.capabilities.selectable;
  }
};
