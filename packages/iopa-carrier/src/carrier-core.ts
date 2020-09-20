/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-case-declarations */
import {
    Activity,
    ActivityTypes,
    ResourceResponse,
    CarrierApi,
    ActivityInbound,
} from 'iopa-carrier-schema'

import {
    SimpleCredentialProvider,
    authenticateCarrierContext,
} from 'iopa-carrier-schema-auth'

import {
    IopaCarrierContext,
    Carrier,
    CarrierCore as ICarrierCore,
    CarrierMiddlewareApp,
    CarrierConfig,
    CARRIER_PROVIDER,
} from 'iopa-carrier-types'

import { IopaContext, RouterApp } from 'iopa-types'

import { toIopaCarrierContext } from './context'

// This key is exported internally so that the TeamsActivityHandler will not overwrite any already set InvokeResponses.
export const INVOKE_RESPONSE_KEY = 'urn:io.iopa.invokeResponse'
export const URN_CARRIER = 'urn:io.iopa:carrier'
export const URN_BOTINTENT_LITERAL = 'urn:io.iopa.bot:intent:literal'

/** The Iopa CarrierMiddleware */
export class CarrierCore implements ICarrierCore {
    protected readonly app: RouterApp<{}, IopaCarrierContext>

    protected providerConfig: { [key: string]: CarrierConfig }

    constructor(app: RouterApp<{}, IopaCarrierContext>) {
        this.app = app
        ;(app as CarrierMiddlewareApp).carrier = (this as unknown) as Carrier

        this.providerConfig = {
            signalwire: {
                provider: 'signalwire',
                baseUrl: `https://${process.env.SIGNALWIRE_SPACE}`,
                serviceUrl: `https://${process.env.SIGNALWIRE_SPACE}/api/laml/2010-04-01`,
                accountSid: process.env.SIGNALWIRE_ACCOUNT_SID,
                outboundCredentialsProvider: new SimpleCredentialProvider(
                    process.env.SIGNALWIRE_ACCOUNT_SID,
                    process.env.SIGNALWIRE_ACCOUNT_TOKEN
                ),
                inboundCredentialsProvider: new SimpleCredentialProvider(
                    process.env.SIGNALWIRE_ACCOUNT_SID,
                    process.env.SIGNALWIRE_CALLBACK_TOKEN
                ),
                carrierCallbackApplicationId:
                    process.env.SIGNALWIRE_CALLBACK_APP_ID,
                addressSid: process.env.SIGNALWIRE_ADDRESS_SID,
            },
            twilio: {
                provider: 'twilio',
                baseUrl: `https://api.twilio.com`,
                serviceUrl: `https://api.twilio.com/2010-04-01`,
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                outboundCredentialsProvider: new SimpleCredentialProvider(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_PRIMARY_TOKEN
                ),
                inboundCredentialsProvider: new SimpleCredentialProvider(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_CALLBACK_TOKEN
                ),
                carrierCallbackApplicationId:
                    process.env.TWILIO_CALLBACK_APP_ID,
                addressSid: process.env.TWILIO_ADDRESS_SID,
            },
        }
    }

    /** An asynchronous method that creates a turn context and runs the middleware pipeline
     * for an incoming activity from HTTP wire */
    public async invokeActivity(
        context: IopaContext,
        next: () => Promise<void>
    ): Promise<void> {
        if (context['iopa.Protocol'] === URN_CARRIER) {
            // skip validation and parsing for synthetic contexts created by this framework
            return next()
        }

        let status: number
        let processError: Error

        try {
            // Parse body of request
            status = 400

            const activity: Activity = await this._parseRequest(context)

            // Authenticate the incoming request
            status = 401
            await this.authenticateRequest(context as IopaCarrierContext)

            // Expand Context with Iopa Turn Context from
            status = 500
            const contextExpanded: IopaCarrierContext = toIopaCarrierContext(
                context,
                (this as unknown) as Carrier,
                activity
            )

            contextExpanded['bot.Source'] = URN_CARRIER

            console.log(
                `[Carrier] Authorization Complete] ${context.get(
                    'server.TimeElapsed'
                )}ms`
            )

            // Main processing of received activity
            try {
                await next()
            } catch (err) {
                if (this.onTurnError) {
                    await this.onTurnError(contextExpanded, err)
                } else {
                    throw err
                }
            }

            if (status !== 200) {
                status = 200

                await context.response.end(
                    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
                    { status }
                )
            }
        } catch (err) {
            // Catch the error to try and throw the stacktrace out of processActivity()
            processError = err
            console.error(err)
        }

        if (status !== 200) {
            await context.response.end(
                `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
                { status }
            )
        }

        // Check for an error
        if (status >= 400) {
            if (processError && (processError as Error).stack) {
                throw new Error(
                    `CarrierCore.invoke(): ${status} ERROR\n ${processError.stack}`
                )
            } else {
                throw new Error(`CarrierCore.invoke(): ${status} ERROR`)
            }
        }
        return null
    }

    /** An asynchronous method that sends a set of outgoing activities to a channel server. */
    public async sendActivities(
        context: IopaCarrierContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]> {
        const responses: ResourceResponse[] = []
        for (let i = 0; i < activities.length; i++) {
            const activity: Partial<Activity> = activities[i]
            switch (activity.type as ActivityTypes | string) {
                case 'delay':
                    await delay(
                        typeof activity.value === 'number'
                            ? activity.value
                            : 1000
                    )
                    responses.push({} as ResourceResponse)
                    break
                default:
                    if (!activity.serviceUrl) {
                        throw new Error(
                            `CarrierCore.sendActivities(): missing serviceUrl.`
                        )
                    }
                    if (!activity.recipient || !activity.recipient.id) {
                        throw new Error(
                            `CarrierCore.sendActivities(): missing recipient id.`
                        )
                    }

                    const client = this.createCarrierApiClient(
                        this.providerConfig[context['bot.Provider']]
                    )

                    if (
                        activity.type === ActivityTypes.Trace &&
                        activity.channelId !== 'emulator'
                    ) {
                        // Just eat activity
                        responses.push({} as ResourceResponse)
                    } else {
                        try {
                            responses.push(
                                ((await client.accountsAccountSidMessagesmediaTypeExtensionPost(
                                    activity.conversation.tenantId,
                                    '.json',
                                    activity.recipient.id,
                                    activity.from.id,
                                    undefined,
                                    activity.text,
                                    undefined, // TODO   Process MMS Messages too
                                    {
                                        query: {
                                            ApplicationSid: this.providerConfig[
                                                context['bot.Provider']
                                            ].carrierCallbackApplicationId,
                                        },
                                    }
                                )) as unknown) as ResourceResponse
                            )
                        } catch (ex) {
                            const error = await ex.json()
                            console.error(JSON.stringify(error))
                            throw new Error(
                                ex.statusText ||
                                    `Error: ${
                                        ex.message ||
                                        'An error occurred sending the message [carrier-core]'
                                    }`
                            )
                        }
                    }
                    break
            }
        }
        return responses
    }

    /** Creates a connector client.  Used by Teams Extensions in this package, not external */
    public createCarrierApiClient(config: CarrierConfig): CarrierApi {
        const fetchProxy = this.fetchWithCredentials.bind(this, config)
        const client = new CarrierApi(
            {},
            config.serviceUrl.replace(/\/+$/, ''),
            fetchProxy
        )
        return client
    }

    public async fetchWithCredentials(
        config: CarrierConfig,
        url: string,
        init: any
    ): Promise<any> {
        if (init && init.body && init.body instanceof URLSearchParams) {
            if (init.headers.set) {
                init.headers.set(
                    'content-type',
                    'application/x-www-form-urlencoded'
                )
            } else {
                init.headers['content-type'] =
                    'application/x-www-form-urlencoded'
            }
        }
        try {
            await config.outboundCredentialsProvider.signRequest(url, init)

            const result = await timeout(fetch(url, init), 10000)

            // override json in case of empty successful (202) responses
            if (result.status === 202) {
                result.json = async () => ({})
            }
            return result
        } catch (ex) {
            // rethrow for stack trace upon timeout
            try {
                throw ex
            } catch (ex) {
                console.error(ex)
                return ex
            }
        }
    }

    /** Allows for the overriding of authentication in unit tests. */
    private async authenticateRequest(
        context: IopaCarrierContext
    ): Promise<void> {
        await authenticateCarrierContext(
            context,
            this.providerConfig[context['bot.Provider']]
                .inboundCredentialsProvider
        )
    }

    /**  Creates a turn context */
    public createContext(activity: Partial<Activity>): IopaCarrierContext {
        const plaincontext = this.app.createContext(activity.serviceUrl, {
            withResponse: true,
            protocol: URN_CARRIER,
        })

        const context = toIopaCarrierContext(
            plaincontext,
            (this as unknown) as Carrier,
            activity
        )

        context['bot.Source'] = URN_CARRIER

        return context
    }

    private turnError: (
        context: IopaCarrierContext,
        error: Error
    ) => Promise<void>

    /** Gets/sets a error handler that will be called anytime an uncaught exception is raised during a turn */
    public get onTurnError(): (
        context: IopaCarrierContext,
        error: Error
    ) => Promise<void> {
        return this.turnError
    }

    public set onTurnError(
        value: (context: IopaCarrierContext, error: Error) => Promise<void>
    ) {
        this.turnError = value
    }

    private /** Handles incoming webhooks from the Twilio/SignalWire Carrier */

    /** Handles incoming webhooks from the Twilio/SignalWire Carrier */
    private _parseRequest(context: IopaContext): Promise<Activity> {
        return new Promise(
            async (resolve: any, reject: any): Promise<void> => {
                const provider = context['iopa.Url'].searchParams.get(
                    'provider'
                )

                if (['twilio', 'signalwire'].indexOf(provider) === -1) {
                    throw new Error(
                        `CarrierCore._parseRequest(): unknown provider ${provider}.`
                    )
                }

                const body: ActivityInbound = await context['iopa.Body']

                try {
                    if (typeof body !== 'object') {
                        throw new Error(
                            `CarrierCore._parseRequest(): invalid request body.`
                        )
                    }

                    if (typeof body.AccountSid !== 'string') {
                        body.AccountSid = this.providerConfig[
                            provider
                        ].accountSid

                        console.log(
                            `CarrierCore._parseRequest(): missing account_sid, so defaulted`
                        )
                    }

                    let type: ActivityTypes

                    switch (context['iopa.Url'].searchParams.get('type')) {
                        case 'message':
                            type = ActivityTypes.Message
                            break
                        case 'voice':
                            type = ActivityTypes.Call
                            break
                        case 'message_status':
                            type = ActivityTypes.MessageStatus
                            break
                        case 'voice_status':
                            type = ActivityTypes.CallStatus
                            break
                        default:
                            throw new Error(
                                `CarrierCore._parseRequest(): missing or invalid type on search params`
                            )
                    }

                    const activity: Activity = {
                        type,
                        channelId: provider,
                        conversation: { tenantId: body.AccountSid },
                        channelData: body,
                        from: { id: body.From },
                        recipient: { id: body.CalledVia || body.To },
                        text: body.Body,
                        id: body.MessageSid || body.SmsSid,
                        serviceUrl: this.providerConfig[provider].serviceUrl,
                    }
                    ;(context as IopaCarrierContext)[
                        'bot.Provider'
                    ] = provider as CARRIER_PROVIDER

                    resolve(activity)
                } catch (err) {
                    console.error(err)
                    reject(err)
                }
            }
        )
    }
}

function delay(/** timeout in ms */ timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('timeout'))
        }, ms)
        promise.then(resolve, reject)
    })
}
