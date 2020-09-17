/* eslint-disable @typescript-eslint/camelcase */
import { IopaApp, IopaContext } from 'iopa-types'
import { rest } from 'msw'
import {
    makeFetch,
    random,
    addEdgeHeaders,
    getRelatedRecords,
} from '@iopa-edge/testing-framework'
import { TeamsReplyText } from 'iopa-botadapter/testing-framework'
import { CarrierConfig, useCarrierTestingState } from './carrier-config'

export { TeamsReplyText }

export function makeCarrierInboundSms(
    app: IopaApp,
    options: Partial<CarrierConfig> = {}
) {
    const superFetch = makeFetch(app)
        .use(addEdgeHeaders)
        .useRelated(getRelatedTeamsRecords)
    const testingState = useCarrierTestingState(app, options)

    const messageSid = random('SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')

    return function teamsInboundHookText(
        text: string,
        to = '+16158026790',
        from = '+16159451234'
    ) {
        const body = JSON.stringify({
            ToCountry: 'US',
            ToState: 'TN',
            SmsMessageSid: messageSid,
            NumMedia: '0',
            ToCity: '',
            FromZip: '37207',
            SmsSid: messageSid,
            FromState: 'TN',
            SmsStatus: 'received',
            FromCity: 'NASHVILLE',
            Body: text,
            FromCountry: 'US',
            To: to,
            ToZip: '',
            NumSegments: '1',
            MessageSid: messageSid,
            AccountSid: testingState.get('accountSid'),
            From: from,
            ApiVersion: '2010-04-01',
        })

        return superFetch(
            `/client/v1.0.0/carrier/api?provider=${testingState.get(
                'provider'
            )}&type=message&callback_token=${testingState.get(
                'callbackToken'
            )}`,
            {
                method: 'post',
                headers: {
                    accept: '*/*',
                    'accept-encoding': 'gzip',
                    'content-length': body.length.toString(),
                    'content-type': 'application/json; charset=utf-8',
                    'i-twilio-idempotency-token':
                        '803c29b1-163f-4e1a-a6c6-d74f62efab06',
                    'user-agent': 'TwilioProxy/1.1',
                    'x-forwarded-for': '34.233.125.251, 172.68.65.61',
                    'x-forwarded-proto': 'https, https',
                    'x-twilio-signature': '4KmHiO4c1Z8cVtGC1CP8YVUkAVA=',
                },
                body,
            }
        )
    }
}

export function makeCarrierInboundVoice(
    app: IopaApp,
    options: Partial<CarrierConfig> = {}
) {
    const superFetch = makeFetch(app)
        .use(addEdgeHeaders)
        .useRelated(getRelatedTeamsRecords)
    const testingState = useCarrierTestingState(app, options)

    const callSid = random('CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')

    return function teamsInboundHookVoice(
        status: 'ringing' | 'whisper-busy' | 'complete',
        to = '+16158026790',
        from = '+16159451234'
    ) {
        const body = JSON.stringify({
            ...(status === 'whisper-busy' && {
                CallStatus: 'in-progress',
                DialCallSid: callSid,
                DialCallStatus: 'busy',
            }),
            ...(status === 'complete' && {
                CallStatus: 'completed',
            }),
            ...(status === 'ringing' && {
                CallStatus: 'ringing',
            }),
            AccountSid: testingState.get('accountSid'),
            ApiVersion: '2010-04-01',
            ApplicationSid: random('APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
            CallSid: callSid,
            Called: to,
            CalledCity: '',
            CalledCountry: 'US',
            CalledState: 'TN',
            CalledZip: '',
            Caller: from,
            CallerCity: 'NASHVILLE',
            CallerCountry: 'US',
            CallerState: 'TN',
            CallerZip: '37207',
            Direction: 'inbound',
            From: from,
            FromCity: 'NASHVILLE',
            FromCountry: 'US',
            FromState: 'TN',
            FromZip: '37207',
            To: to,
            ToCity: '',
            ToCountry: 'US',
            ToState: 'TN',
            ToZip: '',
        })

        return superFetch(
            `/client/v1.0.0/carrier/api?provider=${testingState.get(
                'provider'
            )}&type=${
                status === 'complete' ? 'voice_status' : 'voice'
            }&callback_token=${testingState.get('callbackToken')}${
                status === 'whisper-busy' ? '&subtype=callcomplete' : ''
            }`,
            {
                method: 'post',
                headers: {
                    accept: '*/*',
                    'accept-encoding': 'gzip',
                    'content-length': body.length.toString(),
                    'content-type': 'application/json; charset=utf-8',
                    'i-twilio-idempotency-token':
                        '803c29b1-163f-4e1a-a6c6-d74f62efab06',
                    'user-agent': 'TwilioProxy/1.1',
                    'x-forwarded-for': '34.233.125.251, 172.68.65.61',
                    'x-forwarded-proto': 'https, https',
                    'x-twilio-signature': '4KmHiO4c1Z8cVtGC1CP8YVUkAVA=',
                },
                body,
            }
        )
    }
}

export const interceptCarrierResponses = (app: IopaApp) => {
    return [
        // signalwire_space.signalwire.com/api/laml/2010-04-01/Accounts/SIGNALWIRE_ACCOUNT_SID/AvailablePhoneNumbers/US/Local.json?AreaCode=615&SmsEnabled=true&VoiceEnabled=true&PageSize=20&Page=0
        rest.get(
            'https://**/2010-04-01/Accounts/:accountId/AvailablePhoneNumbers/US/Local.json',
            (req, res, ctx) => {
                console.log(`[MSW-CARRIER] ${req.method} ${req.url}`)
                const isSMSEnabled: boolean = app.properties
                    .get('server.Testing')
                    .get('carrier.isSMSEnabled')
                return res(
                    ctx.json({
                        available_phone_numbers: [
                            {
                                address_requirements: 'none',
                                beta: false,
                                capabilities: {
                                    mms: true,
                                    sms: isSMSEnabled,
                                    voice: true,
                                },
                                friendly_name: '(808) 925-1571',
                                iso_country: 'US',
                                lata: '834',
                                latitude: '19.720000',
                                locality: 'Hilo',
                                longitude: '-155.090000',
                                phone_number: '+18089251571',
                                postal_code: '96720',
                                rate_center: 'HILO',
                                region: 'HI',
                            },
                        ],
                        end: 1,
                        first_page_uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/AvailablePhoneNumbers/US/Local.json?PageSize=50&Page=0',
                        last_page_uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/AvailablePhoneNumbers/US/Local.json?PageSize=50&Page=0',
                        next_page_uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/AvailablePhoneNumbers/US/Local.json?PageSize=50&Page=50',
                        num_pages: 1,
                        page: 0,
                        page_size: 50,
                        previous_page_uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/AvailablePhoneNumbers/US/Local.json?PageSize=50&Page=0',
                        start: 0,
                        total: 1,
                        uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/AvailablePhoneNumbers/US/Local.json?PageSize=1',
                    })
                )
            }
        ),

        // Purchase an inbound number
        // https://signalwire_space.signalwire.com/api/laml/2010-04-01/Accounts/SIGNALWIRE_ACCOUNT_SID/IncomingPhoneNumbers.json
        rest.post(
            'https://**/2010-04-01/Accounts/:accountId/IncomingPhoneNumbers.json',
            (req, res, ctx) => {
                console.log(`[MSW-CARRIER] ${req.method} ${req.url}`)
                const isSMSEnabled: boolean = app.properties
                    .get('server.Testing')
                    .get('carrier.isSMSEnabled')

                return res(
                    ctx.json({
                        account_sid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        address_requirements: 'none',
                        address_sid: 'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        api_version: '2010-04-01',
                        beta: false,
                        capabilities: {
                            voice: true,
                            sms: isSMSEnabled,
                            mms: true,
                            fax: false,
                        },
                        date_created: 'Thu, 30 Jul 2015 23:19:04 +0000',
                        date_updated: 'Thu, 30 Jul 2015 23:19:04 +0000',
                        emergency_status: 'Active',
                        emergency_address_sid:
                            'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        friendly_name: 'friendly_name',
                        identity_sid: 'RIXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        origin: 'origin',
                        phone_number: '+18089255327',
                        sid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        sms_application_sid:
                            'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        sms_fallback_method: 'GET',
                        sms_fallback_url: 'https://example.com',
                        sms_method: 'GET',
                        sms_url: 'https://example.com',
                        status_callback: 'https://example.com',
                        status_callback_method: 'GET',
                        trunk_sid: null,
                        uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json',
                        voice_application_sid:
                            'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        voice_caller_id_lookup: false,
                        voice_fallback_method: 'GET',
                        voice_fallback_url: 'https://example.com',
                        voice_method: 'GET',
                        voice_url: 'https://example.com',
                        bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        voice_receive_mode: 'voice',
                        status: 'in-use',
                    })
                )
            }
        ),

        // https://signalwire_space.signalwire.com/api/laml/2010-04-01/Accounts/SIGNALWIRE_ACCOUNT_SID/IncomingPhoneNumbers.json
        rest.get(
            'https://**/2010-04-01/Accounts/:accountId/IncomingPhoneNumbers.json',
            (req, res, ctx) => {
                console.log(`[MSW-CARRIER] ${req.method} ${req.url}`)

                const isSMSEnabled: boolean = app.properties
                    .get('server.Testing')
                    .get('carrier.isSMSEnabled')

                return res(
                    ctx.json({
                        incoming_phone_numbers: [
                            {
                                account_sid:
                                    'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                address_requirements: 'none',
                                address_sid:
                                    'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                api_version: '2010-04-01',
                                beta: false,
                                capabilities: {
                                    voice: true,
                                    sms: isSMSEnabled,
                                    mms: true,
                                    fax: false,
                                },
                                date_created: 'Thu, 30 Jul 2015 23:19:04 +0000',
                                date_updated: 'Thu, 30 Jul 2015 23:19:04 +0000',
                                emergency_status: 'Active',
                                emergency_address_sid:
                                    'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                friendly_name: 'friendly_name',
                                identity_sid:
                                    'RIXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                origin: 'origin',
                                phone_number: '+18089255327',
                                sid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                sms_application_sid:
                                    'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                sms_fallback_method: 'GET',
                                sms_fallback_url: 'https://example.com',
                                sms_method: 'GET',
                                sms_url: 'https://example.com',
                                status_callback: 'https://example.com',
                                status_callback_method: 'GET',
                                trunk_sid: null,
                                uri:
                                    '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json',
                                voice_application_sid:
                                    'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                voice_caller_id_lookup: false,
                                voice_fallback_method: 'GET',
                                voice_fallback_url: 'https://example.com',
                                voice_method: 'GET',
                                voice_url: 'https://example.com',
                                bundle_sid:
                                    'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                                voice_receive_mode: 'voice',
                                status: 'in-use',
                            },
                        ],
                    })
                )
            }
        ),

        // https://signalwire_space.signalwire.com/api/laml/2010-04-01/Accounts/SIGNALWIRE_ACCOUNT_SID/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json
        rest.post(
            'https://**/2010-04-01/Accounts/:accountId/IncomingPhoneNumbers/:incomingPhoneNumberSid.json',
            (req, res, ctx) => {
                console.log(`[MSW-CARRIER] ${req.method} ${req.url}`)

                const isSMSEnabled: boolean = app.properties
                    .get('server.Testing')
                    .get('carrier.isSMSEnabled')

                return res(
                    ctx.json({
                        account_sid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        address_requirements: 'none',
                        address_sid: 'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        api_version: '2010-04-01',
                        beta: false,
                        capabilities: {
                            voice: true,
                            sms: isSMSEnabled,
                            mms: true,
                            fax: false,
                        },
                        date_created: 'Thu, 30 Jul 2015 23:19:04 +0000',
                        date_updated: 'Thu, 30 Jul 2015 23:19:04 +0000',
                        emergency_status: 'Active',
                        emergency_address_sid:
                            'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        friendly_name: 'friendly_name',
                        identity_sid: 'RIXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        origin: 'origin',
                        phone_number: '+18089255327',
                        sid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        sms_application_sid:
                            'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        sms_fallback_method: 'GET',
                        sms_fallback_url: 'https://example.com',
                        sms_method: 'GET',
                        sms_url: 'https://example.com',
                        status_callback: 'https://example.com',
                        status_callback_method: 'GET',
                        trunk_sid: null,
                        uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json',
                        voice_application_sid:
                            'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        voice_caller_id_lookup: false,
                        voice_fallback_method: 'GET',
                        voice_fallback_url: 'https://example.com',
                        voice_method: 'GET',
                        voice_url: 'https://example.com',
                        bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        voice_receive_mode: 'voice',
                        status: 'in-use',
                    })
                )
            }
        ),

        // https://api.twilio.com/2010-04-01/Accounts/TWILIO_ACCOUNT_SID/Messages.json?ApplicationSid=TWILIO_CALLBACK_APP_ID
        rest.post(
            'https://**/2010-04-01/Accounts/:accountId/Messages.json',
            (req, res, ctx) => {
                console.log(`[MSW-CARRIER] ${req.method} ${req.url}`)

                const isSMSEnabled: boolean = app.properties
                    .get('server.Testing')
                    .get('carrier.isSMSEnabled')

                return res(
                    ctx.json({
                        account_sid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        api_version: '2010-04-01',
                        body: 'body',
                        date_created: 'Thu, 30 Jul 2015 20:12:31 +0000',
                        date_sent: 'Thu, 30 Jul 2015 20:12:33 +0000',
                        date_updated: 'Thu, 30 Jul 2015 20:12:33 +0000',
                        direction: 'outbound-api',
                        error_code: null,
                        error_message: null,
                        from: '+15017122661',
                        messaging_service_sid:
                            'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        num_media: '0',
                        num_segments: '1',
                        price: null,
                        price_unit: null,
                        sid: 'SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                        status: 'sent',
                        subresource_uris: {
                            media:
                                '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Media.json',
                        },
                        to: '+15558675310',
                        uri:
                            '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json',
                    })
                )
            }
        ),
    ]
}

export function getRelatedTeamsRecords(context: IopaContext, app: IopaApp) {
    const activity = context.get('iopa.RawRequest').toJSON().body
    const teamsChannelDescription = activity.From.replace(/^\+/, '')
    return getRelatedRecords<TeamsReplyText>(
        app,
        (req) => req.id === teamsChannelDescription
    )
}
