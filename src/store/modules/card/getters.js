export default {
  isCardSelectable: state => {
    return state.capabilities.selectable;
  },
  isCardDragging: state => {
    return state.dragging;
  }
};
