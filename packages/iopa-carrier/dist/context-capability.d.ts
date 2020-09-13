import { Activity, ResourceResponse } from 'iopa-carrier-schema';
import { ContextMethods as IContextMethods, ICarrierCapability, Carrier, IopaCarrierContext } from 'iopa-carrier-types';
import { IopaContext } from 'iopa-types';
declare const $$context: unique symbol;
export declare class CarrierCapability implements ICarrierCapability, IContextMethods {
    private readonly [$$context];
    readonly carrier: Carrier;
    readonly activity: Activity;
    readonly turnState: Map<any, any>;
    responded: boolean;
    constructor(plaincontext: IopaContext, carrier: Carrier, activity: Activity);
    /** Sends a single activity or message to the user */
    sendActivity(activityOrText: string | Partial<Activity>, speak?: string): Promise<ResourceResponse | undefined>;
    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    sendActivities(activities: Partial<Activity>[]): Promise<ResourceResponse[]>;
    copyTo(this: IopaCarrierContext, context: IopaCarrierContext): IopaCarrierContext;
}
export {};
