const b64alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const b64array = [...b64alphabet];

// https://stackoverflow.com/a/62364519
export function base64ToBytesArr(str: string) {
  const result = [];

  for (let i = 0; i < str.length / 4; i++) {
    const chunk = [...str.slice(4 * i, 4 * i + 4)];
    const bin = chunk
      .map((x) => b64array.indexOf(x).toString(2).padStart(6, "0"))
      .join("");
    const bytes = bin.match(/.{1,8}/g)!.map((x) => +("0b" + x));
    result.push(
      ...bytes.slice(
        0,
        3 - (str[4 * i + 2] == "=" ? 1 : 0) - (str[4 * i + 3] == "=" ? 1 : 0)
      )
    );
  }
  return result;
}

export function bytesArrToBase64(arr: number[]) {
  const bin = (n: number) => n.toString(2).padStart(8, "0"); // convert num to 8-bit binary string
  const l = arr.length;
  let result = "";

  for (let i = 0; i <= (l - 1) / 3; i++) {
    const c1 = i * 3 + 1 >= l; // case when "=" is on end
    const c2 = i * 3 + 2 >= l; // case when "=" is on end
    const chunk =
      bin(arr[3 * i]) +
      bin(c1 ? 0 : arr[3 * i + 1]) +
      bin(c2 ? 0 : arr[3 * i + 2]);
    const r = chunk
      .match(/.{1,6}/g)!
      .map((x, j) =>
        j == 3 && c2 ? "=" : j == 2 && c1 ? "=" : b64alphabet[+("0b" + x)]
      );
    result += r.join("");
  }

  return result;
}

export class EventEmitter extends EventTarget {
  on(eventName: string, listener: EventListenerOrEventListenerObject) {
    return this.addEventListener(eventName, listener);
  }
  once(eventName: string, listener: EventListenerOrEventListenerObject) {
    return this.addEventListener(eventName, listener, { once: true });
  }
  off(eventName: string, listener: EventListenerOrEventListenerObject) {
    return this.removeEventListener(eventName, listener);
  }
  protected fire<T>(eventName: string, detail?: T) {
    return this.dispatchEvent(
      new CustomEvent(eventName, { detail, cancelable: true })
    );
  }
}
