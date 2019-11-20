import {
    Activity,
    ConversationReference,
    ResourceResponse,
} from 'iopa-carrier-schema'

import { Carrier, CARRIER_PROVIDER } from 'iopa-carrier-types'
import {
    IopaContext,
    IopaResponse,
    IopaBotResponse,
    IopaBotContext,
} from 'iopa-types'

/**
 *
 * BotFramework extensions to the IopaContext
 *
 * The properties and methods included here are added to the
 * `botːCapability` section of the  IopaContext
 *
 */
export interface IopaCarrierContext extends IopaBotContext {
    botːProvider: CARRIER_PROVIDER
    botːCapability?: ICarrierCapability
    response: IopaCarrierResponse
}

export type IopaCarrierResponse = IopaBotResponse & {
    botːCapability?: ICarrierCapability
}

export interface ICarrierCapability {
    /**
     * Sends a single activity or message to the user.
     *
     * @remarks
     * This ultimately calls [sendActivities()](#sendactivites) and is provided as a convenience to
     * make formating and sending individual activities easier.
     *
     * ```JavaScript
     * await context.sendActivity(`Hello World`);
     * ```
     * @param activityOrText Activity or text of a message to send the user.
     * @param speak (Optional) SSML that should be spoken to the user for the message.
     * @param inputHint (Optional) `InputHint` for the message sent to the user. Defaults to `acceptingInput`.
     */
    sendActivity(
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined>

    /**
     * Sends a set of activities to the user. An array of responses from the server will be returned.
     *
     * @remarks
     * Prior to delivery, the activities will be updated with information from the `ConversationReference`
     * for the contexts [activity](#activity) and if any activities `type` field hasn't been set it will be
     * set to a type of `message`. The array of activities will then be routed through any
     * event [onSendActivities()](#onsendactivities) handlers before being passed to `carrier.sendActivities()`.
     *
     * ```JavaScript
     * await context.sendActivities([
     *    { type: 'typing' },
     *    { type: 'delay', value: 2000 },
     *    { type: 'message', text: 'Hello... How are you?' }
     * ]);
     * ```
     * @param activities One or more activities to send to the user.
     */
    sendActivities(activities: Partial<Activity>[]): Promise<ResourceResponse[]>

    /**
     * Called when this TurnContext instance is passed into the constructor of a new TurnContext
     * instance.
     *
     * @remarks
     * Can be overridden in derived classes to add additional fields that should be cloned.
     * @param context The context object to copy private members to. Everything should be copied by reference.
     */
    copyTo(context: IopaCarrierContext): void

    /**
     * The carrier for this context.
     *
     * @remarks
     * This example shows how to send a `typing` activity directly using the carrier. This approach
     * bypasses any middleware which sometimes has its advantages.  The calls to
     * `getConversationReference()` and `applyConversationReference()` are needed to ensure that the
     * outgoing activity is properly addressed:
     *
     * ```JavaScript
     * // Send a typing indicator without going through an middleware listeners.
     * const reference = context.botːCapability.carrier.getConversationReference(context.activity);
     * const activity = context.botːCapability.carrier.applyConversationReference({ type: 'typing' }, reference);
     * await context.botːCapability.sendActivities([activity]);
     * ```
     */
    readonly carrier: Carrier

    /**
     * The received activity.
     *
     * @remarks
     * This example shows how to get the users trimmed utterance from the activity:
     *
     * ```JavaScript
     * const utterance = (context.activity.text || '').trim();
     * ```
     */
    readonly activity: Activity

    /**
     * If `true` at least one response has been sent for the current turn of conversation.
     *
     * @remarks
     * This is primarily useful for determining if a bot should run fallback routing logic:
     *
     * ```JavaScript
     * await routeActivity(context);
     * if (!context.botːCapability.responded) {
     *    await context.botːCapability.sendActivity(`I'm sorry. I didn't understand.`);
     * }
     * ```
     */
    responded: boolean

    /**
     * Map of services and other values cached for the lifetime of the turn.
     *
     * @remarks
     * Middleware, other components, and services will typically use this to cache information
     * that could be asked for by a bot multiple times during a turn. The bots logic is free to
     * use this to pass information between its own components.
     *
     * ```JavaScript
     * const cart = await loadUsersShoppingCart(context);
     * context.botːCapability.turnState.set('cart', cart);
     * ```
     *
     * > [!TIP]
     * > For middleware and third party components, consider using a `Symbol()` for your cache key
     * > to avoid potential naming collisions with the bots caching and other components.
     */
    readonly turnState: Map<any, any>
}
