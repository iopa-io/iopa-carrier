import { Activity } from 'iopa-carrier-schema'
import { IopaContext } from 'iopa-types'
import {
    Carrier,
    IopaCarrierContext,
    CARRIER_PROVIDER,
} from 'iopa-carrier-types'
import { CarrierCapability } from './context-capability'
import { toIopaCarrierResponse } from './context-response-connector'

/** Convert plain IopaContext into a method-enhanced IopaCarrierContext */
export function toIopaCarrierContext(
    plaincontext: IopaContext,
    carrier: Carrier,
    activity: Activity
): IopaCarrierContext {
    const context = plaincontext as IopaCarrierContext
    context['bot.Capability'] = new CarrierCapability(
        plaincontext,
        carrier,
        activity
    )
    context['bot.Provider'] =
        context['bot.Provider'] ||
        ((activity.channelId as unknown) as CARRIER_PROVIDER)
    context.response = toIopaCarrierResponse(plaincontext.response, context)
    return context
}
