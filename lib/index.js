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
function generateRid() {
    return Math.random().toString(32);
}
export default class KilovoltWS extends EventEmitter {
    /**
     * Create a new Kilovolt client instance and connect to it
     * @param address Kilovolt server endpoint (including path)
     */
    constructor(address = "ws://localhost:4337/ws") {
        super();
        this.address = address;
        this.pending = {};
        this.subscriptions = {};
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
        console.info("connected to server");
        this.fire("open");
        this.fire("stateChange", this.socket.readyState);
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
                    if (response.key in this.subscriptions) {
                        this.subscriptions[response.key].forEach((fn) => fn(response.new_value));
                    }
                    else {
                        console.warn("Received subscription push with no listeners: ", response);
                    }
                    break;
                }
                default:
                // Do nothing
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
            return new Promise((resolve) => {
                const payload = JSON.stringify(msg);
                this.socket.send(payload);
                this.pending[msg.request_id] = resolve;
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
                request_id: generateRid(),
                data: {
                    key,
                    data,
                },
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
                request_id: generateRid(),
                data: {
                    key,
                    data: JSON.stringify(data),
                },
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
                request_id: generateRid(),
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
     * Retrieve object from key, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSON(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield this.send({
                command: "kget",
                request_id: generateRid(),
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
     * Subscribe to key changes
     * @param key Key to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribe(key, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (key in this.subscriptions) {
                this.subscriptions[key].push(fn);
            }
            else {
                this.subscriptions[key] = [fn];
            }
            return this.send({
                command: "ksub",
                request_id: generateRid(),
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
    unsubscribe(key, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(key in this.subscriptions)) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from key "${key}" but no subscriptions could be found!`);
                return false;
            }
            // Get subscriber in list
            const index = this.subscriptions[key].findIndex((subfn) => subfn === fn);
            if (index < 0) {
                // No subscriptions, just warn and return
                console.warn(`Trying to unsubscribe from key "${key}" but specified function is not in the subscribers!`);
                return false;
            }
            // Remove subscriber from list
            this.subscriptions[key].splice(index, 1);
            // Check if array is empty
            if (this.subscriptions[key].length < 1) {
                // Send unsubscribe
                const res = (yield this.send({
                    command: "kunsub",
                    request_id: generateRid(),
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
}
