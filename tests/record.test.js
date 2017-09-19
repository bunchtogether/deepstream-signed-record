// @flow 

import expect from 'expect';
import uuid from 'uuid';
import libp2pCrypto from 'libp2p-crypto';
import signedRecord from '../src';
import { getClient, getServer } from './lib/deepstream';

let server;
let clientA;
let clientB;

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
  const privateKey = await new Promise((resolve, reject) => {
    libp2pCrypto.keys.generateKeyPair('RSA', 1024, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
  const recordA = signedRecord(clientA, name, privateKey, defaultValue);
  const recordB = signedRecord(clientB, name, privateKey, defaultValue);
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

test('Should callback once.', async () => {
  const name = uuid.v4();
  const defaultValue = {
    [uuid.v4()]: uuid.v4(),
  };
  const propertyName = uuid.v4();
  const propertyValue = uuid.v4();
  const privateKey = await new Promise((resolve, reject) => {
    libp2pCrypto.keys.generateKeyPair('RSA', 1024, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
  const recordA = signedRecord(clientA, name, privateKey, defaultValue);
  const recordB = signedRecord(clientB, name, privateKey, defaultValue);
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
  const privateKeyA = await new Promise((resolve, reject) => {
    libp2pCrypto.keys.generateKeyPair('RSA', 1024, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
  const privateKeyB = await new Promise((resolve, reject) => {
    libp2pCrypto.keys.generateKeyPair('RSA', 1024, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
  const recordA = signedRecord(clientA, name, privateKeyA);
  const recordB = signedRecord(clientB, name, privateKeyB);
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
  const privateKey = await new Promise((resolve, reject) => {
    libp2pCrypto.keys.generateKeyPair('RSA', 1024, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
  const record = signedRecord(clientA, name, privateKey);
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
});
