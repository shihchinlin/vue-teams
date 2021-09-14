import * as msal from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";

export class ImplicitMSALAuthenticationProvider {
  constructor(msalApplication, options, account) {
    this.msalApplication = msalApplication;
    this.options = options;
    this.account = account;
  }

  async getAccessToken(authenticationProviderOptions) {
    const options = authenticationProviderOptions;
    let scopes;
    if (typeof options !== "undefined") {
      scopes = options.scopes;
    }
    if (typeof scopes === "undefined" || scopes.length === 0) {
      scopes = this.options.scopes;
    }
    if (scopes.length === 0) {
      const error = new Error();
      error.name = "EmptyScopes";
      error.message = "Scopes cannot be empty, Please provide a scopes";
      throw error;
    }
    if (this.msalApplication.getAccountByUsername(this.account.username)) {
      const popupTokenRequest = {
        scopes
      };
      const silentTokenRequest = {
        account: this.account,
        scopes
      };
      try {
        const authResponse = await this.msalApplication.acquireTokenSilent(
          silentTokenRequest
        );
        return authResponse.accessToken;
      } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
          try {
            const authResponse = await this.msalApplication.acquireTokenPopup(
              popupTokenRequest
            );
            return authResponse.accessToken;
          } catch (error) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      try {
        const popupTokenRequest = {
          scopes
        };
        const silentTokenRequest = {
          account: this.account,
          scopes
        };
        await this.msalApplication.loginPopup(popupTokenRequest);
        const authResponse = await this.msalApplication.acquireTokenSilent(
          silentTokenRequest
        );
        return authResponse.accessToken;
      } catch (error) {
        throw error;
      }
    }
  }
}

export const createGraphClient = (msalApplication, account, scopes) => {
  return Client.initWithMiddleware({
    authProvider: new ImplicitMSALAuthenticationProvider(
      msalApplication,
      { scopes },
      account
    )
  });
};
