import {
    Activity,
    ConversationReference,
    ResourceResponse,
    CarrierApi,
} from 'iopa-carrier-schema'

import { IopaContext, RouterApp } from 'iopa-types'
import { ICredentialProvider } from 'iopa-carrier-schema-auth'
import { IopaCarrierContext } from './context'
import { CarrierEvents } from './carrier-events'
import { CarrierMethods } from './carrier-methods'

export type CARRIER_PROVIDER = 'twilio' | 'signalwire'

export interface CarrierConfig {
    provider: string
    accountSid: string
    migrateToAccountSid: string
    baseUrl: string
    serviceUrl: string
    outboundCredentialsProvider: ICredentialProvider
    inboundCredentialsProvider: ICredentialProvider
    carrierCallbackApplicationId: string
    addressSid: string
    migrateToAddressSid: string
}

/**
 * Represents a response returned by a bot when it receives an `invoke` activity.
 *
 * > [!NOTE] This interface supports the framework and is not intended to be called directly for your code.
 */
export interface InvokeResponse {
    /**
     * The HTTP status code of the response.
     */
    status: number
    /**
     * Optional. The body of the response.
     */
    body?: any
}

export interface CarrierBase {
    /**
     * Sends a set of activities to the user.
     *
     * @remarks
     * An array of responses from the server will be returned.
     * @param context Context for the current turn of conversation with the user.
     * @param activities Set of activities being sent.
     */
    sendActivities(
        context: IopaCarrierContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>

    /**
     * Gets/sets a error handler that will be called anytime an uncaught exception is raised during
     * a turn.
     */
    onTurnError: (context: IopaCarrierContext, error: Error) => Promise<void>
}

export interface CarrierCore extends CarrierBase {
    invokeActivity(
        context: IopaContext,
        next: () => Promise<void>
    ): Promise<void>

    sendActivities(
        context: IopaCarrierContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>

    /**
     * Creates a connector client.
     *
     * @param serviceUrl The client's service URL.
     *
     * @remarks
     * Override this in a derived class to create a mock connector client for unit testing.
     */
    createCarrierApiClient(config: CarrierConfig): CarrierApi

    /**
     * Fetch, setting credentials in header
     */
    fetchWithCredentials(
        config: CarrierConfig,
        url: string,
        init: any
    ): Promise<any>

    createContext(request: Partial<Activity>): IopaCarrierContext
}

export interface Carrier extends CarrierCore, CarrierMethods, CarrierEvents {}
