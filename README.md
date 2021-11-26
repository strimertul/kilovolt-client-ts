# kilovolt-client

Typescript client for Kilovolt servers, supports Kilovolt Protocol v4+

API docs coming soon(tm)

## Getting started

`kilovolt-client` only works in platforms with a WebSocket client, such as the browser and [Deno](https://deno.land/). Node.js currently does not work.

### CDN - ES6 Module

A compiled version is available on this repo at `dist/kilovolt.js` and through jsDeliver at the following URL: https://cdn.jsdelivr.net/gh/strimertul/kilovolt-client-ts/dist/kilovolt.js

For production uses you should use a fixed tag, like this:

```ts
import Kilovolt from "https://cdn.jsdelivr.net/gh/strimertul/kilovolt-client-ts@6.3.2/dist/kilovolt.js"
```


### NPM package
If you are using a bundler such as Webpack, Parcel or [Vite](https://vitejs.dev/), you can include this client in your project by downloading and importing [@strimertul/kilovolt-client](https://www.npmjs.com/package/@strimertul/kilovolt-client) like this:

```sh
npm i --save @strimertul/kilovolt-client
```

### Deno module

This package is available as a Deno module through Deno's own hosting service as https://deno.land/x/kilovolt

To use it, simply import it like this:

```ts
import { Kilovolt } from "https://deno.land/x/kilovolt@v6.3.2/mod.ts"
```

## LICENSE

Kilovolt client is licensed under ISC, see `LICENSE` for more details.

This library uses [@billjs/event-emitter](https://github.com/billjs/event-emitter), which is licensed under MIT, check [this](https://github.com/billjs/event-emitter/blob/master/LICENSE) for more details.
