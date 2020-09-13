import { CarrierCapability } from './context-capability';
import { toIopaCarrierResponse } from './context-response-connector';
/** Convert plain IopaContext into a method-enhanced IopaCarrierContext */
export function toIopaCarrierContext(plaincontext, carrier, activity) {
    const context = plaincontext;
    context['bot.Capability'] = new CarrierCapability(plaincontext, carrier, activity);
    context['bot.Provider'] =
        context['bot.Provider'] ||
            activity.channelId;
    context.response = toIopaCarrierResponse(plaincontext.response, context);
    return context;
}
//# sourceMappingURL=context.js.map