import {
    CarrierMiddlewareApp,
    IopaCarrierContext,
    InvokeResponse,
} from 'iopa-carrier-types'

import {
    Activity,
    ResourceResponse,
    ConversationReference,
} from 'iopa-carrier-schema'

export declare type IopaHandler = (
    context: IopaCarrierContext,
    next: () => Promise<any>
) => Promise<any>

export declare class CarrierEvents {
    /**
     * Bind a handler to the Turn event that is fired for every incoming activity, regardless of type
     * @remarks
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onTurn(handler: IopaHandler): this

    /**
     * Receives all incoming Message activities
     * @remarks
     * Message activities represent content intended to be shown within a conversational interface.
     * Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
     * Note that while most messages do contain text, this field is not always present!
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onMessage(handler: IopaHandler): this

    /**
     * Receives all incoming Voice/Fax/SIP Call activities
     * @remarks
     * Message activities represent content intended to be shown within a conversational interface.
     * Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
     * Note that while most messages do contain text, this field is not always present!
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onCall(handler: IopaHandler): this

    onCallStatus(handler: IopaHandler): this

    onMessageStatus(
        handler: (
            context: IopaCarrierContext,
            status: 'queued' | 'sent' | 'delivered',
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /**
     * UnrecognizedActivityType will fire if an activity is received with a type that has not previously been defined.
     * @remarks
     * Some channels or custom adapters may create Actitivies with different, "unofficial" types.
     * These events will be passed through as UnrecognizedActivityType events.
     * Check `context.activity.type` for the type value.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onUnrecognizedActivityType(handler: IopaHandler): this

    /**
     * onDialog fires at the end of the event emission process, and should be used to handle Dialog activity.
     * @remarks
     * Sample code:
     * ```javascript
     * bot.onDialog(async (context, next) => {
     *      if (context.activity.type === ActivityTypes.Message) {
     *          const dialogContext = await dialogSet.createContext(context);
     *          const results = await dialogContext.continueDialog();
     *          await conversationState.saveChanges(context);
     *      }
     *
     *      await next();
     * });
     * ```
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onDialog(handler: IopaHandler): this

    //
    // Context outbound hooks
    //

    /**
     * Event pipeline invoked when a sendActivities is called on IopaCarrierContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(
        handler: (
            context: IopaCarrierContext,
            activities: Partial<Activity>[],
            next: () => Promise<void>
        ) => Promise<ResourceResponse[]>
    ): this

    public emit(type: string, context: IopaCarrierContext): Promise<any>

    public emit(
        type: string,
        context: IopaCarrierContext,
        onNext: () => Promise<any>
    ): Promise<any>

    public emit(
        type: string,
        context: IopaCarrierContext,
        args: { [key: string]: any } | (() => Promise<any>),
        onNext?: () => Promise<any>
    ): Promise<any>
}
