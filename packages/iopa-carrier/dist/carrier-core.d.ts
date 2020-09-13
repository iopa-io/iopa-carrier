import { Activity, ResourceResponse, CarrierApi } from 'iopa-carrier-schema';
import { IopaCarrierContext, CarrierCore as ICarrierCore, CarrierConfig } from 'iopa-carrier-types';
import { IopaContext, RouterApp } from 'iopa-types';
export declare const INVOKE_RESPONSE_KEY = "urn:io.iopa.invokeResponse";
export declare const URN_CARRIER = "urn:io.iopa:carrier";
export declare const URN_BOTINTENT_LITERAL = "urn:io.iopa.bot:intent:literal";
/** The Iopa CarrierMiddleware */
export declare class CarrierCore implements ICarrierCore {
    protected readonly app: RouterApp<{}, IopaCarrierContext>;
    protected providerConfig: {
        [key: string]: CarrierConfig;
    };
    constructor(app: RouterApp<{}, IopaCarrierContext>);
    /** An asynchronous method that creates a turn context and runs the middleware pipeline
     * for an incoming activity from HTTP wire */
    invokeActivity(context: IopaContext, next: () => Promise<void>): Promise<void>;
    /** An asynchronous method that sends a set of outgoing activities to a channel server. */
    sendActivities(context: IopaCarrierContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]>;
    /** Creates a connector client.  Used by Teams Extensions in this package, not external */
    createCarrierApiClient(config: CarrierConfig): CarrierApi;
    fetchWithCredentials(config: CarrierConfig, url: string, init: any): Promise<any>;
    /** Allows for the overriding of authentication in unit tests. */
    private authenticateRequest;
    /**  Creates a turn context */
    createContext(activity: Partial<Activity>): IopaCarrierContext;
    private turnError;
    /** Gets/sets a error handler that will be called anytime an uncaught exception is raised during a turn */
    get onTurnError(): (context: IopaCarrierContext, error: Error) => Promise<void>;
    set onTurnError(value: (context: IopaCarrierContext, error: Error) => Promise<void>);
    private: any; /** Handles incoming webhooks from the Twilio/SignalWire Carrier */
    /** Handles incoming webhooks from the Twilio/SignalWire Carrier */
    private _parseRequest;
}
