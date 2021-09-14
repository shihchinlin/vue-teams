export default {
  myId: state => {
    return state.me.id;
  },
  state: state => {
    return state.state;
  },
  clientId: state => state.msal.clientId,
  tenantId: state => state.msal.tenantId,
  redirectUri: state => state.msal.redirectUri,
  presences: state => {
    return state.presences;
  }
};
