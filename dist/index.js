'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.default = function (client, name, privateKey) {
  var _this = this;

  var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var record = client.record.getRecord(name);
  var readyPromise = new Promise(function (resolve, reject) {
    record.once('ready', resolve);
    record.once('error', reject);
  });
  var pemPublicKey = (0, _pemJwk.jwk2pem)(privateKey.public._key); // eslint-disable-line no-underscore-dangle
  var currentData = {};
  readyPromise.then(function () {
    currentData = record.get();
  });
  var callbacks = {};
  var errbacks = new Set([]);
  var getSignature = function getSignature(value) {
    var data = Object.assign({}, value);
    delete data.signature;
    var pairs = Object.keys(data).map(function (key) {
      return [key, data[key]];
    });
    pairs.sort(function (x, y) {
      return x[0] > y[0] ? 1 : -1;
    });
    console.log('Signing');
    console.log(JSON.stringify(pairs));
    console.log((0, _pemJwk.jwk2pem)(privateKey._key)); // eslint-disable-line no-underscore-dangle
    return new Promise(function (resolve, reject) {
      privateKey.sign(JSON.stringify(pairs), function (error, signature) {
        if (error) {
          reject(error);
          return;
        }
        var b64signature = signature.toString('base64');
        console.log(b64signature);
        resolve(b64signature);
      });
    });
  };
  record.subscribe(function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(value) {
      var data, signature, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, errback;

      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              data = Object.assign({}, value);
              signature = data.signature;

              delete data.signature;
              _context.t0 = Object.keys(data).length > 0;

              if (!_context.t0) {
                _context.next = 11;
                break;
              }

              _context.t1 = signature;
              _context.next = 9;
              return getSignature(data);

            case 9:
              _context.t2 = _context.sent;
              _context.t0 = _context.t1 !== _context.t2;

            case 11:
              if (!_context.t0) {
                _context.next = 13;
                break;
              }

              throw new Error('Invalid signature for record ' + name);

            case 13:
              Object.keys(currentData).forEach(function (k) {
                if (!data[k] && callbacks[k]) {
                  callbacks[k].forEach(function (callback) {
                    return callback();
                  });
                }
              });
              Object.keys(data).forEach(function (k) {
                if (data[k] !== currentData[k] && callbacks[k]) {
                  callbacks[k].forEach(function (callback) {
                    return callback(data[k]);
                  });
                }
              });
              currentData = data;
              _context.next = 39;
              break;

            case 18:
              _context.prev = 18;
              _context.t3 = _context['catch'](0);
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 23;

              for (_iterator = errbacks[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                errback = _step.value;
                // eslint-disable-line no-restricted-syntax
                errback(_context.t3);
              }
              _context.next = 31;
              break;

            case 27:
              _context.prev = 27;
              _context.t4 = _context['catch'](23);
              _didIteratorError = true;
              _iteratorError = _context.t4;

            case 31:
              _context.prev = 31;
              _context.prev = 32;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 34:
              _context.prev = 34;

              if (!_didIteratorError) {
                _context.next = 37;
                break;
              }

              throw _iteratorError;

            case 37:
              return _context.finish(34);

            case 38:
              return _context.finish(31);

            case 39:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[0, 18], [23, 27, 31, 39], [32,, 34, 38]]);
    }));

    return function (_x2) {
      return _ref.apply(this, arguments);
    };
  }(), true);
  var subscribe = function subscribe(key, callback, errback) {
    callbacks[key] = callbacks[key] || [];
    callbacks[key].push(callback);
    readyPromise.then(function () {
      return callback(currentData[key]);
    });
    if (errback) {
      errbacks.add(errback);
    }
  };
  var discard = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!record.isDestroyed) {
                _context2.next = 2;
                break;
              }

              return _context2.abrupt('return');

            case 2:
              record.unsubscribe();
              _context2.next = 5;
              return new Promise(function (resolve, reject) {
                record.once('discard', resolve);
                record.once('error', reject);
                record.discard();
              });

            case 5:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function discard() {
      return _ref2.apply(this, arguments);
    };
  }();
  var set = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(key, value) {
      var remoteValue, data;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return readyPromise;

            case 2:
              remoteValue = record.get();
              _context3.t0 = Object.keys(remoteValue).length > 0;

              if (!_context3.t0) {
                _context3.next = 10;
                break;
              }

              _context3.t1 = remoteValue.signature;
              _context3.next = 8;
              return getSignature(remoteValue);

            case 8:
              _context3.t2 = _context3.sent;
              _context3.t0 = _context3.t1 !== _context3.t2;

            case 10:
              if (!_context3.t0) {
                _context3.next = 13;
                break;
              }

              console.error('Invalid signature for record ' + name + ', clearing.'); // eslint-disable-line no-console
              remoteValue = {};

            case 13:
              data = Object.assign({}, remoteValue, defaultValue, {
                publicKey: pemPublicKey
              });

              data[key] = value;
              _context3.next = 17;
              return getSignature(data);

            case 17:
              data.signature = _context3.sent;
              _context3.next = 20;
              return new Promise(function (resolve, reject) {
                record.set(data, function (errorMessage) {
                  if (errorMessage) {
                    reject(new Error(errorMessage));
                  } else {
                    resolve();
                  }
                });
              });

            case 20:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this);
    }));

    return function set(_x3, _x4) {
      return _ref3.apply(this, arguments);
    };
  }();
  return { set: set, subscribe: subscribe, discard: discard };
};

var _deepstream = require('deepstream.io-client-js');

var _deepstream2 = _interopRequireDefault(_deepstream);

var _libp2pCrypto = require('libp2p-crypto');

var _libp2pCrypto2 = _interopRequireDefault(_libp2pCrypto);

var _pemJwk = require('pem-jwk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }