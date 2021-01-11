import { ActivityTypes } from 'iopa-carrier-schema';
import { URN_BOTINTENT_LITERAL, URN_CARRIER, CarrierCore } from './carrier-core';
export class CarrierWithEvents extends CarrierCore {
    constructor(app) {
        super(app);
        this.handlers = {};
        //
        // MASTER INVOKE HANDLER
        //
        this.invokeEvents = async (context, next) => {
            if (context['bot.Source'] !== URN_CARRIER) {
                return next();
            }
            const reading = context;
            const { activity, carrier } = context['bot.Capability'];
            context['iopa.Labels'].set('user', activity.from.id);
            reading['bot.ActivityId'] = activity.id;
            reading['bot.ActivityType'] = (activity.type.charAt(0).toUpperCase() +
                activity.type.slice(1));
            reading['bot.Channel'] = { id: activity.conversation.tenantId };
            reading['bot.Conversation'] = carrier.getConversationReference(activity);
            reading['bot.From'] = {
                id: activity.from.aadObjectId,
                localid: activity.from.id,
                name: activity.from.name || activity.channelData.CallerCity
                    ? `${activity.channelData.CallerCity} ${activity.channelData.CallerState}`
                    : '',
            };
            reading['bot.Intent'] =
                activity.type === ActivityTypes.Message
                    ? URN_BOTINTENT_LITERAL
                    : `${URN_CARRIER}:${activity.type}`;
            reading['bot.Recipient'] = {
                id: activity.recipient.aadObjectId,
                localid: activity.recipient.id,
                name: activity.recipient.name,
            };
            reading['bot.Session'] = undefined;
            reading['bot.Team'] = { id: 'carrier' };
            reading['bot.Timestamp'] = Date.now();
            await this.emit('Turn', context, async () => {
                switch (context['bot.Capability'].activity.type) {
                    case ActivityTypes.Message:
                        await this.invokeMessageActivity(context);
                        break;
                    case ActivityTypes.Call:
                        await this.invokeCallActivity(context);
                        break;
                    case ActivityTypes.MessageStatus:
                        await this.invokeMessageStatusActivity(context);
                        break;
                    case ActivityTypes.CallStatus:
                        await this.invokeCallStatusActivity(context);
                        break;
                    default:
                        await this.invokeUnrecognizedActivity(context);
                        break;
                }
            });
            return next();
        };
        app.use(this.invokeEvents, 'CarrierWithEvents.Invoke');
    }
    //
    // INVOKE SUBTYPE HANDLERS
    //
    async invokeMessageActivity(context) {
        const { activity, carrier } = context['bot.Capability'];
        const reading = context;
        reading['bot.Text'] = activity.text;
        context.response['iopa.Headers'].set('content-type', 'text/xml');
        await this.emit('Message', reading, this.defaultNextEvent(reading));
    }
    async invokeCallActivity(context) {
        const { activity, carrier } = context['bot.Capability'];
        const reading = context;
        reading['bot.Text'] = activity.text;
        context.response['iopa.Headers'].set('content-type', 'text/xml');
        await this.emit('Call', reading, this.defaultNextEvent(reading));
    }
    async invokeMessageStatusActivity(context) {
        const reading = context;
        context.response['iopa.Headers'].set('content-type', 'text/plain');
        await this.emit('MessageStatus', reading, this.defaultNextEvent(reading));
    }
    async invokeCallStatusActivity(context) {
        const { activity, carrier } = context['bot.Capability'];
        const reading = context;
        reading['bot.Text'] = activity.text;
        context.response['iopa.Headers'].set('content-type', 'text/xml');
        await this.emit('CallStatus', reading, this.defaultNextEvent(reading));
    }
    async invokeUnrecognizedActivity(context) {
        await this.emit('UnrecognizedActivityType', context, this.defaultNextEvent(context));
    }
    //
    // INTERNAL EVENT INFRASTRUCTURE
    //
    defaultNextEvent(context) {
        const runDialogs = async () => {
            if (!context['bot.Capability'].responded) {
                await this.emit('Dialog', context, async () => {
                    // noop
                });
            }
        };
        return runDialogs;
    }
    on(type, handler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler];
        }
        else {
            this.handlers[type].push(handler);
        }
        return this;
    }
    async emit(type, context, args, onNext) {
        if (type !== 'Dialog') {
            context['bot.ActivityType'] = type;
        }
        if (typeof args === 'function') {
            onNext = args;
            args = null;
        }
        let returnValue = null;
        async function runHandler(index) {
            if (index < handlers.length) {
                const val = args
                    ? await handlers[index](context, args, () => runHandler(index + 1))
                    : await handlers[index](context, () => runHandler(index + 1));
                // if a value is returned, and we have not yet set the return value,
                // capture it.  This is used to allow InvokeResponses to be returned.
                if (typeof val !== 'undefined' && returnValue === null) {
                    returnValue = val;
                }
            }
            else if (onNext) {
                const val = await onNext();
                if (typeof val !== 'undefined') {
                    returnValue = val;
                }
            }
        }
        const handlers = this.handlers[type] || [];
        await runHandler(0);
        return returnValue;
    }
    //
    // EVENT REGISTRATION PUBLIC METHODS
    //
    onTurn(handler) {
        return this.on('Turn', handler);
    }
    onMessage(handler) {
        return this.on('Message', handler);
    }
    onCall(handler) {
        return this.on('Call', handler);
    }
    onMessageStatus(handler) {
        return this.on('MessageStatus', async (context, next) => {
            await handler(context, context['bot.Capability'].activity.channelData
                .MessageStatus, next);
        });
    }
    onCallStatus(handler) {
        return this.on('CallStatus', handler);
    }
    onUnrecognizedActivityType(handler) {
        return this.on('UnrecognizedActivityType', handler);
    }
    onDialog(handler) {
        return this.on('Dialog', handler);
    }
    /**
     * Event pipeline invoked when a sendActivities is called on IopaCarrierContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(handler) {
        return this.on('ContextSendActivities', async (context, { activities }, next) => {
            await handler(context, activities, next);
        });
    }
}
//# sourceMappingURL=carrier-events.js.map