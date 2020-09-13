import { IopaContext } from 'iopa-types'
import { ICredentialProvider } from './credentialProvider'
import { ClaimsIdentity } from './claimsIdentity'
import { AppIdClaim } from './authenticationConstants'

/**
 * Validate the incoming Headers sent from the Carrier Service.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export async function authenticateCarrierContext(
    context: IopaContext,
    credentials: ICredentialProvider
): Promise<ClaimsIdentity> {
    const provider = context['iopa.Url'].searchParams.get('provider')

    if (provider === 'signalwire') {
        const body = await context['iopa.Body']
        const accountSid = body.AccountSid
        const token = context['iopa.Url'].searchParams.get('callback_token')
        const secret = await credentials.getAppSecret(accountSid)

        if (secret === token) {
            return new ClaimsIdentity(
                [{ type: AppIdClaim, value: accountSid }],
                true
            )
        }

        throw new Error(`Unauthorized.`)
    } else if (provider === 'twilio') {
        const body = await context['iopa.Body']
        const accountSid = body.AccountSid
        const token = context['iopa.Url'].searchParams.get('callback_token')
        const secret = await credentials.getAppSecret(accountSid)

        const headersignature = context['iopa.Headers'].get(
            'X-Twilio-Signature'
        )

        console.log(`Twilio signature ${headersignature}`)

        if (secret === token) {
            return new ClaimsIdentity(
                [{ type: AppIdClaim, value: accountSid }],
                true
            )
        }

        throw new Error(`Unauthorized.`)
    } else {
        throw new Error(`Provider ${provider} not supported`)
    }
}
