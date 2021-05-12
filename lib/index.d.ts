import { EventEmitter } from "@billjs/event-emitter";
export declare type SubscriptionHandler = (newValue: string) => void;
interface kvError {
    ok: false;
    error: string;
    request_id: string;
}
interface kvPush {
    type: "push";
    key: string;
    new_value: string;
}
interface kvGenericResponse {
    ok: true;
    type: "response";
    request_id: string;
    data: string;
}
interface kvEmptyResponse {
    ok: true;
    type: "response";
    request_id: string;
}
interface kvGet {
    command: "kget";
    request_id: string;
    data: {
        key: string;
    };
}
interface kvSet {
    command: "kset";
    request_id: string;
    data: {
        key: string;
        data: string;
    };
}
interface kvSubscribe {
    command: "ksub";
    request_id: string;
    data: {
        key: string;
    };
}
interface kvUnsubscribe {
    command: "kunsub";
    request_id: string;
    data: {
        key: string;
    };
}
interface kvVersion {
    command: "kversion";
    request_id: string;
}
export declare type KilovoltRequest = kvGet | kvSet | kvSubscribe | kvUnsubscribe | kvVersion;
declare type KilovoltResponse = kvGenericResponse | kvEmptyResponse;
export declare type KilovoltMessage = kvError | kvPush | KilovoltResponse;
export default class KilovoltWS extends EventEmitter {
    socket: WebSocket;
    address: string;
    pending: Record<string, (response: KilovoltMessage) => void>;
    subscriptions: Record<string, SubscriptionHandler[]>;
    /**
     * Create a new Kilovolt client instance and connect to it
     * @param address Kilovolt server endpoint (including path)
     */
    constructor(address?: string);
    /**
     * Re-connect to kilovolt server
     */
    reconnect(): void;
    private connect;
    /**
     * Wait for websocket connection to be established
     */
    wait(): Promise<void>;
    private open;
    private closed;
    private received;
    /**
     * Send a request to the server
     * @param msg Request to send
     * @returns Response from server
     */
    send(msg: KilovoltRequest): Promise<KilovoltMessage>;
    /**
     * Set a key to a specified value
     * @param key Key to set
     * @param data Value to set
     * @returns Reply from server
     */
    putKey(key: string, data: string): Promise<KilovoltMessage>;
    /**
     * Set a key to the JSON representation of an object
     * @param key Key to set
     * @param data Object to save
     * @returns Reply from server
     */
    putJSON<T>(key: string, data: T): Promise<KilovoltMessage>;
    /**
     * Retrieve value for key
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getKey(key: string): Promise<string>;
    /**
     * Retrieve object from key, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSON<T>(key: string): Promise<T>;
    /**
     * Subscribe to key changes
     * @param key Key to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribe(key: string, fn: SubscriptionHandler): Promise<KilovoltMessage>;
    /**
     * Stop calling a callback when its related key changes
     * This only
     * @param key Key to unsubscribe from
     * @param fn Callback to stop calling
     * @returns true if a subscription was removed, false otherwise
     */
    unsubscribe(key: string, fn: SubscriptionHandler): Promise<boolean>;
}
export {};
