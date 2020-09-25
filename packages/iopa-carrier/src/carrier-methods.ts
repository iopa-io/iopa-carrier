/* eslint-disable @typescript-eslint/camelcase */
import {
    Activity,
    ConversationReference,
    ResourceResponse,
    ActivityTypes,
    AvailablePhoneNumbersAvailablePhoneNumbers,
    AvailablePhoneNumbers,
    IncomingCallsIncomingPhoneNumbers,
} from 'iopa-carrier-schema'

import * as url from 'url'

import {
    CarrierMethods as ICarrierMethods,
    IopaCarrierContext,
    CARRIER_PROVIDER,
} from 'iopa-carrier-types'

import { RouterApp, IopaContext } from 'iopa-types'
import { shallowCopy } from './util'
import { CarrierWithEvents } from './carrier-events'

import { Carrier } from './carrier'

export const URI_CARRIER_PATH = '/client/v1.0.0/carrier/api'

export class CarrierWithEventsAndMethods
    extends CarrierWithEvents
    implements ICarrierMethods {
    constructor(app: RouterApp<{}, IopaCarrierContext> & { carrier: Carrier }) {
        super(app)

        app.carrier.onCall(
            async (
                context: IopaCarrierContext,
                next: () => Promise<void>
            ): Promise<void> => {
                if (
                    context['bot.Capability'].activity.channelData.Direction ===
                    'outbound-api'
                ) {
                    const subtype = context['iopa.Url'].searchParams.get(
                        'subtype'
                    )

                    switch (subtype) {
                        case 'callback_dial':
                            return this.onCallBackDialCall(context, next)
                        default:
                            return next()
                    }
                }
                return next()
            }
        )
    }

    cleanNumber(number: string) {
        let result = number.replace(/[^\d+]+/g, '')
        result = result.replace(/^00/, '+')
        if (result.match(/^1/)) {
            result = `+${result}`
        }
        if (!result.match(/^\+/)) {
            result = result.length > 7 ? `+1${result}` : result
        }
        result = result.replace(/^\+/, '')
        return result
    }

    beautifyNumber(number: string) {
        const result = number.replace(/^\+/, '')
        if (!result.startsWith('1') || result.length !== 11) {
            return number
        }

        return `+${result.substr(0, 1)} (${result.substr(
            1,
            3
        )}) ${result.substr(4, 3)}-${result.substr(7, 4)}`
    }

    getBaseUrl(context: IopaContext): string {
        return `${context['iopa.Url'].protocol}//${context['iopa.Url'].hostname}${URI_CARRIER_PATH}`
    }

    getBaseUrlPath(): string {
        return URI_CARRIER_PATH
    }

    async getRecordingUrl(
        provider: CARRIER_PROVIDER,
        relative_url: string
    ): Promise<string> {
        const config = this.providerConfig[provider]

        const response = (await this.fetchWithCredentials(
            config,
            config.baseUrl + relative_url,
            {
                redirect: 'manual',
                method: 'HEAD',
                headers: {},
            }
        )) as Response

        const location = response.headers.get('Location') as string

        return location
    }

    async getAvailablePhoneNumbers(
        provider: CARRIER_PROVIDER,
        areacode: string,
        locality?: string
    ) {
        const config = this.providerConfig[provider]
        const client = this.createCarrierApiClient(config)
        const { accountSid } = config

        const query = {
            AreaCode: areacode,
            SmsEnabled: 'true',
            VoiceEnabled: 'true',
            PageSize: '20',
            Page: '0',
        } as any

        if (locality && provider !== 'signalwire') {
            query.InLocality = locality
        }

        const result = await client.accountsAccountSidAvailablePhoneNumbersIsoCountryCodeLocalmediaTypeExtensionGet(
            accountSid,
            'US',
            '.json',
            {
                query,
            }
        )

        return result as AvailablePhoneNumbers
    }

    async purchaseIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        phone_number: string
    ) {
        try {
            const config = this.providerConfig[provider]
            const client = this.createCarrierApiClient(config)
            const { accountSid } = config

            const params = new url.URLSearchParams() as URLSearchParams
            params.append('PhoneNumber', phone_number)
            if (provider !== 'signalwire') {
                params.append('AddressSid', config.addressSid)
            }
            params.append(
                'SmsApplicationSid',
                config.carrierCallbackApplicationId
            )
            params.append(
                'VoiceApplicationSid',
                config.carrierCallbackApplicationId
            )

            const result = await client.accountsAccountSidIncomingPhoneNumbersmediaTypeExtensionPost(
                accountSid,
                '.json',
                {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                    body: params,
                }
            )

            const response = (await result.json()) as AvailablePhoneNumbersAvailablePhoneNumbers

            return response
        } catch (ex) {
            console.error(ex)
            return null
        }
    }

    async getIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        phone_number: string
    ): Promise<IncomingCallsIncomingPhoneNumbers> {
        try {
            const config = this.providerConfig[provider]
            const client = this.createCarrierApiClient(config)
            const { accountSid } = config

            const response = await client.accountsAccountSidIncomingPhoneNumbersmediaTypeExtensionGet(
                accountSid,
                '.json',
                {
                    query: {
                        PhoneNumber: phone_number,
                    },
                }
            )

            if (response.incoming_phone_numbers.length === 1) {
                return response.incoming_phone_numbers[0]
            }
            return null
        } catch (ex) {
            console.log(ex)
            return null
        }
    }

    async updateIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        sid: string,
        patch: Partial<IncomingCallsIncomingPhoneNumbers>
    ) {
        const config = this.providerConfig[provider]
        const client = this.createCarrierApiClient(config)
        const { accountSid } = config

        const params = new url.URLSearchParams() as URLSearchParams
        params.append('FriendlyName', patch.friendly_name)
        if (provider !== 'signalwire') {
            params.append('AddressSid', config.addressSid)
        }
        params.append('SmsApplicationSid', config.carrierCallbackApplicationId)
        params.append(
            'VoiceApplicationSid',
            config.carrierCallbackApplicationId
        )

        const response = await client.accountsAccountSidIncomingPhoneNumbersIncomingPhoneNumberSidmediaTypeExtensionPost(
            accountSid,
            '.json',
            sid,
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: params,
            }
        )

        return response
    }

    async migrateIncomingPhoneNumber(provider: CARRIER_PROVIDER, sid: string) {
        if (provider !== 'twilio') {
            throw new Error('migration only supported for twilio')
        }

        const config = this.providerConfig[provider]
        const client = this.createCarrierApiClient(config)
        const { accountSid, migrateToAccountSid } = config

        const params = new url.URLSearchParams() as URLSearchParams
        params.append('AccountSid', migrateToAccountSid)
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        if (provider !== 'signalwire') {
            params.append('AddressSid', config.migrateToAddressSid)
        }

        const response = await client.accountsAccountSidIncomingPhoneNumbersIncomingPhoneNumberSidmediaTypeExtensionPost(
            accountSid,
            '.json',
            sid,
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: params,
            }
        )

        return response
    }

    public async clickToCall({
        provider,
        baseUrl,
        physicalNumber,
        virtualNumber,
        recipientNumber,
    }: {
        provider: CARRIER_PROVIDER
        baseUrl: string
        physicalNumber: string
        virtualNumber: string
        recipientNumber: string
    }): Promise<void> {
        console.log(
            `[iopa-carrier] Click to call ${JSON.stringify({
                provider,
                physicalNumber,
                virtualNumber,
                recipientNumber,
                baseUrl,
            })}`
        )

        const config = this.providerConfig[provider]
        const client = this.createCarrierApiClient(config)
        const { accountSid } = config

        const subtype = 'callback_dial'
        const { appId } = this.providerConfig[
            provider
        ].inboundCredentialsProvider
        const callback_token = await this.providerConfig[
            provider
        ].inboundCredentialsProvider.getAppSecret(appId)

        const url_callback = `${baseUrl}?provider=${provider}&type=${'voice'}&callback_token=${callback_token}&subtype=${subtype}&value=${recipientNumber.replace(
            /^\+/,
            ''
        )}`
        const url_status_callback = `${baseUrl}?provider=${provider}&type=${'voice_status'}&callback_token=${callback_token}&recipient=${recipientNumber.replace(
            /^\+/,
            ''
        )}`

        const params = new url.URLSearchParams() as URLSearchParams
        params.append('To', physicalNumber)
        params.append('From', virtualNumber)
        params.append('Url', url_callback)
        params.append('StatusCallback', url_status_callback)

        const response = await client.accountsAccountSidCallsmediaTypeExtensionPost(
            accountSid,
            '.json',
            {
                body: params,
            }
        )
    }

    private async onCallBackDialCall(
        context: IopaCarrierContext,
        next: () => Promise<void>
    ): Promise<void> {
        const toNumber = `+${context['iopa.Url'].searchParams.get('value')}`
        console.log(`adding call to ${toNumber}}`)
        context.response.end(
            `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="alice" language="en-GB">Connecting you now</Say>
        <Dial timeout="30">
        <Number>${toNumber}</Number>
        </Dial>
        <Hangup />
    </Response>`,
            { status: 200 }
        )
        return next()
    }

    public createSmsConversation(
        provider: CARRIER_PROVIDER,
        fromNumber: string,
        toNumber: string,
        logic: (context: IopaCarrierContext) => Promise<void>
    ) {
        const config = this.providerConfig[provider]
        const { accountSid } = config

        const conversationReference: ConversationReference = {
            user: { id: toNumber },
            bot: { id: fromNumber },
            conversation: { tenantId: accountSid },
            channelId: provider,
            serviceUrl: config.serviceUrl,
        }

        return this.createConversation(conversationReference, logic)
    }

    /** Returns the conversation reference for an activity  */
    public getConversationReference(
        activity: Partial<Activity>
    ): Partial<ConversationReference> {
        return {
            activityId: activity.id,
            user: shallowCopy(activity.from),
            bot: shallowCopy(activity.recipient),
            conversation: shallowCopy(activity.conversation),
            channelId: activity.channelId,
            serviceUrl: activity.serviceUrl,
        }
    }

    /**  Updates an activity with the delivery information from a conversation reference.     */
    public applyConversationReference(
        activity: Partial<Activity>,
        reference: Partial<ConversationReference>,
        isIncoming = false
    ): Partial<Activity> {
        activity.channelId = reference.channelId
        activity.serviceUrl = reference.serviceUrl
        activity.conversation = reference.conversation
        if (isIncoming) {
            activity.from = reference.user
            activity.recipient = reference.bot
            if (reference.activityId) {
                activity.id = reference.activityId
            }
        } else {
            activity.from = reference.bot
            activity.recipient = reference.user
            if (reference.activityId) {
                activity.replyToId = reference.activityId
            }
        }

        return activity
    }

    /** Create a ConversationReference based on an outgoing Activity's ResourceResponse  */
    public getReplyConversationReference(
        activity: Partial<Activity>,
        reply: ResourceResponse
    ): Partial<ConversationReference> {
        const reference: Partial<ConversationReference> = this.getConversationReference(
            activity
        )

        // Update the reference with the new outgoing Activity's id.
        reference.activityId = reply.id

        return reference
    }

    /** An asynchronous method that resumes a conversation with a user, possibly after some time has gone by. */
    public async continueConversation(
        reference: Partial<ConversationReference>,
        logic: (context: IopaCarrierContext) => Promise<void>
    ): Promise<void> {
        const request: Partial<Activity> = this.applyConversationReference(
            { type: ActivityTypes.Event, name: 'continueConversation' },
            reference,
            true
        )

        const context: IopaCarrierContext = this.createContext(request)

        try {
            await this.app.invoke(context)
            await logic(context)
        } catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err)
            } else {
                throw err
            }
        }
    }

    /** An asynchronous method that creates and starts a conversation with a user on a channel.  */
    public async createConversation(
        reference: Partial<ConversationReference>,
        logic?: (context: IopaCarrierContext) => Promise<void>
    ): Promise<void> {
        if (!reference.serviceUrl) {
            throw new Error(
                `ActivityHelpers.createConversation(): missing serviceUrl.`
            )
        }

        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request: Partial<Activity> = this.applyConversationReference(
            { type: ActivityTypes.Event, name: 'createConversation' },
            reference,
            true
        )

        const context: IopaCarrierContext = this.createContext(request)

        try {
            await logic(context)
        } catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err)
            } else {
                throw err
            }
        }
    }
}
