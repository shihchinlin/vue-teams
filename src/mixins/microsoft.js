import { mapGetters, mapActions, mapMutations } from "vuex";

import { MicrosoftStates } from "../utils/enums";
import {
  SIGNIN_GRAPH_REQUEST,
  SIGNOUT_GRAPH_REQUEST,
  CHANGE_GRAPH_STATE
} from "../store/modules/microsoft/types";

export default {
  data() {
    return {
      MicrosoftStates
    };
  },
  computed: {
    ...mapGetters("microsoft", {
      clientId: "clientId",
      tenantId: "tenantId",
      redirectUri: "redirectUri",
      microsoftLoginState: "state"
    })
  },
  methods: {
    ...mapActions("microsoft", {
      loginToMicrosoft: SIGNIN_GRAPH_REQUEST,
      logoutFromMicrosoft: SIGNOUT_GRAPH_REQUEST
    }),
    ...mapMutations("microsoft", {
      changeGraphState: CHANGE_GRAPH_STATE
    })
  }
};
