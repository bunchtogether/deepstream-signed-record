# Deepstream Signed Record

## Usage

```js
import NodeRSA from 'node-rsa';
import deepstream from 'deepstream.io-client-js';
import signedRecord from 'deepstream-signed-record';

const client = deepstream("127.0.0.1:6020").login();

const run = async () => {
  const keyPair = new NodeRSA({ b: 1024 })
  // Optional default value
  const defaultValue = {
    example: "example"
  };
  const record = signedRecord(client, "example-record-name", keyPair, defaultValue);
  record.subscribe("example-record-name", (value) => {
    console.log(value);
  });
  await record.set("example-record-name", "example-record-value");
  await record.discard();
}

run();
```

