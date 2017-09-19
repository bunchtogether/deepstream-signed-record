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
  record.subscribe(async (value:Object) => {
    try {
      const data = Object.assign({}, value);
      const signature = data.signature;
      delete data.signature;
      const pairs = Object.keys(data).map((k) => [k, data[k]]);
      pairs.sort((x, y) => (x[0] > y[0] ? 1 : -1));
      const computedSignature = await new Promise((resolve, reject) => {
        privateKey.sign(JSON.stringify(pairs), (error, s) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(s.toString('base64'));
        });
      });
      if (signature !== computedSignature) {
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
  });
  const subscribe = (key: string, callback: Function, errback?: Function) => {
    callbacks[key] = callbacks[key] || [];
    callbacks[key].push(callback);
    callback(currentData[key]);
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
    const data = Object.assign({}, record.get(), defaultValue, {
      publicKey: pemPublicKey,
    });
    delete data.signature;
    data[key] = value;
    const pairs = Object.keys(data).map((k) => [k, data[k]]);
    pairs.sort((x, y) => (x[0] > y[0] ? 1 : -1));
    data.signature = await new Promise((resolve, reject) => {
      privateKey.sign(JSON.stringify(pairs), (error, s) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(s.toString('base64'));
      });
    });
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
