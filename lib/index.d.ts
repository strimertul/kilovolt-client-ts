import { EventEmitter } from "@billjs/event-emitter";
export declare type SubscriptionHandler = (newValue: string) => void;
interface wsError {
    ok: false;
    error: string;
}
interface wsPush {
    type: "push";
    key: string;
    new_value: string;
}
interface wsGenericResponse {
    ok: true;
    type: "response";
    cmd: string;
    data: string;
}
interface wsEmptyResponse {
    ok: true;
    type: "response";
    cmd: string;
}
export declare type wsMessage = wsError | wsPush | wsGenericResponse | wsEmptyResponse;
export default class KilovoltWS extends EventEmitter {
    socket: WebSocket;
    address: string;
    pending: Record<string, (response: wsMessage) => void>;
    subscriptions: Record<string, SubscriptionHandler[]>;
    constructor(address?: string);
    reconnect(): void;
    private connect;
    wait(): Promise<void>;
    private open;
    private closed;
    private received;
    send<T>(msg: T): Promise<wsMessage>;
    putKey(key: string, data: string): Promise<wsMessage>;
    putJSON<T>(key: string, data: T): Promise<wsMessage>;
    getKey(key: string): Promise<string>;
    getJSON<T>(key: string): Promise<T>;
    subscribe(key: string, fn: SubscriptionHandler): Promise<wsMessage>;
    unsubscribe(key: string, fn: SubscriptionHandler): Promise<boolean>;
}
export {};
