export default {
  id: state => {
    return state.me.id;
  },
  presences: state => {
    return state.presences;
  }
};
