import { EventEmitter } from "@billjs/event-emitter";

export type SubscriptionHandler = (newValue: string, key: string) => void;

interface kvError {
  ok: false;
  error: string;
  request_id: string;
}

interface kvPush {
  type: "push";
  key: string;
  // eslint-disable-next-line camelcase
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
  data: { key: string };
}

interface kvGetBulk {
  command: "kget-bulk";
  request_id: string;
  data: { keys: string[] };
}

interface kvGetAll {
  command: "kget-all";
  request_id: string;
  data: { prefix: string };
}

interface kvSet {
  command: "kset";
  request_id: string;
  data: { key: string; data: string };
}

interface kvSetBulk {
  command: "kset-bulk";
  request_id: string;
  data: Record<string, string>;
}

interface kvSubscribeKey {
  command: "ksub";
  request_id: string;
  data: { key: string };
}

interface kvUnsubscribeKey {
  command: "kunsub";
  request_id: string;
  data: { key: string };
}

interface kvSubscribePrefix {
  command: "ksub-prefix";
  request_id: string;
  data: { prefix: string };
}

interface kvUnsubscribePrefix {
  command: "kunsub-prefix";
  request_id: string;
  data: { prefix: string };
}

interface kvVersion {
  command: "kversion";
  request_id: string;
}

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
  | kvVersion;

type KilovoltResponse =
  | kvGenericResponse<string>
  | kvGenericResponse<Record<string, string>>
  | kvEmptyResponse;

export type KilovoltMessage = kvError | kvPush | KilovoltResponse;

function generateRid() {
  return Math.random().toString(32);
}

export default class KilovoltWS extends EventEmitter {
  private socket!: WebSocket;

  private address: string;

  private pending: Record<string, (response: KilovoltMessage) => void>;

  private keySubscriptions: Record<string, SubscriptionHandler[]>;
  private prefixSubscriptions: Record<string, SubscriptionHandler[]>;

  /**
   * Create a new Kilovolt client instance and connect to it
   * @param address Kilovolt server endpoint (including path)
   */
  constructor(address = "ws://localhost:4337/ws") {
    super();
    this.address = address;
    this.pending = {};
    this.keySubscriptions = {};
    this.prefixSubscriptions = {};
    this.connect(address);
  }

  /**
   * Re-connect to kilovolt server
   */
  reconnect(): void {
    this.connect(this.address);
  }

  private connect(address: string): void {
    this.socket = new WebSocket(address);
    this.socket.addEventListener("open", this.open.bind(this));
    this.socket.addEventListener("message", this.received.bind(this));
    this.socket.addEventListener("close", this.closed.bind(this));
  }

  /**
   * Wait for websocket connection to be established
   */
  async wait(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket.readyState === this.socket.OPEN) {
        resolve();
        return;
      }
      this.once("open", () => resolve());
    });
  }

  private open() {
    console.info("connected to server");
    this.fire("open");
    this.fire("stateChange", this.socket.readyState);
  }

  private closed() {
    console.warn("lost connection to server");
    this.fire("close");
    this.fire("stateChange", this.socket.readyState);
  }

  private received(event: MessageEvent) {
    const events = (event.data as string)
      .split("\n")
      .map((ev) => ev.trim())
      .filter((ev) => ev.length > 0);
    events.forEach((ev) => {
      const response: KilovoltMessage = JSON.parse(ev ?? '""');
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

  /**
   * Send a request to the server
   * @param msg Request to send
   * @returns Response from server
   */
  async send(msg: KilovoltRequest): Promise<KilovoltMessage> {
    return new Promise((resolve) => {
      const payload = JSON.stringify(msg);
      this.socket.send(payload);
      this.pending[msg.request_id] = resolve;
    });
  }

  /**
   * Set a key to a specified value
   * @param key Key to set
   * @param data Value to set
   * @returns Reply from server
   */
  async putKey(key: string, data: string): Promise<KilovoltMessage> {
    return this.send({
      command: "kset",
      request_id: generateRid(),
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
  async putKeys(data: Record<string, string>): Promise<KilovoltMessage> {
    return this.send({
      command: "kset-bulk",
      request_id: generateRid(),
      data,
    });
  }

  /**
   * Set a key to the JSON representation of an object
   * @param key Key to set
   * @param data Object to save
   * @returns Reply from server
   */
  async putJSON<T>(key: string, data: T): Promise<KilovoltMessage> {
    return this.send({
      command: "kset",
      request_id: generateRid(),
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
  async putJSONs(data: Record<string, unknown>): Promise<KilovoltMessage> {
    const jsonData: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      jsonData[k] = JSON.stringify(v);
    });
    return this.send({
      command: "kset-bulk",
      request_id: generateRid(),
      data: jsonData,
    });
  }

  /**
   * Retrieve value for key
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getKey(key: string): Promise<string> {
    const response = (await this.send({
      command: "kget",
      request_id: generateRid(),
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
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getKeys(keys: string[]): Promise<Record<string, string>> {
    const response = (await this.send({
      command: "kget-bulk",
      request_id: generateRid(),
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
   * Retrieve object from key, deserialized from JSON.
   * It's your responsibility to make sure the object is actually what you expect
   * @param key Key to retrieve
   * @returns Reply from server
   */
  async getJSON<T>(key: string): Promise<T> {
    const response = (await this.send({
      command: "kget",
      request_id: generateRid(),
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
    const response = (await this.send({
      command: "kget-bulk",
      request_id: generateRid(),
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
  async subscribeKey(
    key: string,
    fn: SubscriptionHandler
  ): Promise<KilovoltMessage> {
    if (key in this.keySubscriptions) {
      this.keySubscriptions[key].push(fn);
    } else {
      this.keySubscriptions[key] = [fn];
    }

    return this.send({
      command: "ksub",
      request_id: generateRid(),
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
      const res = (await this.send({
        command: "kunsub",
        request_id: generateRid(),
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
  async subscribePrefix(
    prefix: string,
    fn: SubscriptionHandler
  ): Promise<KilovoltMessage> {
    if (prefix in this.keySubscriptions) {
      this.prefixSubscriptions[prefix].push(fn);
    } else {
      this.prefixSubscriptions[prefix] = [fn];
    }

    return this.send({
      command: "ksub-prefix",
      request_id: generateRid(),
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
      const res = (await this.send({
        command: "kunsub-prefix",
        request_id: generateRid(),
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
}
