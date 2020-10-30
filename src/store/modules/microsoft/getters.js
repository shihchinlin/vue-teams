export default {
  myId: state => {
    return state.me.id;
  },
  state: state => {
    return state.state;
  },
  presences: state => {
    return state.presences;
  }
};
