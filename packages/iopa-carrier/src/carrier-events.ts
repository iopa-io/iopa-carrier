import {
    CarrierEvents as ICarrierEvents,
    IopaCarrierContext,
} from 'iopa-carrier-types'

import { ActivityTypes, Activity, ResourceResponse } from 'iopa-carrier-schema'

export type IopaEventHandlerNoArgs = (
    context: IopaCarrierContext,
    next: () => Promise<any>
) => Promise<any>

export type IopaEventHandlerArgs = (
    context: IopaCarrierContext,
    args: { [key: string]: any },
    next: () => Promise<any>
) => Promise<any>

export type IopaEventHandler = IopaEventHandlerNoArgs | IopaEventHandlerArgs

import { URN_BOTINTENT_LITERAL, URN_CARRIER, CarrierCore } from './carrier-core'

import { RouterApp, BotReading, BotActivityTypes } from 'iopa-types'

export class CarrierWithEvents extends CarrierCore implements ICarrierEvents {
    protected readonly handlers: { [type: string]: IopaEventHandler[] } = {}

    public constructor(app: RouterApp) {
        super(app)
        app.use(this.invokeEvents, 'CarrierWithEvents.Invoke')
    }

    //
    // MASTER INVOKE HANDLER
    //

    protected invokeEvents = async (
        context: IopaCarrierContext,
        next: () => Promise<void>
    ) => {
        if (context.botːSource !== URN_CARRIER) {
            return next()
        }

        const reading: BotReading = context as any

        const { activity, carrier } = context.botːCapability

        context.iopaːLabels.set('user', activity.from.id)

        reading.botːActivityId = activity.id
        reading.botːActivityType = (((activity.type as unknown) as string)
            .charAt(0)
            .toUpperCase() +
            ((activity.type as unknown) as string).slice(1)) as any
        reading.botːChannel = { id: activity.conversation.tenantId }
        reading.botːConversation = carrier.getConversationReference(activity)
        reading.botːFrom = {
            id: activity.from.aadObjectId, // likely undefined
            localid: activity.from.id,
            name:
                activity.from.name || activity.channelData.CallerCity
                    ? activity.channelData.CallerCity +
                      ' ' +
                      activity.channelData.CallerState
                    : '', // name likely undefined
        }
        reading.botːIntent =
            activity.type == ActivityTypes.Message
                ? URN_BOTINTENT_LITERAL
                : `${URN_CARRIER}:${activity.type}`
        reading.botːRecipient = {
            id: activity.recipient.aadObjectId, // likely undefined
            localid: activity.recipient.id,
            name: activity.recipient.name, // likely undefined
        }
        reading.botːSession = undefined
        reading.botːTeam = { id: 'carrier' }
        reading.botːTimestamp = Date.now()

        await this.emit('Turn', context, async () => {
            switch (context.botːCapability.activity.type) {
                case ActivityTypes.Message:
                    await this.invoke_MessageActivity(context)
                    break
                case ActivityTypes.Call:
                    await this.invoke_CallActivity(context)
                    break
                case ActivityTypes.MessageStatus:
                    await this.invoke_MessageStatusActivity(context)
                    break
                case ActivityTypes.CallStatus:
                    await this.invoke_CallStatusActivity(context)
                    break
                default:
                    await this.invoke_UnrecognizedActivity(context)
                    break
            }
        })

        return next()
    }

    //
    // INVOKE SUBTYPE HANDLERS
    //

    protected async invoke_MessageActivity(
        context: IopaCarrierContext
    ): Promise<void> {
        const { activity, carrier } = context.botːCapability
        const reading: IopaCarrierContext & BotReading = context as any
        reading.botːText = activity.text
        context.response.iopaːHeaders.set('content-type', 'text/xml')
        await this.emit('Message', reading, this.defaultNextEvent(reading))
    }

    protected async invoke_CallActivity(
        context: IopaCarrierContext
    ): Promise<void> {
        const { activity, carrier } = context.botːCapability
        const reading: IopaCarrierContext & BotReading = context as any
        reading.botːText = activity.text
        context.response.iopaːHeaders.set('content-type', 'text/xml')

        await this.emit('Call', reading, this.defaultNextEvent(reading))
    }

    protected async invoke_MessageStatusActivity(
        context: IopaCarrierContext
    ): Promise<void> {
        const reading: IopaCarrierContext & BotReading = context as any
        context.response.iopaːHeaders.set('content-type', 'text/plain')
        await this.emit(
            'MessageStatus',
            reading,
            this.defaultNextEvent(reading)
        )
    }

    protected async invoke_CallStatusActivity(
        context: IopaCarrierContext
    ): Promise<void> {
        const { activity, carrier } = context.botːCapability
        const reading: IopaCarrierContext & BotReading = context as any
        reading.botːText = activity.text
        context.response.iopaːHeaders.set('content-type', 'text/plain')
        await this.emit('CallStatus', reading, this.defaultNextEvent(reading))
    }

    protected async invoke_UnrecognizedActivity(
        context: IopaCarrierContext
    ): Promise<void> {
        await this.emit(
            'UnrecognizedActivityType',
            context,
            this.defaultNextEvent(context)
        )
    }

    //
    // INTERNAL EVENT INFRASTRUCTURE
    //

    protected defaultNextEvent(
        context: IopaCarrierContext
    ): () => Promise<void> {
        const runDialogs = async (): Promise<void> => {
            if (!context.botːCapability.responded) {
                await this.emit('Dialog', context, async () => {
                    // noop
                })
            }
        }
        return runDialogs
    }

    protected on(type: string, handler: IopaEventHandler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler]
        } else {
            this.handlers[type].push(handler)
        }
        return this
    }

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

    async emit(
        type: BotActivityTypes,
        context: IopaCarrierContext,
        args?: { [key: string]: any },
        onNext?: () => Promise<any>
    ): Promise<any> {
        if ((type as any) !== 'Dialog') {
            context.botːActivityType = type
        }

        if (typeof args == 'function') {
            onNext = args as any
            args = null
        }

        let returnValue: any = null

        async function runHandler(index: number): Promise<void> {
            if (index < handlers.length) {
                const val = args
                    ? await (handlers[index] as IopaEventHandlerArgs)(
                          context,
                          args,
                          () => runHandler(index + 1)
                      )
                    : await (handlers[index] as IopaEventHandlerNoArgs)(
                          context,
                          () => runHandler(index + 1)
                      )

                // if a value is returned, and we have not yet set the return value,
                // capture it.  This is used to allow InvokeResponses to be returned.
                if (typeof val !== 'undefined' && returnValue === null) {
                    returnValue = val
                }
            } else if (onNext) {
                const val = await onNext()
                if (typeof val !== 'undefined') {
                    returnValue = val
                }
            }
        }

        const handlers = this.handlers[type] || []
        await runHandler(0)

        return returnValue
    }

    //
    // EVENT REGISTRATION PUBLIC METHODS
    //

    public onTurn(handler: IopaEventHandlerNoArgs): this {
        return this.on('Turn', handler)
    }

    public onMessage(handler: IopaEventHandlerNoArgs): this {
        return this.on('Message', handler)
    }

    public onCall(handler: IopaEventHandlerNoArgs): this {
        return this.on('Call', handler)
    }

    public onMessageStatus(
        handler: (
            context: IopaCarrierContext,
            status: 'queued' | 'sent' | 'delivered',
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'MessageStatus',
            async (context: IopaCarrierContext, next) => {
                await handler(
                    context,
                    context.botːCapability.activity.channelData.MessageStatus,
                    next
                )
            }
        )
    }

    public onCallStatus(handler: IopaEventHandlerNoArgs): this {
        return this.on('CallStatus', handler)
    }

    public onUnrecognizedActivityType(handler: IopaEventHandlerNoArgs): this {
        return this.on('UnrecognizedActivityType', handler)
    }

    public onDialog(handler: IopaEventHandlerNoArgs): this {
        return this.on('Dialog', handler)
    }

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
    ): this {
        return this.on(
            'ContextSendActivities',
            async (context: IopaCarrierContext, { activities }, next) => {
                return await handler(context, activities, next)
            }
        )
    }
}
