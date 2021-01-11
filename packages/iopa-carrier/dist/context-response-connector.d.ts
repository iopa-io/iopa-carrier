import { IopaResponse, BotResponseMethods, IopaBotCard } from 'iopa-types';
import { IopaCarrierContext, IopaCarrierResponse } from 'iopa-carrier-types';
/** Convert plain IopaContext into a method-enhanced IopaCarrierContext */
export declare function toIopaCarrierResponse(plainresponse: Partial<IopaResponse>, context: IopaCarrierContext): IopaCarrierResponse;
export declare class ResponseHelpers implements BotResponseMethods {
    say(this: IopaCarrierResponse, text: string): IopaCarrierResponse;
    card(this: IopaCarrierResponse, card: any): IopaCarrierResponse;
    /** Send response back to bot */
    send(this: IopaCarrierResponse, body?: any): Promise<void>;
    /** Helper method to indicate this response should end the dialog */
    shouldEndSession(this: IopaCarrierResponse, flag: boolean): IopaCarrierResponse;
    /** Helper method to set the status of the response */
    status(this: IopaCarrierResponse, statuscode: number): IopaCarrierResponse;
    /** Send a text string or card attachments, looping with delay if multiple provided */
    sendAll(this: IopaCarrierResponse, messages: (string | IopaBotCard)[], typingDelay?: number): Promise<void>;
    fail(this: IopaCarrierResponse, error: string, message: string, inChannel: string): IopaCarrierResponse;
    showTypingIndicator(): Promise<void>;
    hideTypingIndicator(): Promise<void>;
    isAwaitingMultiChoiceResponse(): boolean;
}
