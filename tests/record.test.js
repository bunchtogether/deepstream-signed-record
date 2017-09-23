// @flow 

import expect from 'expect';
import uuid from 'uuid';
import NodeRSA from 'node-rsa';
import signedRecord from '../src';
import { getClient, getServer } from './lib/deepstream';


let server;
let clientA;
let clientB;
const keyPair = new NodeRSA({ b: 1024 });

beforeAll(async () => {
  server = await getServer();
  clientA = await getClient();
  clientB = await getClient();
});

afterAll(async () => {
  await clientA.shutdown();
  await clientB.shutdown();
  await server.shutdown();
});

test('Should sign a record.', async () => {
  const name = uuid.v4();
  const defaultValue = {
    [uuid.v4()]: uuid.v4(),
  };
  const propertyName = uuid.v4();
  const propertyValue = uuid.v4();
  const recordA = signedRecord(clientA, name, keyPair, defaultValue);
  const recordB = signedRecord(clientB, name, keyPair, defaultValue);
  const valuePromise = new Promise((resolve) => {
    recordB.subscribe(propertyName, (value) => {
      if (value === propertyValue) {
        resolve();
      }
    });
  });
  await recordA.set(propertyName, propertyValue);
  await valuePromise;
  await recordA.discard();
  await recordB.discard();
});

test('Should sign and add to record.', async () => {
  const name = uuid.v4();
  const defaultValue = {
    [uuid.v4()]: uuid.v4(),
  };
  const propertyNameA = uuid.v4();
  const propertyValueA = uuid.v4();
  const propertyNameB = uuid.v4();
  const propertyValueB = uuid.v4();
  const recordA = signedRecord(clientA, name, keyPair, defaultValue);
  const recordB = signedRecord(clientB, name, keyPair, defaultValue);
  const valuePromiseA = new Promise((resolve) => {
    recordB.subscribe(propertyNameA, (value) => {
      if (value === propertyValueA) {
        resolve();
      }
    });
  });
  await recordA.set(propertyNameA, propertyValueA);
  await valuePromiseA;
  const valuePromiseB = new Promise((resolve) => {
    recordA.subscribe(propertyNameB, (value) => {
      if (value === propertyValueB) {
        resolve();
      }
    });
  });
  await recordB.set(propertyNameB, propertyValueB);
  await valuePromiseB;
  await recordA.discard();
  await recordB.discard();
});

test('Should callback once.', async () => {
  const name = uuid.v4();
  const defaultValue = {
    [uuid.v4()]: uuid.v4(),
  };
  const propertyName = uuid.v4();
  const propertyValue = uuid.v4();
  const recordA = signedRecord(clientA, name, keyPair, defaultValue);
  const recordB = signedRecord(clientB, name, keyPair, defaultValue);
  let count = 0;
  recordB.subscribe(propertyName, () => {
    count += 1;
  });
  await recordA.set(propertyName, propertyValue);
  await recordB.set(propertyName, propertyValue);
  await recordA.set(propertyName, propertyValue);
  await recordB.set(propertyName, propertyValue);
  expect(count).toEqual(2);
  await recordA.discard();
  await recordB.discard();
});

test('Should fail if private keys do not match.', async () => {
  const name = uuid.v4();
  const propertyName = uuid.v4();
  const propertyValue = uuid.v4();
  const keyPairB = new NodeRSA({ b: 1024 });
  const recordA = signedRecord(clientA, name, keyPair);
  const recordB = signedRecord(clientB, name, keyPairB);
  const valuePromise = new Promise((resolve) => {
    recordB.subscribe(propertyName, () => {}, (error) => {
      if (/Invalid signature/.test(error.message)) {
        resolve();
      }
    });
  });
  await recordA.set(propertyName, propertyValue);
  await valuePromise;
  await recordA.discard();
  await recordB.discard();
});

test('Should overwrite if record signature is wrong.', async () => {
  const name = uuid.v4();
  const propertyNameA = uuid.v4();
  const propertyValueA = uuid.v4();
  const propertyNameB = uuid.v4();
  const propertyValueB = uuid.v4();
  const dsRecord = clientA.record.getRecord(name);
  const record = signedRecord(clientA, name, keyPair);
  await record.set(propertyNameA, propertyValueA);
  await new Promise((resolve, reject) => {
    dsRecord.set(propertyNameB, propertyValueB, (errorMessage:string) => {
      if (errorMessage) {
        reject(new Error(errorMessage));
      } else {
        resolve();
      }
    });
  });
  await record.set(propertyNameA, propertyValueA);
  expect(dsRecord.get()).not.toContain(propertyNameB);
  dsRecord.discard();
  await record.discard();
});
