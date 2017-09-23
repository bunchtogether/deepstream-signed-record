// @flow 

import DeepstreamClient from 'deepstream.io-client-js';
import libp2pCrypto from 'libp2p-crypto';
import { jwk2pem } from 'pem-jwk';

export default function (client: DeepstreamClient, name:string, privateKey:libp2pCrypto.keys.supportedKeys.rsa.RsaPrivateKey, defaultValue?: Object = {}) {
  const record = client.record.getRecord(name);
  const readyPromise = new Promise((resolve, reject) => {
    record.once('ready', resolve);
    record.once('error', reject);
  });
  const pemPublicKey = jwk2pem(privateKey.public._key); // eslint-disable-line no-underscore-dangle
  let currentData = {};
  readyPromise.then(() => {
    currentData = record.get();
  });
  const callbacks = {};
  const errbacks = new Set([]);
  const getSignature = (value: Object) => {
    const data = Object.assign({}, value);
    delete data.signature;
    const pairs = Object.keys(data).map((key) => [key, data[key]]);
    pairs.sort((x, y) => (x[0] > y[0] ? 1 : -1));
    return new Promise((resolve, reject) => {
      privateKey.sign(JSON.stringify(pairs), (error, signature) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(signature.toString('base64'));
      });
    });
  };
  record.subscribe(async (value:Object) => {
    try {
      const data = Object.assign({}, value);
      const signature = data.signature;
      delete data.signature;
      if (Object.keys(data).length > 0 && signature !== (await getSignature(data))) {
        throw new Error(`Invalid signature for record ${name}`);
      }
      Object.keys(currentData).forEach((k) => {
        if (!data[k] && callbacks[k]) {
          callbacks[k].forEach((callback) => callback());
        }
      });
      Object.keys(data).forEach((k) => {
        if (data[k] !== currentData[k] && callbacks[k]) {
          callbacks[k].forEach((callback) => callback(data[k]));
        }
      });
      currentData = data;
    } catch (error) {
      for (const errback of errbacks) { // eslint-disable-line no-restricted-syntax
        errback(error);
      }
    }
  }, true);
  const subscribe = (key: string, callback: Function, errback?: Function) => {
    callbacks[key] = callbacks[key] || [];
    callbacks[key].push(callback);
    readyPromise.then(() => callback(currentData[key]));
    if (errback) {
      errbacks.add(errback);
    }
  };
  const discard = async () => {
    if (record.isDestroyed) {
      return;
    }
    record.unsubscribe();
    await new Promise((resolve, reject) => {
      record.once('discard', resolve);
      record.once('error', reject);
      record.discard();
    });
  };
  const set = async (key: string, value: any) => {
    await readyPromise;
    let remoteValue = record.get();
    if (Object.keys(remoteValue).length > 0 && remoteValue.signature !== await getSignature(remoteValue)) {
      console.error(`Invalid signature for record ${name}, clearing.`); // eslint-disable-line no-console
      remoteValue = {};
    }
    const data = Object.assign({}, remoteValue, defaultValue, {
      publicKey: pemPublicKey,
    });
    delete data.signature;
    data[key] = value;
    data.signature = await getSignature(data);
    await new Promise((resolve, reject) => {
      record.set(data, (errorMessage:string) => {
        if (errorMessage) {
          reject(new Error(errorMessage));
        } else {
          resolve();
        }
      });
    });
  };
  return { set, subscribe, discard };
}
