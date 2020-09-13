import { Activity } from 'iopa-carrier-schema';
import { IopaContext } from 'iopa-types';
import { Carrier, IopaCarrierContext } from 'iopa-carrier-types';
/** Convert plain IopaContext into a method-enhanced IopaCarrierContext */
export declare function toIopaCarrierContext(plaincontext: IopaContext, carrier: Carrier, activity: Activity): IopaCarrierContext;
