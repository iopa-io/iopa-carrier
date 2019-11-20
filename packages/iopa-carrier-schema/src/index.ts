export * from './generated/index'

export { DefaultApi as CarrierApi } from './generated/api'

export {
    Activity,
    ActivityTypes,
    ConversationReference,
    InputHints,
    ResourceResponse,
} from 'iopa-botadapter-schema'

/**
 *
 * @export
 * @interface Message
 */
export interface ActivityInbound {
    /**
     *
     * @type {string}
     * @memberof Message
     */
    AccountSid?: string

    /**
     *
     * @type {string}
     * @memberof Message
     */
    Body?: string

    /**
     *
     * @type {string}
     * @memberof Message
     */
    From?: string

    /**
     *
     * @type {string}
     * @memberof Message
     */
    NumMedia?: string

    /**
     *
     * @type {string}
     * @memberof Message
     */
    NumSegments?: string

    /**
     * Unique Id of the message
     * @type {string}
     * @memberof Message
     */
    MessageSid?: string

    /**
     * Unique Id of the message
     * @type {string}
     * @memberof Message
     */
    SmsSid?: string

    /**
     * Recipient E164 numer
     * @type {string}
     * @memberof Message
     */
    To?: string

    /** Intermediary used for whisper calls */
    CalledVia?: string
}
