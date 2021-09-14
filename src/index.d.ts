import Vue, { VueConstructor } from "vue";
import { Store } from "vuex";

export const enum MicrosoftStates {
  LoggedOut = "LoggedOut",
  LoggingIn = "LoggingIn",
  LoggedIn = "LoggedIn",
  Forbidden = "Forbidden",
  GatewayTimeout = "GatewayTimeout",
  InternalServerError = "InternalServerError",
  ServiceUnavailable = "ServiceUnavailable",
  Unauthorized = "Unauthorized"
}

type CombinedVueInstance<
  Instance extends Vue,
  Props,
  Data,
  Methods,
  Computed
> = Props & Data & Methods & Computed & Instance;

type ExtendedVue<
  Instance extends Vue,
  Props,
  Data = {},
  Methods = {},
  Computed = {}
> = VueConstructor<
  CombinedVueInstance<Instance, Data, Methods, Computed, Props> & Vue
>;

declare const Channel: ExtendedVue<
  Vue,
  {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    teamId: string;
    channelId: string;
    customizedUrlPrefix: string;
  }
>;

declare const Message: ExtendedVue<
  Vue,
  {
    teamId: string;
    channelId: string;
    customizedUrlPrefix: string;
    members: any[];
    message: object;
  }
>;

declare const MessageEditor: ExtendedVue<
  Vue,
  {
    teamId: string;
    channelId: string;
    messageId: string;
    customizedUrlPrefix: string;
    members: any[];
    message: object;
  }
>;

export { Channel, Message, MessageEditor };

export const MicrosoftMixin: {
  data: () => { MicrosoftStates: typeof MicrosoftStates };
  computed: {
    microsoftLoginState: keyof typeof MicrosoftStates;
    clientId: string;
    tenantId: string;
    redirectUri: string;
  };
  methods: {
    loginToMicrosoft: (options?: {
      tokenScopes?: string[];
      authProvider?: object;
    }) => Promise<void>;
    logoutFromMicrosoft: () => Promise<void>;
    changeGraphState: (state: keyof typeof MicrosoftStates) => void;
  };
};

type AttendeePropType = {
  address: string;
  name?: string;
};

export const OnlineMeetingMixin: {
  props: {
    id: string;
    subject: string;
    start: string;
    end: string;
    location: string;
    content: string;
    attendees: AttendeePropType[];
    cc: AttendeePropType[];
    cancelComment: string;
  };
  methods: {
    getOnlineMeeting: () => Promise<any>;
    createOnlineMeeting: () => Promise<void>;
    updateOnlineMeeting: () => Promise<void>;
    cancelOnlineMeeting: () => Promise<void>;
  };
};

export const registerMicrosoftModule: (store: Store, state: object) => void;

export const registerCardModule: (store: Store, state: object) => void;

export * from "./api/microsoft";
