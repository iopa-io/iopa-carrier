import { Activity, ResourceResponse } from 'iopa-carrier-schema'

import {
    IopaCarrierContext as TurnContext,
    IopaCarrierContext,
} from './context'

export interface ContextMethods {
    /**
     * Sends a single activity or message to the user.
     *
     * @remarks
     * This ultimately calls [sendActivities()](#sendactivites) and is provided as a convenience to
     * make formating and sending individual activities easier.
     *
     * ```JavaScript
     * await context.botːCapability.sendActivity(`Hello World`);
     * ```
     * @param activityOrText Activity or text of a message to send the user.
     * @param speak (Optional) SSML that should be spoken to the user for the message.
     * @param inputHint (Optional) `InputHint` for the message sent to the user. Defaults to `acceptingInput`.
     */
    sendActivity(
        this: IopaCarrierContext,
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
     * set to a type of `message`. The array of activities will then be routed through any [onSendActivities()](#onsendactivities)
     * handlers before being passed to `carrier.sendActivities()`.
     *
     * ```JavaScript
     * await context.botːCapability.sendActivities([
     *    { type: 'typing' },
     *    { type: 'delay', value: 2000 },
     *    { type: 'message', text: 'Hello... How are you?' }
     * ]);
     * ```
     * @param activities One or more activities to send to the user.
     */
    sendActivities(
        this: IopaCarrierContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>
}
