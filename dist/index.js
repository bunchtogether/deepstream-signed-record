'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.default = function (client, name, keyPair) {
  var _this = this;

  var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var record = client.record.getRecord(name);
  var readyPromise = new Promise(function (resolve, reject) {
    record.once('ready', function () {
      return resolve();
    });
    record.once('error', reject);
  });
  var pemPublicKey = keyPair.exportKey('pkcs1-public-pem');
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
    var pairString = JSON.stringify(pairs);
    var signature = keyPair.sign(pairString).toString('base64');
    return signature;
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

              if (!(Object.keys(data).length > 0 && signature !== getSignature(data))) {
                _context.next = 6;
                break;
              }

              throw new Error('Invalid signature for record ' + name);

            case 6:
              Object.keys(callbacks).forEach(function (k) {
                if (!data[k] && !currentData[k]) {
                  callbacks[k].forEach(function (callback) {
                    return callback();
                  });
                }
              });
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
              _context.next = 33;
              break;

            case 12:
              _context.prev = 12;
              _context.t0 = _context['catch'](0);
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 17;

              for (_iterator = errbacks[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                errback = _step.value;
                // eslint-disable-line no-restricted-syntax
                errback(_context.t0);
              }
              _context.next = 25;
              break;

            case 21:
              _context.prev = 21;
              _context.t1 = _context['catch'](17);
              _didIteratorError = true;
              _iteratorError = _context.t1;

            case 25:
              _context.prev = 25;
              _context.prev = 26;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 28:
              _context.prev = 28;

              if (!_didIteratorError) {
                _context.next = 31;
                break;
              }

              throw _iteratorError;

            case 31:
              return _context.finish(28);

            case 32:
              return _context.finish(25);

            case 33:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[0, 12], [17, 21, 25, 33], [26,, 28, 32]]);
    }));

    return function (_x2) {
      return _ref.apply(this, arguments);
    };
  }(), true);
  var subscribe = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(key, callback, errback) {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              callbacks[key] = callbacks[key] || [];
              callbacks[key].push(callback);
              if (errback) {
                errbacks.add(errback);
              }

            case 3:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function subscribe(_x3, _x4, _x5) {
      return _ref2.apply(this, arguments);
    };
  }();
  var unsubscribe = function unsubscribe(key, callback, errback) {
    callbacks[key] = callbacks[key] || [];
    callbacks[key] = callbacks[key].filter(function (cb) {
      return cb !== callback;
    });
    if (errback) {
      errbacks.delete(errback);
    }
  };
  var discard = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!record.isDestroyed) {
                _context3.next = 2;
                break;
              }

              return _context3.abrupt('return');

            case 2:
              record.unsubscribe();
              _context3.next = 5;
              return new Promise(function (resolve, reject) {
                record.once('discard', resolve);
                record.once('error', reject);
                record.discard();
              });

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this);
    }));

    return function discard() {
      return _ref3.apply(this, arguments);
    };
  }();
  var set = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(key, value) {
      var remoteValue, data;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return readyPromise;

            case 2:
              remoteValue = record.get();

              if (Object.keys(remoteValue).length > 0 && remoteValue.signature !== getSignature(remoteValue)) {
                console.error('Invalid signature for record ' + name + ', clearing.'); // eslint-disable-line no-console
                remoteValue = {};
              }
              data = Object.assign({}, remoteValue, defaultValue, {
                publicKey: pemPublicKey
              });

              data[key] = value;
              data.signature = getSignature(data);
              _context4.next = 9;
              return new Promise(function (resolve, reject) {
                record.set(data, function (errorMessage) {
                  if (errorMessage) {
                    reject(new Error(errorMessage));
                  } else {
                    resolve();
                  }
                });
              });

            case 9:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this);
    }));

    return function set(_x6, _x7) {
      return _ref4.apply(this, arguments);
    };
  }();
  return { set: set, subscribe: subscribe, unsubscribe: unsubscribe, discard: discard, readyPromise: readyPromise };
};

var _deepstream = require('deepstream.io-client-js');

var _deepstream2 = _interopRequireDefault(_deepstream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }