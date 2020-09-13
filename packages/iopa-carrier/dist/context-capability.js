import { ActivityTypes, } from 'iopa-carrier-schema';
const $$context = Symbol('urn:io:iopa:bot:response:context');
export class CarrierCapability {
    constructor(plaincontext, carrier, activity) {
        this[$$context] = plaincontext;
        this.activity = activity;
        this.carrier = carrier;
        this.turnState = new Map();
        this.responded = false;
    }
    /** Sends a single activity or message to the user */
    sendActivity(activityOrText, speak) {
        let a;
        if (typeof activityOrText === 'string') {
            a = {
                text: activityOrText,
            };
            if (speak) {
                a.speak = speak;
            }
        }
        else {
            a = activityOrText;
        }
        return this.sendActivities([a]).then((responses) => responses && responses.length > 0 ? responses[0] : undefined);
    }
    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    sendActivities(activities) {
        let sentNonTraceActivity = false;
        const ref = this.carrier.getConversationReference(this.activity);
        const output = activities.map((a) => {
            const o = this.carrier.applyConversationReference({ ...a }, ref);
            if (!o.type) {
                o.type = ActivityTypes.Message;
            }
            if (o.type !== ActivityTypes.Trace) {
                sentNonTraceActivity = true;
            }
            return o;
        });
        return this.carrier.emit('ContextSendActivities', this[$$context], { activities: output }, () => {
            return this.carrier
                .sendActivities(this[$$context], output)
                .then((responses) => {
                // Set responded flag
                if (sentNonTraceActivity) {
                    this.responded = true;
                }
                return responses;
            });
        });
    }
    copyTo(context) {
        // TODO COPY REFERENCES ETC.
        return context;
    }
}
//# sourceMappingURL=context-capability.js.map