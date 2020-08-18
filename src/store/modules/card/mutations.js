import { TOGGLE_SELECTABLE, TOGGLE_DRAGGING } from "./types";

export default {
  [TOGGLE_SELECTABLE]: (state, force = null) => {
    if (force !== null) state.capabilities.selectable = force;
    else state.capabilities.selectable = !state.capabilities.selectable;
  },
  [TOGGLE_DRAGGING]: (state, dragging) => {
    state.dragging = dragging;
  }
};
