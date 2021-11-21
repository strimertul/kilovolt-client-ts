var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from "@billjs/event-emitter";
import { base64ToBytesArr, bytesArrToBase64 } from "./utils";
/**
 * Simple random function for generating request IDs
 * Note: not cryptographically secure!
 * @returns Random hex string
 */
function generateRid() {
    return Math.random().toString(32);
}
/**
 * Calculate and encode the hash for authentication challenges using Web Crypto API
 * @param password Shared key for authentication
 * @param challenge Base64 of the received challenge
 * @param salt Base64 of the received salt
 * @returns Base64 encoded hash
 */
function authChallenge(password, challenge, salt) {
    return __awaiter(this, void 0, void 0, function* () {
        // Encode password
        const enc = new TextEncoder();
        const keyBytes = enc.encode(password);
        const saltBytes = base64ToBytesArr(salt);
        const challengeKey = Uint8Array.from([...keyBytes, ...saltBytes]);
        const challengeBytes = base64ToBytesArr(challenge);
        const key = yield window.crypto.subtle.importKey("raw", challengeKey, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign", "verify"]);
        const signature = yield window.crypto.subtle.sign("HMAC", key, Uint8Array.from(challengeBytes));
        return bytesArrToBase64(Array.from(new Uint8Array(signature)));
    });
}
export default class KilovoltWS extends EventEmitter {
    /**
     * Create a new Kilovolt client instance and connect to it
     * @param address Kilovolt server endpoint (including path)
     */
    constructor(address = "ws://localhost:4337/ws", password) {
        super();
        this.address = address;
        this.password = password;
        this.pending = {};
        this.keySubscriptions = {};
        this.prefixSubscriptions = {};
        this.connect(address);
    }
    /**
     * Re-connect to kilovolt server
     */
    reconnect() {
        this.connect(this.address);
    }
    connect(address) {
        this.socket = new WebSocket(address);
        this.socket.addEventListener("open", this.open.bind(this));
        this.socket.addEventListener("message", this.received.bind(this));
        this.socket.addEventListener("close", this.closed.bind(this));
    }
    /**
     * Wait for websocket connection to be established
     */
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                if (this.socket.readyState === this.socket.OPEN) {
                    resolve();
                    return;
                }
                this.once("open", () => resolve());
            });
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            console.info("connected to server");
            // Authenticate if needed
            if (this.password) {
                try {
                    yield this.auth();
                }
                catch (e) {
                    this.fire("error", e);
                    this.socket.close();
                }
            }
            this.fire("open");
            this.fire("stateChange", this.socket.readyState);
        });
    }
    closed() {
        console.warn("lost connection to server");
        this.fire("close");
        this.fire("stateChange", this.socket.readyState);
    }
    received(event) {
        const events = event.data
            .split("\n")
            .map((ev) => ev.trim())
            .filter((ev) => ev.length > 0);
        events.forEach((ev) => {
            const response = JSON.parse(ev !== null && ev !== void 0 ? ev : '""');
            if ("error" in response) {
                console.error("Received error from ws: ", response.error);
                // TODO show in UI somehow
                return;
            }
            switch (response.type) {
                case "response":
                    if (response.request_id in this.pending) {
                        this.pending[response.request_id](response);
                        delete this.pending[response.request_id];
                    }
                    else {
                        console.warn("Received a response for an unregistered request: ", response);
                    }
                    break;
                case "push": {
                    if (response.key in this.keySubscriptions) {
                        this.keySubscriptions[response.key].forEach((fn) => fn(response.new_value, response.key));
                    }
                    Object.entries(this.prefixSubscriptions)
                        .filter(([k]) => response.key.startsWith(k))
                        .forEach(([_, subscribers]) => {
                        subscribers.forEach((fn) => fn(response.new_value, response.key));
                    });
                    break;
                }
                default:
                // Do nothing
            }
        });
    }
    auth() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Ask for challenge
            const request = (yield this.send({ command: "klogin" }));
            if ("error" in request) {
                throw new Error(request.error);
            }
            // Calculate hash and send back
            const hash = yield authChallenge((_a = this.password) !== null && _a !== void 0 ? _a : "", request.data.challenge, request.data.salt);
            const response = (yield this.send({
                command: "kauth",
                data: { hash },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
        });
    }
    /**
     * Send a request to the server
     * @param msg Request to send
     * @returns Response from server
     */
    send(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = Object.assign(Object.assign({}, msg), { request_id: "request_id" in msg ? msg.request_id : generateRid() });
            return new Promise((resolve) => {
                const payload = JSON.stringify(message);
                this.socket.send(payload);
                this.pending[message.request_id] = resolve;
            });
        });
    }
    /**
     * Set a key to a specified value
     * @param key Key to set
     * @param data Value to set
     * @returns Reply from server
     */
    putKey(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.send({
                command: "kset",
                data: {
                    key,
                    data,
                },
            });
        });
    }
    /**
     * Set multiple keys at once
     * @param data Map of key:value data to set
     * @returns Reply from server
     */
    putKeys(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.send({
                command: "kset-bulk",
                data,
            });
        });
    }
    /**
     * Set a key to the JSON representation of an object
     * @param key Key to set
     * @param data Object to save
     * @returns Reply from server
     */
    putJSON(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.send({
                command: "kset",
                data: {
                    key,
                    data: JSON.stringify(data),
                },
            });
        });
    }
    /**
     * Set multiple keys at once
     * @param data Map of key:value data to set
     * @returns Reply from server
     */
    putJSONs(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonData = {};
            Object.entries(data).forEach(([k, v]) => {
                jsonData[k] = JSON.stringify(v);
            });
            return this.send({
                command: "kset-bulk",
                data: jsonData,
            });
        });
    }
    /**
     * Retrieve value for key
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget",
                data: {
                    key,
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            return response.data;
        });
    }
    /**
     * Retrieve value for key
     * @param keys Keys to retrieve
     * @returns Reply from server
     */
    getKeys(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget-bulk",
                data: {
                    keys,
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            return response.data;
        });
    }
    /**
     * Retrieve all keys with given prefix
     * @param prefix Prefix for keys to retrieve
     * @returns Reply from server
     */
    getKeysByPrefix(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget-all",
                data: {
                    prefix,
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            return response.data;
        });
    }
    /**
     * Retrieve object from key, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSON(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget",
                data: {
                    key,
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            return JSON.parse(response.data);
        });
    }
    /**
     * Retrieve objects from keys, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSONs(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget-bulk",
                data: {
                    keys,
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            const returnData = {};
            Object.entries(response.data).forEach(([k, v]) => {
                returnData[k] = JSON.parse(v);
            });
            return returnData;
        });
    }
    /**
     * Subscribe to key changes
     * @param key Key to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribeKey(key, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (key in this.keySubscriptions) {
                this.keySubscriptions[key].push(fn);
            }
            else {
                this.keySubscriptions[key] = [fn];
            }
            return this.send({
                command: "ksub",
                data: {
                    key,
                },
            });
        });
    }
    /**
     * Stop calling a callback when its related key changes
     * This only
     * @param key Key to unsubscribe from
     * @param fn Callback to stop calling
     * @returns true if a subscription was removed, false otherwise
     */
    unsubscribeKey(key, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(key in this.keySubscriptions)) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from key "${key}" but no subscriptions could be found!`);
                return false;
            }
            // Get subscriber in list
            const index = this.keySubscriptions[key].findIndex((subfn) => subfn === fn);
            if (index < 0) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from key "${key}" but specified function is not in the subscribers!`);
                return false;
            }
            // Remove subscriber from list
            this.keySubscriptions[key].splice(index, 1);
            // Check if array is empty
            if (this.keySubscriptions[key].length < 1) {
                // Send unsubscribe
                const res = (yield this.send({
                    command: "kunsub",
                    data: {
                        key,
                    },
                }));
                if ("error" in res) {
                    console.warn(`unsubscribe failed: ${res.error}`);
                }
                return res.ok;
            }
            return true;
        });
    }
    /**
     * Subscribe to key changes on a prefix
     * @param prefix Prefix of keys to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribePrefix(prefix, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (prefix in this.keySubscriptions) {
                this.prefixSubscriptions[prefix].push(fn);
            }
            else {
                this.prefixSubscriptions[prefix] = [fn];
            }
            return this.send({
                command: "ksub-prefix",
                data: {
                    prefix,
                },
            });
        });
    }
    /**
     * Stop calling a callback when their prefix's related key changes
     * This only
     * @param prefix Prefix to unsubscribe from
     * @param fn Callback to stop calling
     * @returns true if a subscription was removed, false otherwise
     */
    unsubscribePrefix(prefix, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(prefix in this.prefixSubscriptions)) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from prefix "${prefix}" but no subscriptions could be found!`);
                return false;
            }
            // Get subscriber in list
            const index = this.prefixSubscriptions[prefix].findIndex((subfn) => subfn === fn);
            if (index < 0) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from key "${prefix}" but specified function is not in the subscribers!`);
                return false;
            }
            // Remove subscriber from list
            this.prefixSubscriptions[prefix].splice(index, 1);
            // Check if array is empty
            if (this.prefixSubscriptions[prefix].length < 1) {
                // Send unsubscribe
                const res = (yield this.send({
                    command: "kunsub-prefix",
                    data: {
                        prefix,
                    },
                }));
                if ("error" in res) {
                    console.warn(`unsubscribe failed: ${res.error}`);
                }
                return res.ok;
            }
            return true;
        });
    }
    /**
     * Returns a list of saved keys with the given prefix.
     * If no prefix is given then returns all the keys.
     * @param prefix Optional prefix
     * @returns List of keys
     */
    keyList(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "klist",
                data: {
                    prefix: prefix !== null && prefix !== void 0 ? prefix : "",
                },
            }));
            if ("error" in response) {
                throw new Error(response.error);
            }
            return response.data;
        });
    }
}
