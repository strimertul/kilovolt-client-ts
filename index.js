var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// node_modules/@billjs/event-emitter/lib/index.js
var require_lib = __commonJS({
  "node_modules/@billjs/event-emitter/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventEmitter2 = function() {
      function EventEmitter3() {
        this._eventHandlers = {};
      }
      EventEmitter3.prototype.isValidType = function(type) {
        return typeof type === "string";
      };
      EventEmitter3.prototype.isValidHandler = function(handler) {
        return typeof handler === "function";
      };
      EventEmitter3.prototype.on = function(type, handler) {
        if (!type || !handler)
          return false;
        if (!this.isValidType(type))
          return false;
        if (!this.isValidHandler(handler))
          return false;
        var handlers = this._eventHandlers[type];
        if (!handlers)
          handlers = this._eventHandlers[type] = [];
        if (handlers.indexOf(handler) >= 0)
          return false;
        handler._once = false;
        handlers.push(handler);
        return true;
      };
      EventEmitter3.prototype.once = function(type, handler) {
        if (!type || !handler)
          return false;
        if (!this.isValidType(type))
          return false;
        if (!this.isValidHandler(handler))
          return false;
        var ret = this.on(type, handler);
        if (ret) {
          handler._once = true;
        }
        return ret;
      };
      EventEmitter3.prototype.off = function(type, handler) {
        if (!type)
          return this.offAll();
        if (!handler) {
          this._eventHandlers[type] = [];
          return;
        }
        if (!this.isValidType(type))
          return;
        if (!this.isValidHandler(handler))
          return;
        var handlers = this._eventHandlers[type];
        if (!handlers || !handlers.length)
          return;
        for (var i = 0; i < handlers.length; i++) {
          var fn = handlers[i];
          if (fn === handler) {
            handlers.splice(i, 1);
            break;
          }
        }
      };
      EventEmitter3.prototype.offAll = function() {
        this._eventHandlers = {};
      };
      EventEmitter3.prototype.fire = function(type, data) {
        if (!type || !this.isValidType(type))
          return;
        var handlers = this._eventHandlers[type];
        if (!handlers || !handlers.length)
          return;
        var event = this.createEvent(type, data);
        for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
          var handler = handlers_1[_i];
          if (!this.isValidHandler(handler))
            continue;
          if (handler._once)
            event.once = true;
          handler(event);
          if (event.once)
            this.off(type, handler);
        }
      };
      EventEmitter3.prototype.has = function(type, handler) {
        if (!type || !this.isValidType(type))
          return false;
        var handlers = this._eventHandlers[type];
        if (!handlers || !handlers.length)
          return false;
        if (!handler || !this.isValidHandler(handler))
          return true;
        return handlers.indexOf(handler) >= 0;
      };
      EventEmitter3.prototype.getHandlers = function(type) {
        if (!type || !this.isValidType(type))
          return [];
        return this._eventHandlers[type] || [];
      };
      EventEmitter3.prototype.createEvent = function(type, data, once) {
        if (once === void 0) {
          once = false;
        }
        var event = { type, data, timestamp: Date.now(), once };
        return event;
      };
      return EventEmitter3;
    }();
    exports.EventEmitter = EventEmitter2;
    exports.globalEvent = new EventEmitter2();
  }
});

// src/index.ts
var import_event_emitter = __toModule(require_lib());

// src/utils.ts
function base64ToBytesArr(str) {
  const abc = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  ];
  const result = [];
  for (let i = 0; i < str.length / 4; i++) {
    let chunk = [...str.slice(4 * i, 4 * i + 4)];
    let bin = chunk.map((x) => abc.indexOf(x).toString(2).padStart(6, "0")).join("");
    let bytes = bin.match(/.{1,8}/g).map((x) => +("0b" + x));
    result.push(...bytes.slice(0, 3 - (str[4 * i + 2] == "=" ? 1 : 0) - (str[4 * i + 3] == "=" ? 1 : 0)));
  }
  return result;
}
function bytesArrToBase64(arr) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bin = (n) => n.toString(2).padStart(8, "0");
  const l = arr.length;
  let result = "";
  for (let i = 0; i <= (l - 1) / 3; i++) {
    const c1 = i * 3 + 1 >= l;
    const c2 = i * 3 + 2 >= l;
    const chunk = bin(arr[3 * i]) + bin(c1 ? 0 : arr[3 * i + 1]) + bin(c2 ? 0 : arr[3 * i + 2]);
    const r = chunk.match(/.{1,6}/g).map((x, j) => j == 3 && c2 ? "=" : j == 2 && c1 ? "=" : abc[+("0b" + x)]);
    result += r.join("");
  }
  return result;
}

// src/index.ts
function generateRid() {
  return Math.random().toString(32);
}
function authChallenge(password, challenge, salt) {
  return __async(this, null, function* () {
    const enc = new TextEncoder();
    const keyBytes = enc.encode(password);
    const saltBytes = base64ToBytesArr(salt);
    const challengeKey = Uint8Array.from([...keyBytes, ...saltBytes]);
    const challengeBytes = base64ToBytesArr(challenge);
    const key = yield window.crypto.subtle.importKey("raw", challengeKey, { name: "HMAC", hash: { name: "SHA-512" } }, false, ["sign", "verify"]);
    const signature = yield window.crypto.subtle.sign("HMAC", key, Uint8Array.from(challengeBytes));
    return bytesArrToBase64(Array.from(new Uint8Array(signature)));
  });
}
var KilovoltWS = class extends import_event_emitter.EventEmitter {
  constructor(address = "ws://localhost:4337/ws") {
    super();
    this.address = address;
    this.pending = {};
    this.keySubscriptions = {};
    this.prefixSubscriptions = {};
    this.connect(address);
  }
  reconnect() {
    this.connect(this.address);
  }
  connect(address, password) {
    this.password = password;
    this.socket = new WebSocket(address);
    this.socket.addEventListener("open", this.open.bind(this));
    this.socket.addEventListener("message", this.received.bind(this));
    this.socket.addEventListener("close", this.closed.bind(this));
  }
  wait() {
    return __async(this, null, function* () {
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
    return __async(this, null, function* () {
      console.info("connected to server");
      if (this.password) {
        yield this.auth();
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
    const events = event.data.split("\n").map((ev) => ev.trim()).filter((ev) => ev.length > 0);
    events.forEach((ev) => {
      const response = JSON.parse(ev != null ? ev : '""');
      if ("error" in response) {
        console.error("Received error from ws: ", response.error);
        return;
      }
      switch (response.type) {
        case "response":
          if (response.request_id in this.pending) {
            this.pending[response.request_id](response);
            delete this.pending[response.request_id];
          } else {
            console.warn("Received a response for an unregistered request: ", response);
          }
          break;
        case "push": {
          if (response.key in this.keySubscriptions) {
            this.keySubscriptions[response.key].forEach((fn) => fn(response.new_value, response.key));
          }
          Object.entries(this.prefixSubscriptions).filter(([k]) => response.key.startsWith(k)).forEach(([_, subscribers]) => {
            subscribers.forEach((fn) => fn(response.new_value, response.key));
          });
          break;
        }
        default:
      }
    });
  }
  auth() {
    return __async(this, null, function* () {
      var _a;
      const request = yield this.send({ command: "klogin" });
      if ("error" in request) {
        throw new Error(request.error);
      }
      const hash = yield authChallenge((_a = this.password) != null ? _a : "", request.data.challenge, request.data.salt);
      const response = yield this.send({
        command: "kauth",
        data: { hash }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
    });
  }
  send(msg) {
    return __async(this, null, function* () {
      const message = __spreadProps(__spreadValues({}, msg), {
        request_id: "request_id" in msg ? msg.request_id : generateRid()
      });
      return new Promise((resolve) => {
        const payload = JSON.stringify(message);
        this.socket.send(payload);
        this.pending[message.request_id] = resolve;
      });
    });
  }
  putKey(key, data) {
    return __async(this, null, function* () {
      return this.send({
        command: "kset",
        data: {
          key,
          data
        }
      });
    });
  }
  putKeys(data) {
    return __async(this, null, function* () {
      return this.send({
        command: "kset-bulk",
        data
      });
    });
  }
  putJSON(key, data) {
    return __async(this, null, function* () {
      return this.send({
        command: "kset",
        data: {
          key,
          data: JSON.stringify(data)
        }
      });
    });
  }
  putJSONs(data) {
    return __async(this, null, function* () {
      const jsonData = {};
      Object.entries(data).forEach(([k, v]) => {
        jsonData[k] = JSON.stringify(v);
      });
      return this.send({
        command: "kset-bulk",
        data: jsonData
      });
    });
  }
  getKey(key) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "kget",
        data: {
          key
        }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.data;
    });
  }
  getKeys(keys) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "kget-bulk",
        data: {
          keys
        }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.data;
    });
  }
  getKeysByPrefix(prefix) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "kget-all",
        data: {
          prefix
        }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.data;
    });
  }
  getJSON(key) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "kget",
        data: {
          key
        }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return JSON.parse(response.data);
    });
  }
  getJSONs(keys) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "kget-bulk",
        data: {
          keys
        }
      });
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
  subscribeKey(key, fn) {
    return __async(this, null, function* () {
      if (key in this.keySubscriptions) {
        this.keySubscriptions[key].push(fn);
      } else {
        this.keySubscriptions[key] = [fn];
      }
      return this.send({
        command: "ksub",
        data: {
          key
        }
      });
    });
  }
  unsubscribeKey(key, fn) {
    return __async(this, null, function* () {
      if (!(key in this.keySubscriptions)) {
        console.warn(`Trying to unsubscribe from key "${key}" but no subscriptions could be found!`);
        return false;
      }
      const index = this.keySubscriptions[key].findIndex((subfn) => subfn === fn);
      if (index < 0) {
        console.warn(`Trying to unsubscribe from key "${key}" but specified function is not in the subscribers!`);
        return false;
      }
      this.keySubscriptions[key].splice(index, 1);
      if (this.keySubscriptions[key].length < 1) {
        const res = yield this.send({
          command: "kunsub",
          data: {
            key
          }
        });
        if ("error" in res) {
          console.warn(`unsubscribe failed: ${res.error}`);
        }
        return res.ok;
      }
      return true;
    });
  }
  subscribePrefix(prefix, fn) {
    return __async(this, null, function* () {
      if (prefix in this.keySubscriptions) {
        this.prefixSubscriptions[prefix].push(fn);
      } else {
        this.prefixSubscriptions[prefix] = [fn];
      }
      return this.send({
        command: "ksub-prefix",
        data: {
          prefix
        }
      });
    });
  }
  unsubscribePrefix(prefix, fn) {
    return __async(this, null, function* () {
      if (!(prefix in this.prefixSubscriptions)) {
        console.warn(`Trying to unsubscribe from prefix "${prefix}" but no subscriptions could be found!`);
        return false;
      }
      const index = this.prefixSubscriptions[prefix].findIndex((subfn) => subfn === fn);
      if (index < 0) {
        console.warn(`Trying to unsubscribe from key "${prefix}" but specified function is not in the subscribers!`);
        return false;
      }
      this.prefixSubscriptions[prefix].splice(index, 1);
      if (this.prefixSubscriptions[prefix].length < 1) {
        const res = yield this.send({
          command: "kunsub-prefix",
          data: {
            prefix
          }
        });
        if ("error" in res) {
          console.warn(`unsubscribe failed: ${res.error}`);
        }
        return res.ok;
      }
      return true;
    });
  }
  keyList(prefix) {
    return __async(this, null, function* () {
      const response = yield this.send({
        command: "klist",
        data: {
          prefix: prefix != null ? prefix : ""
        }
      });
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.data;
    });
  }
};
export {
  KilovoltWS as default
};
/**
 * A simple and lightweight EventEmitter by TypeScript for Node.js or Browsers.
 *
 * @author billjs
 * @see https://github.com/billjs/event-emitter
 * @license MIT(https://opensource.org/licenses/MIT)
 */
