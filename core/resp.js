const CRLF = "\r\n";

export const readLength = (data) => {
  let pos = 0;
  let length = 0;

  for (; pos < data.length; pos += 1) {
    const byte = data[pos];

    if (byte < "0" || byte > "9") {
      return [length, pos + 2];
    }

    length = length * 10 + Number(byte);
  }

  return [0, 0];
};

export const readSimpleString = (data) => {
  let pos = 1;

  for (; pos < data.length && data[pos] !== "\r"; pos += 1) {
    // Keep scanning until CR.
  }

  if (pos >= data.length) {
    return [null, 0];
  }

  return [data.slice(1, pos), pos + 2];
};

export const readError = (data) => readSimpleString(data);

export const readInt64 = (data) => {
  let pos = 1;
  let value = 0;

  for (; pos < data.length && data[pos] !== "\r"; pos += 1) {
    value = value * 10 + Number(data[pos]);
  }

  if (pos >= data.length) {
    return [null, 0];
  }

  return [value, pos + 2];
};

export const readBulkString = (data) => {
  let pos = 1;
  const [length, delta] = readLength(data.slice(pos));

  if (delta === 0) {
    return [null, 0];
  }

  pos += delta;

  if (data.length < pos + length + CRLF.length) {
    return [null, 0];
  }

  return [data.slice(pos, pos + length), pos + length + 2];
};

export const decodeOne = (data) => {
  if (data.length === 0) {
    throw new Error("no data");
  }

  switch (data[0]) {
    case "+":
      return readSimpleString(data);
    case "-":
      return readError(data);
    case ":":
      return readInt64(data);
    case "$":
      return readBulkString(data);
    case "*":
      return readArray(data);
    default:
      throw new Error(`unsupported RESP type: ${data[0]}`);
  }
};

export const readArray = (data) => {
  let pos = 1;
  const [count, delta] = readLength(data.slice(pos));

  if (delta === 0) {
    return [null, 0];
  }

  pos += delta;

  const elements = new Array(count);

  for (let index = 0; index < count; index += 1) {
    const [element, elementDelta] = decodeOne(data.slice(pos));

    if (elementDelta === 0) {
      return [null, 0];
    }

    elements[index] = element;
    pos += elementDelta;
  }

  return [elements, pos];
};

export const decode = (data) => {
  if (data.length === 0) {
    throw new Error("no data");
  }

  const [value] = decodeOne(data);
  return value;
};

export const decodeMany = (data) => {
  const values = [];
  let rest = data;

  while (rest.length > 0) {
    const [value, delta] = decodeOne(rest);

    if (delta === 0) {
      break;
    }

    values.push(value);
    rest = rest.slice(delta);
  }

  return { values, rest };
};

export const encodeSimpleString = (value) => `+${value}${CRLF}`;

export const encodeError = (value) => `-ERR ${value}${CRLF}`;

export const encodeBulkString = (value) => {
  if (value === null || value === undefined) {
    return `$-1${CRLF}`;
  }

  return `$${value.length}${CRLF}${value}${CRLF}`;
};

export const encodeInteger = (value) => `:${value}${CRLF}`;
