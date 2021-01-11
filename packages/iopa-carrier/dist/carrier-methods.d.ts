import { Activity, ConversationReference, ResourceResponse, AvailablePhoneNumbersAvailablePhoneNumbers, AvailablePhoneNumbers, IncomingCallsIncomingPhoneNumbers } from 'iopa-carrier-schema';
import { CarrierMethods as ICarrierMethods, IopaCarrierContext, CARRIER_PROVIDER } from 'iopa-carrier-types';
import { RouterApp, IopaContext } from 'iopa-types';
import { CarrierWithEvents } from './carrier-events';
import { Carrier } from './carrier';
export declare const URI_CARRIER_PATH = "/client/v1.0.0/carrier/api";
export declare class CarrierWithEventsAndMethods extends CarrierWithEvents implements ICarrierMethods {
    constructor(app: RouterApp<{}, IopaCarrierContext> & {
        carrier: Carrier;
    });
    cleanNumber(number: string): string;
    beautifyNumber(number: string): string;
    getBaseUrl(context: IopaContext): string;
    getBaseUrlPath(): string;
    getRecordingUrl(provider: CARRIER_PROVIDER, relative_url: string): Promise<string>;
    getAvailablePhoneNumbers(provider: CARRIER_PROVIDER, areacode: string, locality?: string): Promise<AvailablePhoneNumbers>;
    purchaseIncomingPhoneNumber(provider: CARRIER_PROVIDER, phone_number: string): Promise<AvailablePhoneNumbersAvailablePhoneNumbers>;
    getIncomingPhoneNumber(provider: CARRIER_PROVIDER, phone_number: string): Promise<IncomingCallsIncomingPhoneNumbers>;
    updateIncomingPhoneNumber(provider: CARRIER_PROVIDER, sid: string, patch: Partial<IncomingCallsIncomingPhoneNumbers>): Promise<import("iopa-carrier-schema").IncomingCall>;
    migrateIncomingPhoneNumber(provider: CARRIER_PROVIDER, sid: string): Promise<import("iopa-carrier-schema").IncomingCall>;
    clickToCall({ provider, baseUrl, physicalNumber, virtualNumber, recipientNumber, }: {
        provider: CARRIER_PROVIDER;
        baseUrl: string;
        physicalNumber: string;
        virtualNumber: string;
        recipientNumber: string;
    }): Promise<void>;
    private onCallBackDialCall;
    createSmsConversation(provider: CARRIER_PROVIDER, fromNumber: string, toNumber: string, logic: (context: IopaCarrierContext) => Promise<void>): Promise<void>;
    /** Returns the conversation reference for an activity  */
    getConversationReference(activity: Partial<Activity>): Partial<ConversationReference>;
    /**  Updates an activity with the delivery information from a conversation reference.     */
    applyConversationReference(activity: Partial<Activity>, reference: Partial<ConversationReference>, isIncoming?: boolean): Partial<Activity>;
    /** Create a ConversationReference based on an outgoing Activity's ResourceResponse  */
    getReplyConversationReference(activity: Partial<Activity>, reply: ResourceResponse): Partial<ConversationReference>;
    /** An asynchronous method that resumes a conversation with a user, possibly after some time has gone by. */
    continueConversation(reference: Partial<ConversationReference>, logic: (context: IopaCarrierContext) => Promise<void>): Promise<void>;
    /** An asynchronous method that creates and starts a conversation with a user on a channel.  */
    createConversation(reference: Partial<ConversationReference>, logic?: (context: IopaCarrierContext) => Promise<void>): Promise<void>;
}
