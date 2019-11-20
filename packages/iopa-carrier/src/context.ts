import { Activity } from 'iopa-carrier-schema'
import { IopaContext } from 'iopa-types'
import { Carrier, IopaCarrierContext } from 'iopa-carrier-types'
import { CarrierCapability } from './context-capability'
import { toIopaCarrierResponse } from './context-response-connector'

/** Convert plain IopaContext into a method-enhanced IopaCarrierContext */
export function toIopaCarrierContext(
    plaincontext: IopaContext,
    carrier: Carrier,
    activity: Activity
): IopaCarrierContext {
    const context = plaincontext as IopaCarrierContext
    context.botːCapability = new CarrierCapability(
        plaincontext,
        carrier,
        activity
    )
    context.botːProvider = context.botːProvider || activity.channelId
    context.response = toIopaCarrierResponse(plaincontext.response, context)
    return context
}
