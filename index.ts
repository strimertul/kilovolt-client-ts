import { base64ToBytesArr, bytesArrToBase64, EventEmitter } from "./utils.ts";
import {
  kvGet,
  kvGetBulk,
  kvGetAll,
  kvSet,
  kvSetBulk,
  kvSubscribeKey,
  kvUnsubscribeKey,
  kvSubscribePrefix,
  kvUnsubscribePrefix,
  kvVersion,
  kvKeyList,
  kvLogin,
  kvError,
  kvPush,
  KilovoltResponse,
  kvGenericResponse,
  kvAuth,
  kvEmptyResponse,
  kvInternalClientID,
} from "./messages.ts";

export type SubscriptionHandler = (newValue: string, key: string) => void;

export type KilovoltRequest =
  | kvGet
  | kvGetBulk
  | kvGetAll
  | kvSet
  | kvSetBulk
  | kvSubscribeKey
  | kvUnsubscribeKey
  | kvSubscribePrefix
  | kvUnsubscribePrefix
  | kvVersion
  | kvKeyList
  | kvLogin
  | kvAuth
  | kvInternalClientID;

export type KilovoltMessage = kvError | kvPush | KilovoltResponse;

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
async function authChallenge(
  password: string,
  challenge: string,
  salt: string
) {
  // Encode password
  const enc = new TextEncoder();
  const keyBytes = enc.encode(password);
  const saltBytes = base64ToBytesArr(salt);
  const challengeKey = Uint8Array.from([...keyBytes, ...saltBytes]);
  const challengeBytes = base64ToBytesArr(challenge);

  const key = await window.crypto.subtle.importKey(
    "raw",
    challengeKey,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    key,
    Uint8Array.from(challengeBytes)
  );
  return bytesArrToBase64(Array.from(new Uint8Array(signature)));
}

interface ClientOptions {
  reconnect?: boolean;
}

export class Kilovolt extends EventEmitter {
  private socket!: WebSocket;

  private password?: string;
  private address: string;
  private options: ClientOptions;

  private pending: Record<string, (response: KilovoltMessage) => void>;

  private keySubscriptions: Record<string, SubscriptionHandler[]>;
  private prefixSubscriptions: Record<string, SubscriptionHandler[]>;

  /**
   * Create a new Kilovolt client instance and connect to it
   * @param address Kilovolt server endpoint (including path)
   */
  constructor(
    address = "ws://localhost:4337/ws",
    password?: string,
    options?: ClientOptions
  ) {
    super();
    this.address = address;
    this.password = password;
    this.pending = {};
    this.keySubscriptions = {};
    this.prefixSubscriptions = {};
    this.options = options || {};
    this.connect(address);
  }

  /**
   * Re-connect to kilovolt server
   */
  reconnect(): void {
    this.connect(this.address);
  }

  /**
   * Close connection to server
   */
  close(): void {
    this.options.reconnect = false;
    this.socket.close();
  }

  private connect(address: string): void {
    this.socket = new WebSocket(address);
    this.socket.addEventListener("open", this.open.bind(this));
    this.socket.addEventListener("message", this.received.bind(this));
    this.socket.addEventListener("close", this.closed.bind(this));
    this.socket.addEventListener("error", this.errored.bind(this));
  }

  /**
   * Wait for websocket connection to be established
   */
  wait(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket.readyState === this.socket.OPEN) {
        resolve();
        return;
      }
      this.once("open", () => resolve());
    });
  }

  private async open() {
    console.info("connected to server");
    // Authenticate if needed
    if (this.password) {
      try {
        await this.auth();
      } catch (e) {
        this.fire("error", e);
        this.close();
      }
    }
    this.resubscribe();
    this.fire("open");
    this.fire("stateChange", this.socket.readyState);
  }

  private closed(ev: CloseEvent) {
    console.warn(`lost connection to server: ${ev.reason}`);
    this.fire("close", ev);
    this.fire("stateChange", this.socket.readyState);
    // Try reconnecting after a few seconds
    if (this.options.reconnect) {
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  private errored(ev: Event) {
    this.fire("error", ev);
  }

  private received(event: MessageEvent) {
    const events = (event.data as string)
      .split("\n")
      .map((ev) => ev.trim())
      .filter((ev) => ev.length > 0);
    events.forEach((ev) => {
      const response: KilovoltMessage = JSON.parse(ev ?? '""');
      if ("error" in response) {
        this.fire("error", response);
        if ("request_id" in response && response.request_id in this.pending) {
          this.pending[response.request_id](response);
          delete this.pending[response.request_id];
        }
        return;
      }
      switch (response.type) {
        case "response":
          if (response.request_id in this.pending) {
            this.pending[response.request_id](response);
            delete this.pending[response.request_id];
          } else {
            console.warn(
              "Received a response for an unregistered request: ",
              response
            );
          }
          break;
        case "push": {
          if (response.key in this.keySubscriptions) {
            this.keySubscriptions[response.key].forEach((fn) =>
              fn(response.new_value, response.key)
            );
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

  private async auth() {
    // Ask for challenge
    const request = (await this.send<kvLogin>({ command: "klogin" })) as
      | kvError
      | kvGenericResponse<{ challenge: string; salt: string }>;
    if ("error" in request) {
      console.error("kilovolt auth error:", request.error);
      throw new Error(request.error);
    }
    // Calculate hash and send back
    const hash = await authChallenge(
      this.password ?? "",
      request.data.challenge,
      request.data.salt
    );
    const response = (await this.send<kvAuth>({
      command: "kauth",
      data: { hash },
    })) as kvError | kvEmptyResponse;
    if ("error" in response) {
      console.error("kilovolt auth error:", response.error);
      throw new Error(response.error);
    }
  }

  private async resubscribe() {
    for (const key in this.keySubscriptions) {
      await this.send<kvSubscribeKey>({
        command: "ksub",
        data: {
          key,
        },
      });
    }
    for (const prefix in this.prefixSubscriptions) {
      this.send<kvSubscribePrefix>({
        command: "ksub-prefix",
        data: {
          prefix,
        },
      });
    }
  }

  /**
   * Send a request to the server
   * @param msg Request to send
   * @returns Response from server
   */
  send<T extends KilovoltRequest>(
    msg: T | Omit<T, "request_id">
  ): Promise<KilovoltMessage> {
    if (this.socket.readyState !== this.socket.OPEN) {
      throw new Error("Not connected to server");
    }
    const message = {
      ...msg,
      request_id: "request_id" in msg ? msg.request_id : generateRid(),
    };
    return new Promise((resolve) => {
      const payload = JSON.stringify(message);
      this.socket.send(payload);
      this.pending[message.request_id] = resolve;
    });
  }

  /**
   * Set a key to a specified value
   * @param key Key to set
   * @param data Value to set
   * @returns Reply from server
   */
  putKey(key: string, data: string): Promise<KilovoltMessage> {
    return this.send<kvSet>({
      command: "kset",
      data: {
        key,
        data,
      },
    });
  }

  /**
   * Set multiple keys at once
   * @param data Map of key:value data to set
   * @returns Reply from server
   */
  putKeys(data: Record<string, string>): Promise<KilovoltMessage> {
    return this.send<kvSetBulk>({
      command: "kset-bulk",
      data,
    });
  }

  /**
   * Set a key to the JSON representation of an object
   * @param key Key to set
   * @param data Object to save
   * @returns Reply from server
   */
  putJSON<T>(key: string, data: T): Promise<KilovoltMessage> {
    return this.send<kvSet>({
      command: "kset",
      data: {
        key,
        data: JSON.stringify(data),
      },
    });
  }

  /**
   * Set multiple keys at once
   * @param data Map of key:value data to set
   * @returns Reply from server
   */
  putJSONs(data: Record<string, unknown>): Promise<KilovoltMessage> {
    const jsonData: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      jsonData[k] = JSON.stringify(v);
    });
    return this.send<kvSetBulk>({
      command: "kset-bulk",
      data: jsonData,
    });
  }

  /**
   * Retrieve value for key
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getKey(key: string): Promise<string> {
    const response = (await this.send<kvGet>({
      command: "kget",
      data: {
        key,
      },
    })) as kvError | kvGenericResponse<string>;
    if ("error" in response) {
      throw new Error(response.error);
    }
    return response.data;
  }

  /**
   * Retrieve value for key
   * @param keys Keys to retrieve
   * @returns Reply from server
   */
  async getKeys(keys: string[]): Promise<Record<string, string>> {
    const response = (await this.send<kvGetBulk>({
      command: "kget-bulk",
      data: {
        keys,
      },
    })) as kvError | kvGenericResponse<Record<string, string>>;
    if ("error" in response) {
      throw new Error(response.error);
    }
    return response.data;
  }

  /**
   * Retrieve all keys with given prefix
   * @param prefix Prefix for keys to retrieve
   * @returns Reply from server
   */
  async getKeysByPrefix(prefix: string): Promise<Record<string, string>> {
    const response = (await this.send<kvGetAll>({
      command: "kget-all",
      data: {
        prefix,
      },
    })) as kvError | kvGenericResponse<Record<string, string>>;
    if ("error" in response) {
      throw new Error(response.error);
    }
    return response.data;
  }

  /**
   * Retrieve object from key, deserialized from JSON.
   * It's your responsibility to make sure the object is actually what you expect
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getJSON<T>(key: string): Promise<T> {
    const response = (await this.send<kvGet>({
      command: "kget",
      data: {
        key,
      },
    })) as kvError | kvGenericResponse<string>;
    if ("error" in response) {
      throw new Error(response.error);
    }
    return JSON.parse(response.data);
  }

  /**
   * Retrieve objects from keys, deserialized from JSON.
   * It's your responsibility to make sure the object is actually what you expect
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getJSONs<T>(keys: string[]): Promise<T> {
    const response = (await this.send<kvGetBulk>({
      command: "kget-bulk",
      data: {
        keys,
      },
    })) as kvError | kvGenericResponse<Record<string, string>>;
    if ("error" in response) {
      throw new Error(response.error);
    }
    const returnData: Record<string, unknown> = {};
    Object.entries(response.data).forEach(([k, v]) => {
      returnData[k] = JSON.parse(v);
    });
    return returnData as T;
  }

  /**
   * Subscribe to key changes
   * @param key Key to subscribe to
   * @param fn Callback to call when key changes
   * @returns Reply from server
   */
  subscribeKey(key: string, fn: SubscriptionHandler): Promise<KilovoltMessage> {
    if (key in this.keySubscriptions) {
      this.keySubscriptions[key].push(fn);
    } else {
      this.keySubscriptions[key] = [fn];
    }

    return this.send<kvSubscribeKey>({
      command: "ksub",
      data: {
        key,
      },
    });
  }

  /**
   * Stop calling a callback when its related key changes
   * This only
   * @param key Key to unsubscribe from
   * @param fn Callback to stop calling
   * @returns true if a subscription was removed, false otherwise
   */
  async unsubscribeKey(key: string, fn: SubscriptionHandler): Promise<boolean> {
    if (!(key in this.keySubscriptions)) {
      // No subscriptions, just warn and return
      console.warn(
        `Trying to unsubscribe from key "${key}" but no subscriptions could be found!`
      );
      return false;
    }

    // Get subscriber in list
    const index = this.keySubscriptions[key].findIndex((subfn) => subfn === fn);
    if (index < 0) {
      // No subscriptions, just warn and return
      console.warn(
        `Trying to unsubscribe from key "${key}" but specified function is not in the subscribers!`
      );
      return false;
    }

    // Remove subscriber from list
    this.keySubscriptions[key].splice(index, 1);

    // Check if array is empty
    if (this.keySubscriptions[key].length < 1) {
      // Send unsubscribe
      const res = (await this.send<kvUnsubscribeKey>({
        command: "kunsub",
        data: {
          key,
        },
      })) as kvError | kvGenericResponse<void>;
      if ("error" in res) {
        console.warn(`unsubscribe failed: ${res.error}`);
      }
      return res.ok;
    }

    return true;
  }

  /**
   * Subscribe to key changes on a prefix
   * @param prefix Prefix of keys to subscribe to
   * @param fn Callback to call when key changes
   * @returns Reply from server
   */
  subscribePrefix(
    prefix: string,
    fn: SubscriptionHandler
  ): Promise<KilovoltMessage> {
    if (prefix in this.keySubscriptions) {
      this.prefixSubscriptions[prefix].push(fn);
    } else {
      this.prefixSubscriptions[prefix] = [fn];
    }

    return this.send<kvSubscribePrefix>({
      command: "ksub-prefix",
      data: {
        prefix,
      },
    });
  }

  /**
   * Stop calling a callback when their prefix's related key changes
   * This only
   * @param prefix Prefix to unsubscribe from
   * @param fn Callback to stop calling
   * @returns true if a subscription was removed, false otherwise
   */
  async unsubscribePrefix(
    prefix: string,
    fn: SubscriptionHandler
  ): Promise<boolean> {
    if (!(prefix in this.prefixSubscriptions)) {
      // No subscriptions, just warn and return
      console.warn(
        `Trying to unsubscribe from prefix "${prefix}" but no subscriptions could be found!`
      );
      return false;
    }

    // Get subscriber in list
    const index = this.prefixSubscriptions[prefix].findIndex(
      (subfn) => subfn === fn
    );
    if (index < 0) {
      // No subscriptions, just warn and return
      console.warn(
        `Trying to unsubscribe from key "${prefix}" but specified function is not in the subscribers!`
      );
      return false;
    }

    // Remove subscriber from list
    this.prefixSubscriptions[prefix].splice(index, 1);

    // Check if array is empty
    if (this.prefixSubscriptions[prefix].length < 1) {
      // Send unsubscribe
      const res = (await this.send<kvUnsubscribePrefix>({
        command: "kunsub-prefix",
        data: {
          prefix,
        },
      })) as kvError | kvGenericResponse<void>;
      if ("error" in res) {
        console.warn(`unsubscribe failed: ${res.error}`);
      }
      return res.ok;
    }

    return true;
  }

  /**
   * Returns a list of saved keys with the given prefix.
   * If no prefix is given then returns all the keys.
   * @param prefix Optional prefix
   * @returns List of keys
   */
  async keyList(prefix?: string): Promise<string[]> {
    const response = (await this.send<kvKeyList>({
      command: "klist",
      data: {
        prefix: prefix ?? "",
      },
    })) as kvError | kvGenericResponse<string[]>;

    if ("error" in response) {
      throw new Error(response.error);
    }

    return response.data;
  }
}

export default Kilovolt;
