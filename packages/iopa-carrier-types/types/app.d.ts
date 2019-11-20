import { RouterApp } from 'iopa-types'
import { Carrier } from './carrier'

export interface CarrierMiddlewareApp extends RouterApp {
    carrier: Carrier
}
