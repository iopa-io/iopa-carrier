/* eslint-disable @typescript-eslint/camelcase */
import { ActivityTypes, } from 'iopa-carrier-schema';
import * as url from 'url';
import { shallowCopy } from './util';
import { CarrierWithEvents } from './carrier-events';
export const URI_CARRIER_PATH = '/client/v1.0.0/carrier/api';
export class CarrierWithEventsAndMethods extends CarrierWithEvents {
    constructor(app) {
        super(app);
        app.carrier.onCall(async (context, next) => {
            if (context['bot.Capability'].activity.channelData.Direction ===
                'outbound-api') {
                const subtype = context['iopa.Url'].searchParams.get('subtype');
                switch (subtype) {
                    case 'callback_dial':
                        return this.onCallBackDialCall(context, next);
                    default:
                        return next();
                }
            }
            return next();
        });
    }
    cleanNumber(number) {
        let result = number.replace(/[^\d+]+/g, '');
        result = result.replace(/^00/, '+');
        if (result.match(/^1/)) {
            result = `+${result}`;
        }
        if (!result.match(/^\+/)) {
            result = result.length > 7 ? `+1${result}` : result;
        }
        result = result.replace(/^\+/, '');
        return result;
    }
    beautifyNumber(number) {
        const result = number.replace(/^\+/, '');
        if (!result.startsWith('1') || result.length !== 11) {
            return number;
        }
        return `+${result.substr(0, 1)} (${result.substr(1, 3)}) ${result.substr(4, 3)}-${result.substr(7, 4)}`;
    }
    getBaseUrl(context) {
        return `${context['iopa.Url'].protocol}//${context['iopa.Url'].hostname}${URI_CARRIER_PATH}`;
    }
    getBaseUrlPath() {
        return URI_CARRIER_PATH;
    }
    async getRecordingUrl(provider, relative_url) {
        const config = this.providerConfig[provider];
        const response = (await this.fetchWithCredentials(config, config.baseUrl + relative_url, {
            redirect: 'manual',
            method: 'HEAD',
            headers: {},
        }));
        const location = response.headers.get('Location');
        return location;
    }
    async getAvailablePhoneNumbers(provider, areacode, locality) {
        const config = this.providerConfig[provider];
        const client = this.createCarrierApiClient(config);
        const { accountSid } = config;
        const query = {
            AreaCode: areacode,
            SmsEnabled: 'true',
            VoiceEnabled: 'true',
            PageSize: '20',
            Page: '0',
        };
        if (locality && provider !== 'signalwire') {
            query.InLocality = locality;
        }
        const result = await client.accountsAccountSidAvailablePhoneNumbersIsoCountryCodeLocalmediaTypeExtensionGet(accountSid, 'US', '.json', {
            query,
        });
        return result;
    }
    async purchaseIncomingPhoneNumber(provider, phone_number) {
        try {
            const config = this.providerConfig[provider];
            const client = this.createCarrierApiClient(config);
            const { accountSid } = config;
            const params = new url.URLSearchParams();
            params.append('PhoneNumber', phone_number);
            if (provider !== 'signalwire') {
                params.append('AddressSid', config.addressSid);
            }
            params.append('SmsApplicationSid', config.carrierCallbackApplicationId);
            params.append('VoiceApplicationSid', config.carrierCallbackApplicationId);
            const result = await client.accountsAccountSidIncomingPhoneNumbersmediaTypeExtensionPost(accountSid, '.json', {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });
            const response = (await result.json());
            return response;
        }
        catch (ex) {
            console.error(ex);
            return null;
        }
    }
    async getIncomingPhoneNumber(provider, phone_number) {
        try {
            const config = this.providerConfig[provider];
            const client = this.createCarrierApiClient(config);
            const { accountSid } = config;
            const response = await client.accountsAccountSidIncomingPhoneNumbersmediaTypeExtensionGet(accountSid, '.json', {
                query: {
                    PhoneNumber: phone_number,
                },
            });
            if (response.incoming_phone_numbers.length === 1) {
                return response.incoming_phone_numbers[0];
            }
            return null;
        }
        catch (ex) {
            console.log(ex);
            return null;
        }
    }
    async updateIncomingPhoneNumber(provider, sid, patch) {
        const config = this.providerConfig[provider];
        const client = this.createCarrierApiClient(config);
        const { accountSid } = config;
        const params = new url.URLSearchParams();
        params.append('FriendlyName', patch.friendly_name);
        if (provider !== 'signalwire') {
            params.append('AddressSid', config.addressSid);
        }
        params.append('SmsApplicationSid', config.carrierCallbackApplicationId);
        params.append('VoiceApplicationSid', config.carrierCallbackApplicationId);
        const response = await client.accountsAccountSidIncomingPhoneNumbersIncomingPhoneNumberSidmediaTypeExtensionPost(accountSid, '.json', sid, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });
        return response;
    }
    async clickToCall({ provider, baseUrl, physicalNumber, virtualNumber, recipientNumber, }) {
        console.log(`[iopa-carrier] Click to call ${JSON.stringify({
            provider,
            physicalNumber,
            virtualNumber,
            recipientNumber,
            baseUrl,
        })}`);
        const config = this.providerConfig[provider];
        const client = this.createCarrierApiClient(config);
        const { accountSid } = config;
        const subtype = 'callback_dial';
        const { appId } = this.providerConfig[provider].inboundCredentialsProvider;
        const callback_token = await this.providerConfig[provider].inboundCredentialsProvider.getAppSecret(appId);
        const url_callback = `${baseUrl}?provider=${provider}&type=${'voice'}&callback_token=${callback_token}&subtype=${subtype}&value=${recipientNumber.replace(/^\+/, '')}`;
        const url_status_callback = `${baseUrl}?provider=${provider}&type=${'voice_status'}&callback_token=${callback_token}&recipient=${recipientNumber.replace(/^\+/, '')}`;
        const params = new url.URLSearchParams();
        params.append('To', physicalNumber);
        params.append('From', virtualNumber);
        params.append('Url', url_callback);
        params.append('StatusCallback', url_status_callback);
        const response = await client.accountsAccountSidCallsmediaTypeExtensionPost(accountSid, '.json', {
            body: params,
        });
    }
    async onCallBackDialCall(context, next) {
        const toNumber = `+${context['iopa.Url'].searchParams.get('value')}`;
        console.log(`adding call to ${toNumber}}`);
        context.response['iopa.StatusCode'] = 200;
        context.response.end(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="alice" language="en-GB">Connecting you now</Say>
        <Dial timeout="30">
        <Number>${toNumber}</Number>
        </Dial>
        <Hangup />
    </Response>`);
        return next();
    }
    createSmsConversation(provider, fromNumber, toNumber, logic) {
        const config = this.providerConfig[provider];
        const { accountSid } = config;
        const conversationReference = {
            user: { id: toNumber },
            bot: { id: fromNumber },
            conversation: { tenantId: accountSid },
            channelId: provider,
            serviceUrl: config.serviceUrl,
        };
        return this.createConversation(conversationReference, logic);
    }
    /** Returns the conversation reference for an activity  */
    getConversationReference(activity) {
        return {
            activityId: activity.id,
            user: shallowCopy(activity.from),
            bot: shallowCopy(activity.recipient),
            conversation: shallowCopy(activity.conversation),
            channelId: activity.channelId,
            serviceUrl: activity.serviceUrl,
        };
    }
    /**  Updates an activity with the delivery information from a conversation reference.     */
    applyConversationReference(activity, reference, isIncoming = false) {
        activity.channelId = reference.channelId;
        activity.serviceUrl = reference.serviceUrl;
        activity.conversation = reference.conversation;
        if (isIncoming) {
            activity.from = reference.user;
            activity.recipient = reference.bot;
            if (reference.activityId) {
                activity.id = reference.activityId;
            }
        }
        else {
            activity.from = reference.bot;
            activity.recipient = reference.user;
            if (reference.activityId) {
                activity.replyToId = reference.activityId;
            }
        }
        return activity;
    }
    /** Create a ConversationReference based on an outgoing Activity's ResourceResponse  */
    getReplyConversationReference(activity, reply) {
        const reference = this.getConversationReference(activity);
        // Update the reference with the new outgoing Activity's id.
        reference.activityId = reply.id;
        return reference;
    }
    /** An asynchronous method that resumes a conversation with a user, possibly after some time has gone by. */
    async continueConversation(reference, logic) {
        const request = this.applyConversationReference({ type: ActivityTypes.Event, name: 'continueConversation' }, reference, true);
        const context = this.createContext(request);
        try {
            await this.app.invoke(context);
            await logic(context);
        }
        catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err);
            }
            else {
                throw err;
            }
        }
    }
    /** An asynchronous method that creates and starts a conversation with a user on a channel.  */
    async createConversation(reference, logic) {
        if (!reference.serviceUrl) {
            throw new Error(`ActivityHelpers.createConversation(): missing serviceUrl.`);
        }
        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request = this.applyConversationReference({ type: ActivityTypes.Event, name: 'createConversation' }, reference, true);
        const context = this.createContext(request);
        try {
            await logic(context);
        }
        catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err);
            }
            else {
                throw err;
            }
        }
    }
}
//# sourceMappingURL=carrier-methods.js.map