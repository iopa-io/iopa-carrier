"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCarrierContext = void 0;
const claimsIdentity_1 = require("./claimsIdentity");
const authenticationConstants_1 = require("./authenticationConstants");
/**
 * Validate the incoming Headers sent from the Carrier Service.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
async function authenticateCarrierContext(context, credentials) {
    const provider = context['iopa.Url'].searchParams.get('provider');
    if (provider === 'signalwire') {
        const body = await context['iopa.Body'];
        const accountSid = body.AccountSid;
        const token = context['iopa.Url'].searchParams.get('callback_token');
        const secret = await credentials.getAppSecret(accountSid);
        if (secret === token) {
            return new claimsIdentity_1.ClaimsIdentity([{ type: authenticationConstants_1.AppIdClaim, value: accountSid }], true);
        }
        throw new Error(`Unauthorized.`);
    }
    else if (provider === 'twilio') {
        const body = await context['iopa.Body'];
        const accountSid = body.AccountSid;
        const token = context['iopa.Url'].searchParams.get('callback_token');
        const secret = await credentials.getAppSecret(accountSid);
        const headersignature = context['iopa.Headers'].get('X-Twilio-Signature');
        console.log(`Twilio signature ${headersignature}`);
        if (secret === token) {
            return new claimsIdentity_1.ClaimsIdentity([{ type: authenticationConstants_1.AppIdClaim, value: accountSid }], true);
        }
        throw new Error(`Unauthorized.`);
    }
    else {
        throw new Error(`Provider ${provider} not supported`);
    }
}
exports.authenticateCarrierContext = authenticateCarrierContext;
//# sourceMappingURL=clientValidation.js.map