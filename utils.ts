// https://stackoverflow.com/a/62364519
export function base64ToBytesArr(str: string) {
  const abc = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  ]; // base64 alphabet
  const result = [];

  for (let i = 0; i < str.length / 4; i++) {
    let chunk = [...str.slice(4 * i, 4 * i + 4)];
    let bin = chunk
      .map((x) => abc.indexOf(x).toString(2).padStart(6, "0"))
      .join("");
    let bytes = bin.match(/.{1,8}/g)!.map((x) => +("0b" + x));
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
  const abc =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // base64 alphabet
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
        j == 3 && c2 ? "=" : j == 2 && c1 ? "=" : abc[+("0b" + x)]
      );
    result += r.join("");
  }

  return result;
}
