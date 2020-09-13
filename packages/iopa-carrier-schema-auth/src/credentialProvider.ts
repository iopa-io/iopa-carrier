import * as url from 'url'

/**
 * CredentialProvider interface. This interface allows Capabilities to provide their own
 * implementation of what is, and what is not, a valid appId and password. This is
 * useful in the case of multi-tenant bots, where the bot may need to call
 * out to a service to determine if a particular appid/password pair
 * is valid.
 *
 * For Single Tenant bots (the vast majority) the simple static providers
 * are sufficient.
 */
export interface ICredentialProvider {
    readonly appId: string

    /**
     * Validate AppId.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<boolean>} true if it is a valid AppId
     */
    isValidAppId(appId: string): Promise<boolean>

    /**
     * Get the app password for a given bot appId, if it is not a valid appId, return Null
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<string|null>} password or null for invalid appid
     */
    getAppSecret(appId?: string): Promise<string | null>

    /**
     * Checks if bot authentication is disabled.
     * Return true if bot authentication is disabled.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @returns {Promise<boolean>} true if bot authentication is disabled.
     */
    isAuthenticationDisabled(): Promise<boolean>

    signRequest(url: string, request: { headers: any }): Promise<void>
}

export class SimpleCredentialProvider implements ICredentialProvider {
    private static readonly trustedHostNames: Map<string, Date> = new Map<
        string,
        Date
    >([
        [process.env.SIGNALWIRE_SPACE, new Date(8640000000000000)], // Date.MAX_VALUE,
        ['api.twilio.com', new Date(8640000000000000)],
    ])

    public readonly appId: string

    private readonly appSecret: string

    constructor(appId: string, appSecret: string) {
        this.appId = appId
        this.appSecret = appSecret
    }

    /**
     * Validate AppId.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<boolean>} true if it is a valid AppId
     */
    public isValidAppId(appId: string): Promise<boolean> {
        return Promise.resolve(this.appId === appId)
    }

    /**
     * Get the app password for a given bot appId, if it is not a valid appId, return Null
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @param  {string} appId bot appid
     * @returns {Promise<string|null>} password or null for invalid appid
     */
    public getAppSecret(appId: string): Promise<string | null> {
        return Promise.resolve(this.appId === appId ? this.appSecret : null)
    }

    /**
     * Checks if  authentication is disabled.
     * Return true if authentication is disabled.
     *
     * This method is async to enable custom implementations
     * that may need to call out to serviced to validate the appId / password pair.
     * @returns {Promise<boolean>} true if bot authentication is disabled.
     */
    public isAuthenticationDisabled(): Promise<boolean> {
        if (
            process.env.NODE_ENV === 'localhost' ||
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'test'
        ) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    public async signRequest(
        url: string,
        request: { headers: any }
    ): Promise<void> {
        if (this.shouldSetToken(url)) {
            const token = btoa(`${this.appId}:${this.appSecret}`)

            if (request.headers.set) {
                request.headers.set('authorization', `Basic ${token}`)
            } else {
                request.headers.authorization = `Basic ${token}`
            }
        }
    }

    private shouldSetToken(url: string): boolean {
        return SimpleCredentialProvider.isTrustedServiceUrl(url)
    }

    /**
     * Checks if the service url is for a trusted host or not.
     * @param  {string} serviceUrl The service url
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    public static isTrustedServiceUrl(serviceUrl: string): boolean {
        try {
            const uri: url.Url = url.parse(serviceUrl)
            if (uri.host) {
                return SimpleCredentialProvider.isTrustedUrl(uri.host)
            }
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error('Error in isTrustedServiceUrl', e)
        }

        return false
    }

    private static isTrustedUrl(uri: string): boolean {
        const expiration: Date = SimpleCredentialProvider.trustedHostNames.get(
            uri
        )
        if (expiration) {
            // check if the trusted service url is still valid
            return expiration.getTime() > Date.now() - 300000 // 5 Minutes
        }

        return false
    }
}
