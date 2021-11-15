import { EventEmitter } from "@billjs/event-emitter";
export declare type SubscriptionHandler = (newValue: string, key: string) => void;
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
interface kvGenericResponse<T> {
    ok: true;
    type: "response";
    request_id: string;
    data: T;
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
interface kvGetBulk {
    command: "kget-bulk";
    request_id: string;
    data: {
        keys: string[];
    };
}
interface kvGetAll {
    command: "kget-all";
    request_id: string;
    data: {
        prefix: string;
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
interface kvSetBulk {
    command: "kset-bulk";
    request_id: string;
    data: Record<string, string>;
}
interface kvSubscribeKey {
    command: "ksub";
    request_id: string;
    data: {
        key: string;
    };
}
interface kvUnsubscribeKey {
    command: "kunsub";
    request_id: string;
    data: {
        key: string;
    };
}
interface kvSubscribePrefix {
    command: "ksub-prefix";
    request_id: string;
    data: {
        prefix: string;
    };
}
interface kvUnsubscribePrefix {
    command: "kunsub-prefix";
    request_id: string;
    data: {
        prefix: string;
    };
}
interface kvVersion {
    command: "kversion";
    request_id: string;
}
interface kvKeyList {
    command: "klist";
    request_id: string;
    data: {
        prefix?: string;
    };
}
export declare type KilovoltRequest = kvGet | kvGetBulk | kvGetAll | kvSet | kvSetBulk | kvSubscribeKey | kvUnsubscribeKey | kvSubscribePrefix | kvUnsubscribePrefix | kvVersion | kvKeyList;
declare type KilovoltResponse = kvGenericResponse<string> | kvGenericResponse<Record<string, string>> | kvEmptyResponse;
export declare type KilovoltMessage = kvError | kvPush | KilovoltResponse;
export default class KilovoltWS extends EventEmitter {
    private socket;
    private address;
    private pending;
    private keySubscriptions;
    private prefixSubscriptions;
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
     * Set multiple keys at once
     * @param data Map of key:value data to set
     * @returns Reply from server
     */
    putKeys(data: Record<string, string>): Promise<KilovoltMessage>;
    /**
     * Set a key to the JSON representation of an object
     * @param key Key to set
     * @param data Object to save
     * @returns Reply from server
     */
    putJSON<T>(key: string, data: T): Promise<KilovoltMessage>;
    /**
     * Set multiple keys at once
     * @param data Map of key:value data to set
     * @returns Reply from server
     */
    putJSONs(data: Record<string, unknown>): Promise<KilovoltMessage>;
    /**
     * Retrieve value for key
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getKey(key: string): Promise<string>;
    /**
     * Retrieve value for key
     * @param keys Keys to retrieve
     * @returns Reply from server
     */
    getKeys(keys: string[]): Promise<Record<string, string>>;
    /**
     * Retrieve all keys with given prefix
     * @param prefix Prefix for keys to retrieve
     * @returns Reply from server
     */
    getKeysByPrefix(prefix: string): Promise<Record<string, string>>;
    /**
     * Retrieve object from key, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSON<T>(key: string): Promise<T>;
    /**
     * Retrieve objects from keys, deserialized from JSON.
     * It's your responsibility to make sure the object is actually what you expect
     * @param key Key to retrieve
     * @returns Reply from server
     */
    getJSONs<T>(keys: string[]): Promise<T>;
    /**
     * Subscribe to key changes
     * @param key Key to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribeKey(key: string, fn: SubscriptionHandler): Promise<KilovoltMessage>;
    /**
     * Stop calling a callback when its related key changes
     * This only
     * @param key Key to unsubscribe from
     * @param fn Callback to stop calling
     * @returns true if a subscription was removed, false otherwise
     */
    unsubscribeKey(key: string, fn: SubscriptionHandler): Promise<boolean>;
    /**
     * Subscribe to key changes on a prefix
     * @param prefix Prefix of keys to subscribe to
     * @param fn Callback to call when key changes
     * @returns Reply from server
     */
    subscribePrefix(prefix: string, fn: SubscriptionHandler): Promise<KilovoltMessage>;
    /**
     * Stop calling a callback when their prefix's related key changes
     * This only
     * @param prefix Prefix to unsubscribe from
     * @param fn Callback to stop calling
     * @returns true if a subscription was removed, false otherwise
     */
    unsubscribePrefix(prefix: string, fn: SubscriptionHandler): Promise<boolean>;
    /**
     * Returns a list of saved keys with the given prefix.
     * If no prefix is given then returns all the keys.
     * @param prefix Optional prefix
     * @returns List of keys
     */
    keyList(prefix?: string): Promise<string[]>;
}
export {};
