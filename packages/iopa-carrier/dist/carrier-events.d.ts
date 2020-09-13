import { CarrierEvents as ICarrierEvents, IopaCarrierContext } from 'iopa-carrier-types';
import { Activity, ResourceResponse } from 'iopa-carrier-schema';
import { RouterApp } from 'iopa-types';
import { CarrierCore } from './carrier-core';
export declare type IopaEventHandlerNoArgs = (context: IopaCarrierContext, next: () => Promise<any>) => Promise<any>;
export declare type IopaEventHandlerArgs = (context: IopaCarrierContext, args: {
    [key: string]: any;
}, next: () => Promise<any>) => Promise<any>;
export declare type IopaEventHandler = IopaEventHandlerNoArgs | IopaEventHandlerArgs;
export declare class CarrierWithEvents extends CarrierCore implements ICarrierEvents {
    protected readonly handlers: {
        [type: string]: IopaEventHandler[];
    };
    constructor(app: RouterApp<{}, IopaCarrierContext>);
    protected invokeEvents: (context: IopaCarrierContext, next: () => Promise<void>) => Promise<void>;
    protected invokeMessageActivity(context: IopaCarrierContext): Promise<void>;
    protected invokeCallActivity(context: IopaCarrierContext): Promise<void>;
    protected invokeMessageStatusActivity(context: IopaCarrierContext): Promise<void>;
    protected invokeCallStatusActivity(context: IopaCarrierContext): Promise<void>;
    protected invokeUnrecognizedActivity(context: IopaCarrierContext): Promise<void>;
    protected defaultNextEvent(context: IopaCarrierContext): () => Promise<void>;
    protected on(type: string, handler: IopaEventHandler): this;
    emit(type: string, context: IopaCarrierContext): Promise<any>;
    emit(type: string, context: IopaCarrierContext, onNext: () => Promise<any>): Promise<any>;
    emit(type: string, context: IopaCarrierContext, args: {
        [key: string]: any;
    } | (() => Promise<any>), onNext?: () => Promise<any>): Promise<any>;
    onTurn(handler: IopaEventHandlerNoArgs): this;
    onMessage(handler: IopaEventHandlerNoArgs): this;
    onCall(handler: IopaEventHandlerNoArgs): this;
    onMessageStatus(handler: (context: IopaCarrierContext, status: 'queued' | 'sent' | 'delivered', next: () => Promise<void>) => Promise<void>): this;
    onCallStatus(handler: IopaEventHandlerNoArgs): this;
    onUnrecognizedActivityType(handler: IopaEventHandlerNoArgs): this;
    onDialog(handler: IopaEventHandlerNoArgs): this;
    /**
     * Event pipeline invoked when a sendActivities is called on IopaCarrierContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(handler: (context: IopaCarrierContext, activities: Partial<Activity>[], next: () => Promise<void>) => Promise<ResourceResponse[]>): this;
}
