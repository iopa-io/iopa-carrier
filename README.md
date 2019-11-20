# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br>iopa-carrier (mono repository)

[![NPM](https://img.shields.io/badge/iopa-certified-99cc33.svg?style=flat-square)](http://iopa.io/)
[![NPM](https://img.shields.io/badge/iopa-bot%20framework-F67482.svg?style=flat-square)](http://iopa.io/)

[![NPM](https://nodei.co/npm/iopa-carrier.png?downloads=true)](https://nodei.co/npm/iopa-carrier/)

## About

This mono repository contains the IOPA carrier for Twilio/SignalWire Api

The only dependency that a plugin needs is a typescript definition repository only, so no runtime bloat is added to bot logic

## Included Packages

### Core package

-   `iopa-carrier` - The IOPA plugin and entry point to this capability.  In particular this includes a lightweight carrier and context record extensions to support the SMS/Voice Context.   No runtime dependencies and runs in the browser, at the cloud edge, in serverless functions, or in Node.js environment

### Generated API Schema

-   `iopa-carrier-schema` - Generated openapi (swagger) connectors for microsoft botframework REST API
-   `iopa-carrier-schema-auth` - Auth helpers for validating microsoft auth tokens, kept in sync with botbuilder-js framework to implement best practice security guidance
-   `iopa-carrier-types` - Common typescript definitions to all packages

### Plugins and Helpers

-   `iopa-carrier-cards` - Helper factories to create simple text messages, Bot Framework Cards, Teams Legacy cards and modern Adaptive Cards that degrade gracefully over SMS

## License

MIT

## API Reference Specification

[![IOPA](http://iopa.io/iopa.png)](http://iopa.io)
