export default {
  myId: state => {
    return state.me.id;
  },
  status: state => {
    return state.status;
  },
  presences: state => {
    return state.presences;
  }
};
