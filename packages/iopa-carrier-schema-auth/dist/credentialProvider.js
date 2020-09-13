"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCredentialProvider = void 0;
const url = require("url");
class SimpleCredentialProvider {
    constructor(appId, appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
    }
    /**
     * Validate AppId.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<boolean>} true if it is a valid AppId
     */
    isValidAppId(appId) {
        return Promise.resolve(this.appId === appId);
    }
    /**
     * Get the app password for a given bot appId, if it is not a valid appId, return Null
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<string|null>} password or null for invalid appid
     */
    getAppSecret(appId) {
        return Promise.resolve(this.appId === appId ? this.appSecret : null);
    }
    /**
     * Checks if  authentication is disabled.
     * Return true if authentication is disabled.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @returns {Promise<boolean>} true if bot authentication is disabled.
     */
    isAuthenticationDisabled() {
        if (process.env.NODE_ENV === 'localhost' ||
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'test') {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
    async signRequest(url, request) {
        if (this.shouldSetToken(url)) {
            const token = btoa(`${this.appId}:${this.appSecret}`);
            if (request.headers.set) {
                request.headers.set('authorization', `Basic ${token}`);
            }
            else {
                request.headers.authorization = `Basic ${token}`;
            }
        }
    }
    shouldSetToken(url) {
        return SimpleCredentialProvider.isTrustedServiceUrl(url);
    }
    /**
     * Checks if the service url is for a trusted host or not.
     * @param  {string} serviceUrl The service url
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    static isTrustedServiceUrl(serviceUrl) {
        try {
            const uri = url.parse(serviceUrl);
            if (uri.host) {
                return SimpleCredentialProvider.isTrustedUrl(uri.host);
            }
        }
        catch (e) {
            // tslint:disable-next-line:no-console
            console.error('Error in isTrustedServiceUrl', e);
        }
        return false;
    }
    static isTrustedUrl(uri) {
        const expiration = SimpleCredentialProvider.trustedHostNames.get(uri);
        if (expiration) {
            // check if the trusted service url is still valid
            return expiration.getTime() > Date.now() - 300000; // 5 Minutes
        }
        return false;
    }
}
exports.SimpleCredentialProvider = SimpleCredentialProvider;
SimpleCredentialProvider.trustedHostNames = new Map([
    [process.env.SIGNALWIRE_SPACE, new Date(8640000000000000)],
    ['api.twilio.com', new Date(8640000000000000)],
]);
//# sourceMappingURL=credentialProvider.js.map