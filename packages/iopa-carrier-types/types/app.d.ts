import { RouterApp } from 'iopa-types'
import { Carrier } from './carrier'
import { IopaCarrierContext } from './context'

export interface CarrierMiddlewareApp extends RouterApp<{}, IopaCarrierContext> {
    carrier: Carrier
}
