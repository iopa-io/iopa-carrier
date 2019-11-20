import {
    Activity,
    ConversationReference,
    ResourceResponse,
    ActivityTypes,
} from 'iopa-carrier-schema'

import {
    ContextMethods as IContextMethods,
    ICarrierCapability,
} from 'iopa-carrier-types'

import { IopaContext } from 'iopa-types'
import { Carrier, IopaCarrierContext } from 'iopa-carrier-types'

const s_context: unique symbol = Symbol('urn:io:iopa:bot:response:context')

export class CarrierCapability implements ICarrierCapability, IContextMethods {
    private readonly [s_context]: IopaCarrierContext
    public readonly carrier: Carrier
    public readonly activity: Activity
    public readonly turnState: Map<any, any>
    public responded: boolean

    constructor(
        plaincontext: IopaContext,
        carrier: Carrier,
        activity: Activity
    ) {
        this[s_context] = plaincontext as IopaCarrierContext
        this.activity = activity
        this.carrier = carrier
        this.turnState = new Map<any, any>()
        this.responded = false
    }

    /** Sends a single activity or message to the user */
    public sendActivity(
        activityOrText: string | Partial<Activity>,
        speak?: string
    ): Promise<ResourceResponse | undefined> {
        let a: Partial<Activity>
        if (typeof activityOrText === 'string') {
            a = {
                text: activityOrText,
            }
            if (speak) {
                a.speak = speak
            }
        } else {
            a = activityOrText
        }

        return this.sendActivities([a]).then((responses: ResourceResponse[]) =>
            responses && responses.length > 0 ? responses[0] : undefined
        )
    }

    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    public sendActivities(
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]> {
        let sentNonTraceActivity = false
        const ref: Partial<ConversationReference> = this.carrier.getConversationReference(
            this.activity
        )
        const output: Partial<Activity>[] = activities.map(
            (a: Partial<Activity>) => {
                const o: Partial<Activity> = this.carrier.applyConversationReference(
                    { ...a },
                    ref
                )
                if (!o.type) {
                    o.type = ActivityTypes.Message
                }
                if (o.type !== ActivityTypes.Trace) {
                    sentNonTraceActivity = true
                }

                return o
            }
        )

        return this.carrier.emit(
            'ContextSendActivities',
            this[s_context],
            { activities: output },
            () => {
                return this.carrier
                    .sendActivities(this[s_context], output)
                    .then((responses: ResourceResponse[]) => {
                        // Set responded flag
                        if (sentNonTraceActivity) {
                            this.responded = true
                        }

                        return responses
                    })
            }
        )
    }

    public copyTo(this: IopaCarrierContext, context: IopaCarrierContext) {
        // TODO COPY REFERENCES ETC.

        return context
    }
}
