/* eslint-disable @typescript-eslint/camelcase */
import {
    Activity,
    ConversationReference,
    ResourceResponse,
    AvailablePhoneNumbersAvailablePhoneNumbers,
    AvailablePhoneNumbers,
    IncomingCallsIncomingPhoneNumbers,
    IncomingCall,
} from 'iopa-carrier-schema'

import { IopaContext } from 'iopa-types'
import {
    IopaCarrierContext as TurnContext,
    IopaCarrierContext,
} from './context'
import { CARRIER_PROVIDER } from './carrier'

export interface CarrierMethods {
    cleanNumber(number: string): string
    beautifyNumber(number: string): string
    /** get base serviceUrl for the webhook sink of this capability, based on any IopaContext operating on same host and port */
    getBaseUrl(context: IopaContext): string
    /** get path only base serviceUrl for the webhook sink of this capability, usually "/client/v1.0.0/carrier/api" */
    getBaseUrlPath(): string
    getRecordingUrl(
        provider: CARRIER_PROVIDER,
        relativeUrl: string
    ): Promise<string>
    getAvailablePhoneNumbers(
        provider: CARRIER_PROVIDER,
        areacode: string,
        locality?: string
    ): Promise<AvailablePhoneNumbers>
    purchaseIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        phone_number: string
    ): Promise<AvailablePhoneNumbersAvailablePhoneNumbers>
    getIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        phone_number: string
    ): Promise<IncomingCallsIncomingPhoneNumbers>
    updateIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        sid: string,
        patch: Partial<IncomingCallsIncomingPhoneNumbers>
    ): Promise<IncomingCall>
    migrateIncomingPhoneNumber(
        provider: CARRIER_PROVIDER,
        sid: string
    ): Promise<IncomingCall>
    clickToCall(params: {
        provider: CARRIER_PROVIDER
        baseUrl: string
        physicalNumber: string
        virtualNumber: string
        recipientNumber: string
    }): Promise<void>

    createSmsConversation(
        provider: CARRIER_PROVIDER,
        fromNumber: string,
        toNumber: string,
        logic: (context: IopaCarrierContext) => Promise<void>
    ): Promise<void>

    /**
     * Returns the conversation reference for an activity.
     *
     * @remarks
     * This can be saved as a plain old JSON object and then later used to message the user
     * proactively.
     *
     * ```JavaScript
     * const reference = TurnContext.getConversationReference(context.request);
     * ```
     * @param activity The activity to copy the conversation reference from
     */
    getConversationReference(
        activity: Partial<Activity>
    ): Partial<ConversationReference>

    /**
     * Updates an activity with the delivery information from a conversation reference.
     *
     * @remarks
     * Calling this after [getConversationReference()](#getconversationreference) on an incoming
     * activity will properly address the reply to a received activity.
     *
     * ```JavaScript
     * // Send a typing indicator without going through a middleware listeners.
     * const reference = TurnContext.getConversationReference(context.activity);
     * const activity = TurnContext.applyConversationReference({ type: 'typing' }, reference);
     * await context.carrier.sendActivities([activity]);
     * ```
     * @param activity Activity to copy delivery information to.
     * @param reference Conversation reference containing delivery information.
     * @param isIncoming (Optional) flag indicating whether the activity is an incoming or outgoing activity. Defaults to `false` indicating the activity is outgoing.
     */
    applyConversationReference(
        activity: Partial<Activity>,
        reference: Partial<ConversationReference>,
        isIncoming?: boolean
    ): Partial<Activity>

    /**
     * Create a ConversationReference based on an outgoing Activity's ResourceResponse
     *
     * @remarks
     * This method can be used to create a ConversationReference that can be stored
     * and used later to delete or update the activity.
     * ```javascript
     * var reply = await context.sendActivity('Hi');
     * var reference = TurnContext.getReplyConversationReference(context.activity, reply);
     * ```
     *
     * @param activity Activity from which to pull Conversation info
     * @param reply ResourceResponse returned from sendActivity
     */
    getReplyConversationReference(
        activity: Partial<Activity>,
        reply: ResourceResponse
    ): Partial<ConversationReference>

    continueConversation(
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>

    createConversation(
        reference: Partial<ConversationReference>,
        logic?: (context: TurnContext) => Promise<void>
    ): Promise<void>
}
