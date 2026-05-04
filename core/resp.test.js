import assert from "node:assert/strict";

import { decode } from "./resp.js";

const testSimpleStringDecode = () => {
  const cases = {
    "+OK\r\n": "OK",
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(decode(input), expected);
  }
};

const testErrorDecode = () => {
  const cases = {
    "-Error message\r\n": "Error message",
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(decode(input), expected);
  }
};

const testInt64Decode = () => {
  const cases = {
    ":0\r\n": 0,
    ":1000\r\n": 1000,
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(decode(input), expected);
  }
};

const testBulkStringDecode = () => {
  const cases = {
    "$5\r\nhello\r\n": "hello",
    "$0\r\n\r\n": "",
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(decode(input), expected);
  }
};

const testArrayDecode = () => {
  const cases = {
    "*0\r\n": [],
    "*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n": ["hello", "world"],
    "*3\r\n:1\r\n:2\r\n:3\r\n": [1, 2, 3],
    "*5\r\n:1\r\n:2\r\n:3\r\n:4\r\n$5\r\nhello\r\n": [1, 2, 3, 4, "hello"],
    "*2\r\n*3\r\n:1\r\n:2\r\n:3\r\n*2\r\n+Hello\r\n-World\r\n": [
      [1, 2, 3],
      ["Hello", "World"],
    ],
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.deepEqual(decode(input), expected);
  }
};

testSimpleStringDecode();
testErrorDecode();
testInt64Decode();
testBulkStringDecode();
testArrayDecode();

console.log("RESP tests passed");
