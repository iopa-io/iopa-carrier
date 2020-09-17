import { random, useTestingConfig } from '@iopa-edge/testing-framework'
import { IopaApp } from 'iopa-types'

export type CarrierConfig = {
    accountSid: string
    provider: string
    callbackToken: string
}

export function useCarrierTestingState(
    app: IopaApp,
    options?: Partial<CarrierConfig>
) {
    return useTestingConfig<CarrierConfig>(
        app,
        {
            provider: 'twilio',
            accountSid: 'TWILIO_ACCOUNT_SID',
            callbackToken: 'TWILIO_CALLBACK_TOKEN',
        },
        options
    )
}
