() => (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
const { errors: rpcErrors } = require('eth-json-rpc-errors')
const bls = require('noble-bls12-381')

const DOMAIN = 2

wallet.registerRpcMessageHandler(async (_originString, requestObject) => {
  switch (requestObject.method) {

    case 'getAccount':
      return getPubKey()

    case 'signMessage':
      const pubKey = await getPubKey()
      const data = requestObject.params[0]
      const approved = await promptUser(`Do you want to BLS sign ${data} with ${pubKey}?`)
      if (!approved) {
        throw rpcErrors.eth.unauthorized()
      }
      const PRIVATE_KEY = await wallet.getAppKey()
      const signature = await bls.sign(requestObject.params[0], PRIVATE_KEY, DOMAIN)
      return signature

    default:
      throw rpcErrors.methodNotFound(requestObject)
  }
})

async function getPubKey () {
  const PRIV_KEY = await wallet.getAppKey()
  return bls.getPublicKey(PRIV_KEY)
}

async function promptUser (message) {
  const response = await wallet.send({ method: 'confirm', params: [message] })
  return response
}

},{"eth-json-rpc-errors":3,"noble-bls12-381":14}],3:[function(require,module,exports){

const { JsonRpcError, EthJsonRpcError } = require('./src/classes')
const {
  serializeError, getMessageFromCode,
} = require('./src/utils')
const errors = require('./src/errors')
const ERROR_CODES = require('./src/errorCodes.json')

module.exports = {
  errors,
  JsonRpcError,
  EthJsonRpcError,
  serializeError,
  getMessageFromCode,
  /** @type ErrorCodes */
  ERROR_CODES,
}

// Types

/**
 * @typedef {Object} EthJsonRpcErrorCodes
 * @property {number} userRejectedRequest
 * @property {number} unauthorized
 * @property {number} unsupportedMethod
 */

/**
 * @typedef {Object} JsonRpcErrorCodes
 * @property {number} parse
 * @property {number} invalidRequest
 * @property {number} invalidParams
 * @property {number} methodNotFound
 * @property {number} internal
 */

/**
 * @typedef ErrorCodes
 * @property {JsonRpcErrorCodes} jsonRpc
 * @property {EthJsonRpcErrorCodes} eth
 */

},{"./src/classes":4,"./src/errorCodes.json":5,"./src/errors":7,"./src/utils":8}],4:[function(require,module,exports){

const safeStringify = require('fast-safe-stringify')

/**
 * @class JsonRpcError
 * Error subclass implementing JSON RPC 2.0 errors.
 * Permits any integer error code.
 */
class JsonRpcError extends Error {

  /**
   * Create a JSON RPC error.
   * @param {number} code - The integer error code.
   * @param {string} message - The string message.
   * @param {any} [data] - The error data.
   */
  constructor (code, message, data) {

    if (!Number.isInteger(code)) throw new Error(
      '"code" must be an integer.'
    )
    if (!message || typeof message !== 'string') throw new Error(
      '"message" must be a nonempty string.'
    )

    super(message)
    this.code = code
    if (data !== undefined) this.data = data
  }

  /**
   * Returns a plain object with all public class properties.
   * @returns {object} The serialized error. 
   */
  serialize() {
    const serialized = {
      code: this.code,
      message: this.message,
    }
    if (this.data !== undefined) serialized.data = this.data
    if (this.stack) serialized.stack = this.stack
    return serialized
  }

  /**
   * Return a string representation of the serialized error, omitting
   * any circular references.
   * @returns {string} The serialized error as a string.
   */
  toString() {
    return safeStringify(
      this.serialize(),
      stringifyReplacer,
      2
    )
  }
}

/**
 * @class EthJsonRpcError
 * Error subclass implementing Ethereum JSON RPC errors.
 * Permits integer error codes in the [ 1000 <= 4999 ] range.
 */
class EthJsonRpcError extends JsonRpcError {
  /**
   * Create an Ethereum JSON RPC error.
   * @param {number} code - The integer error code, in the [ 1000 <= 4999 ] range.
   * @param {string} message - The string message.
   * @param {any} [data] - The error data.
   */
  constructor(code, message, data) {
    if (!isValidEthCode(code)) {
      throw new Error(
        '"code" must be an integer such that: 1000 <= code <= 4999'
      )
    }
    super(code, message, data)
  }
}

// Internal

function isValidEthCode(code) {
  return Number.isInteger(code) && code >= 1000 && code <= 4999
}

function stringifyReplacer(_, value) {
  if (value === '[Circular]') {
    return
  }
  return value
}

// Exports

module.exports =  {
  JsonRpcError,
  EthJsonRpcError,
}

},{"fast-safe-stringify":9}],5:[function(require,module,exports){
module.exports={
  "jsonRpc": {
      "parse": -32700,
      "invalidRequest": -32600,
      "methodNotFound": -32601,
      "invalidParams": -32602,
      "internal": -32603
  },
  "eth": {
    "userRejectedRequest": 4001,
    "unauthorized": 4100,
    "unsupportedMethod": 4200
  }
}

},{}],6:[function(require,module,exports){
module.exports={
  "-32700": {
    "standard": "JSON RPC 2.0",
    "message": "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text."
  },
  "-32600": {
    "standard": "JSON RPC 2.0",
    "message": "The JSON sent is not a valid Request object."
  },
  "-32601": {
    "standard": "JSON RPC 2.0",
    "message": "The method does not exist / is not available."
  },
  "-32602": {
    "standard": "JSON RPC 2.0",
    "message": "Invalid method parameter(s)."
  },
  "-32603": {
    "standard": "JSON RPC 2.0",
    "message": "Internal JSON-RPC error."
  },
  "4001": {
    "standard": "EIP 1193",
    "message": "User rejected the request."
  },
  "4100": {
    "standard": "EIP 1193",
    "message": "The requested account and/or method has not been authorized by the user."
  },
  "4200": {
    "standard": "EIP 1193",
    "message": "The requested method is not supported by this Ethereum provider."
  }
}

},{}],7:[function(require,module,exports){

const { JsonRpcError, EthJsonRpcError } = require('./classes')
const { getMessageFromCode } = require('./utils')
const ERROR_CODES = require('./errorCodes.json')

module.exports = {
  /**
   * Get a JSON RPC 2.0 Parse error.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  parse: (message, data) => getJsonRpcError(
    ERROR_CODES.jsonRpc.parse, message, data
  ),

  /**
   * Get a JSON RPC 2.0 Invalid Request error.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  invalidRequest: (message, data) => getJsonRpcError(
    ERROR_CODES.jsonRpc.invalidRequest, message, data
  ),

  /**
   * Get a JSON RPC 2.0 Invalid Params error.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  invalidParams: (message, data) => getJsonRpcError(
    ERROR_CODES.jsonRpc.invalidParams, message, data
  ),

  /**
   * Get a JSON RPC 2.0 Method Not Found error.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  methodNotFound: (message, data) => getJsonRpcError(
    ERROR_CODES.jsonRpc.methodNotFound, message, data
  ),

  /**
   * Get a JSON RPC 2.0 Internal error.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  internal: (message, data) => getJsonRpcError(
    ERROR_CODES.jsonRpc.internal, message, data
  ),

  /**
   * Get a JSON RPC 2.0 Server error.
   * Permits integer error codes in the [ -32099 <= -32000 ] range.
   * @param {number} code - The integer error code.
   * @param {string} [message] - A custom message.
   * @param {any} [data] - Error data.
   * @return {JsonRpcError} The error.
   */
  server: (code, message, data) => {
    if (!Number.isInteger(code) || code > -32000 || code < -32099) {
      throw new Error(
        '"code" must be an integer such that: -32099 <= code <= -32000'
      )
    }
    return getJsonRpcError(code, message, data)
  },
  eth: {
    /**
     * Get an Ethereum JSON RPC User Rejected Request error.
     * @param {string} [message] - A custom message.
     * @param {any} [data] - Error data.
     * @return {EthJsonRpcError} The error.
     */
    userRejectedRequest: (message, data) => {
      return getEthJsonRpcError(
        ERROR_CODES.eth.userRejectedRequest, message, data
      )
    },

    /**
     * Get an Ethereum JSON RPC Unauthorized error.
     * @param {string} [message] - A custom message.
     * @param {any} [data] - Error data.
     * @return {EthJsonRpcError} The error.
     */
    unauthorized: (message, data) => {
      return getEthJsonRpcError(
        ERROR_CODES.eth.unauthorized, message, data
      )
    },

    /**
     * Get an Ethereum JSON RPC Unsupported Method error.
     * @param {string} [message] - A custom message.
     * @param {any} [data] - Error data.
     * @return {EthJsonRpcError} The error.
     */
    unsupportedMethod: (message, data) => {
      return getEthJsonRpcError(
        ERROR_CODES.eth.unsupportedMethod, message, data
      )
    },

    /**
     * Get a custom Ethereum JSON RPC error.
     * @param {string} code - The error code.
     * @param {string} message - The error message.
     * @param {any} [data] - Error data.
     * @return {EthJsonRpcError} The error.
     */
    custom: (code, message, data) => {
      if (!message || typeof message !== 'string') throw new Error(
        '"message" must be a nonempty string'
      )
      return new EthJsonRpcError(code, message, data)
    },
  },
}

// Internal

function getJsonRpcError(code, message, data) {
  return new JsonRpcError(
    code,
    message || getMessageFromCode(code),
    data
  )
}

function getEthJsonRpcError(code, message, data) {
  return new EthJsonRpcError(
    code,
    message || getMessageFromCode(code),
    data
  )
}

},{"./classes":4,"./errorCodes.json":5,"./utils":8}],8:[function(require,module,exports){

const errorValues = require('./errorValues.json')
const FALLBACK_ERROR_CODE = require('./errorCodes.json').jsonRpc.internal
const { JsonRpcError } = require('./classes')

const JSON_RPC_SERVER_ERROR_MESSAGE = 'Unspecified server error.'

const FALLBACK_MESSAGE = 'Unspecified error message. This is  bug, please report it.'

const FALLBACK_ERROR = {
  code: FALLBACK_ERROR_CODE,
  message: getMessageFromCode(FALLBACK_ERROR_CODE)
}

/**
 * Gets the message for a given code, or a fallback message if the code has
 * no corresponding message.
 * @param {number} code - The integer error code.
 * @param {string} fallbackMessage - The fallback message.
 * @return {string} The corresponding message or the fallback message.
 */
function getMessageFromCode(code, fallbackMessage = FALLBACK_MESSAGE) {

  if (Number.isInteger(code)) {

    const codeString = code.toString()
    if (errorValues[codeString]) return errorValues[codeString].message

    if (isJsonRpcServerError(code)) return JSON_RPC_SERVER_ERROR_MESSAGE

    // TODO: allow valid codes and messages to be extended
    // // EIP 1193 Status Codes
    // if (code >= 4000 && code <= 4999) return Something?
  }
  return fallbackMessage
}

/**
 * Returns whether the given code is valid.
 * A code is only valid if it has a message.
 * @param {number} code - The code to check
 * @return {boolean} true if the code is valid, false otherwise.
 */
function isValidCode(code) {

  if (!Number.isInteger(code)) return false

  const codeString = code.toString()
  if (errorValues[codeString]) return true

  if (isJsonRpcServerError(code)) return true

  // TODO: allow valid codes and messages to be extended
  // // EIP 1193 Status Codes
  // if (code >= 4000 && code <= 4999) return true

  return false
}

/**
 * Serializes the given error to an ETH JSON RPC-compatible error object.
 * Merely copies the given error's values if it is already compatible.
 * If the given error is not fully compatible, it will be preserved on the
 * returned object's data.originalError property.
 * Adds a 'stack' property if it exists on the given error.
 *
 * @param {any} error - The error to serialize.
 * @param {object} fallbackError - The custom fallback error values if the
 * given error is invalid.
 * @return {object} A standardized error object.
 */
function serializeError (error, fallbackError = FALLBACK_ERROR) {

  if (
    !fallbackError || 
    !Number.isInteger(fallbackError.code) ||
    typeof fallbackError.message !== 'string'
  ) {
    throw new Error(
      'fallbackError must contain integer number code and string message.'
    )
  }

  if (typeof error === 'object' && error instanceof JsonRpcError) {
    return error.serialize()
  }

  const serialized = {}

  if (error && isValidCode(error.code)) {

    serialized.code = error.code

    if (error.message && typeof error.message === 'string') {
      serialized.message = error.message
      if (error.hasOwnProperty('data')) serialized.data = error.data
    } else {
      serialized.message = getMessageFromCode(serialized.code)
      serialized.data = { originalError: assignOriginalError(error) }
    }

  } else {
    serialized.code = fallbackError.code
    serialized.message = (
      error && error.message
        ? error.message
        : fallbackError.message
    )
    serialized.data = { originalError: assignOriginalError(error) }
  }

  if (error && error.stack) serialized.stack = error.stack
  return serialized
}

// Internal

function isJsonRpcServerError (code) {
  return code >= -32099 && code <= -32000
}

function assignOriginalError (error) {
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    return Object.assign({}, error)
  }
  return error
}

// Exports

module.exports = {
  getMessageFromCode,
  isValidCode,
  serializeError,
  JSON_RPC_SERVER_ERROR_MESSAGE,
}

},{"./classes":4,"./errorCodes.json":5,"./errorValues.json":6}],9:[function(require,module,exports){
module.exports = stringify
stringify.default = stringify
stringify.stable = deterministicStringify
stringify.stableStringify = deterministicStringify

var arr = []
var replacerStack = []

// Regular stringify
function stringify (obj, replacer, spacer) {
  decirc(obj, '', [], undefined)
  var res
  if (replacerStack.length === 0) {
    res = JSON.stringify(obj, replacer, spacer)
  } else {
    res = JSON.stringify(obj, replaceGetterValues(replacer), spacer)
  }
  while (arr.length !== 0) {
    var part = arr.pop()
    if (part.length === 4) {
      Object.defineProperty(part[0], part[1], part[3])
    } else {
      part[0][part[1]] = part[2]
    }
  }
  return res
}
function decirc (val, k, stack, parent) {
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
        if (propertyDescriptor.get !== undefined) {
          if (propertyDescriptor.configurable) {
            Object.defineProperty(parent, k, { value: '[Circular]' })
            arr.push([parent, k, val, propertyDescriptor])
          } else {
            replacerStack.push([val, k])
          }
        } else {
          parent[k] = '[Circular]'
          arr.push([parent, k, val])
        }
        return
      }
    }
    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, stack, val)
      }
    } else {
      var keys = Object.keys(val)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        decirc(val[key], key, stack, val)
      }
    }
    stack.pop()
  }
}

// Stable-stringify
function compareFunction (a, b) {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}

function deterministicStringify (obj, replacer, spacer) {
  var tmp = deterministicDecirc(obj, '', [], undefined) || obj
  var res
  if (replacerStack.length === 0) {
    res = JSON.stringify(tmp, replacer, spacer)
  } else {
    res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer)
  }
  while (arr.length !== 0) {
    var part = arr.pop()
    if (part.length === 4) {
      Object.defineProperty(part[0], part[1], part[3])
    } else {
      part[0][part[1]] = part[2]
    }
  }
  return res
}

function deterministicDecirc (val, k, stack, parent) {
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
        if (propertyDescriptor.get !== undefined) {
          if (propertyDescriptor.configurable) {
            Object.defineProperty(parent, k, { value: '[Circular]' })
            arr.push([parent, k, val, propertyDescriptor])
          } else {
            replacerStack.push([val, k])
          }
        } else {
          parent[k] = '[Circular]'
          arr.push([parent, k, val])
        }
        return
      }
    }
    if (typeof val.toJSON === 'function') {
      return
    }
    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        deterministicDecirc(val[i], i, stack, val)
      }
    } else {
      // Create a temporary object in the required way
      var tmp = {}
      var keys = Object.keys(val).sort(compareFunction)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        deterministicDecirc(val[key], key, stack, val)
        tmp[key] = val[key]
      }
      if (parent !== undefined) {
        arr.push([parent, k, val])
        parent[k] = tmp
      } else {
        return tmp
      }
    }
    stack.pop()
  }
}

// wraps replacer function to handle values we couldn't replace
// and mark them as [Circular]
function replaceGetterValues (replacer) {
  replacer = replacer !== undefined ? replacer : function (k, v) { return v }
  return function (key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i]
        if (part[1] === key && part[0] === val) {
          val = '[Circular]'
          replacerStack.splice(i, 1)
          break
        }
      }
    }
    return replacer.call(this, key, val)
  }
}

},{}],10:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const group_1 = require("./group");
class Fp {
    constructor(value = 0n) {
        this._value = 0n;
        this._value = this.mod(value, Fp.ORDER);
    }
    get value() {
        return this._value;
    }
    get zero() {
        return new Fp(0n);
    }
    get one() {
        return new Fp(1n);
    }
    mod(a, b) {
        const result = a % b;
        return result >= 0n ? result : b + result;
    }
    normalize(v) {
        return v instanceof Fp ? v : new Fp(v);
    }
    isEmpty() {
        return this._value === 0n;
    }
    equals(other) {
        return this._value === other._value;
    }
    negative() {
        return new Fp(-this._value);
    }
    invert() {
        const v = this._value;
        let lm = 1n;
        let hm = 0n;
        let low = v;
        let high = Fp.ORDER;
        let ratio = 0n;
        let nm = v;
        let enew = 0n;
        while (low > 1n) {
            ratio = high / low;
            nm = hm - lm * ratio;
            enew = high - low * ratio;
            hm = lm;
            lm = nm;
            high = low;
            low = enew;
        }
        return new Fp(nm);
    }
    add(other) {
        return new Fp(other._value + this._value);
    }
    square() {
        return new Fp(this._value * this._value);
    }
    pow(n) {
        let result = 1n;
        let value = this._value;
        while (n > 0) {
            if ((n & 1n) === 1n) {
                result = this.mod(result * value, Fp.ORDER);
            }
            n >>= 1n;
            value = this.mod(value * value, Fp.ORDER);
        }
        return new Fp(result);
    }
    subtract(other) {
        return new Fp(this._value - other._value);
    }
    multiply(other) {
        return new Fp(other._value * this._value);
    }
    div(other) {
        return this.multiply(other.invert());
    }
}
Fp.ORDER = 1n;
__decorate([
    group_1.normalized
], Fp.prototype, "equals", null);
__decorate([
    group_1.normalized
], Fp.prototype, "add", null);
__decorate([
    group_1.normalized
], Fp.prototype, "subtract", null);
__decorate([
    group_1.normalized
], Fp.prototype, "multiply", null);
__decorate([
    group_1.normalized
], Fp.prototype, "div", null);
exports.Fp = Fp;

},{"./group":13}],11:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("./fp");
const group_1 = require("./group");
const FP12_DEFAULT = [
    0n, 1n, 0n, 1n,
    0n, 1n, 0n, 1n,
    0n, 1n, 0n, 1n
];
class Fp12 {
    constructor(...args) {
        this.coefficients = FP12_DEFAULT.map(a => new fp_1.Fp(a));
        args =
            args.length === 0 ? FP12_DEFAULT : args.slice(0, 12);
        this.coefficients = args[0] instanceof fp_1.Fp ? args : args.map(a => new fp_1.Fp(a));
    }
    get value() {
        return this.coefficients.map(c => c.value);
    }
    get zero() {
        return new Fp12(0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    }
    get one() {
        return new Fp12(1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    }
    normalize(v) {
        if (typeof v === "bigint") {
            return v;
        }
        return v instanceof Fp12 ? v : new Fp12(...v);
    }
    isEmpty() {
        return this.coefficients.every(a => a.isEmpty());
    }
    equals(rhs) {
        return this.coefficients.every((a, i) => a.equals(rhs.coefficients[i]));
    }
    negative() {
        return new Fp12(...this.coefficients.map(a => a.negative()));
    }
    add(rhs) {
        return new Fp12(...this.coefficients.map((a, i) => a.add(rhs.coefficients[i])));
    }
    subtract(rhs) {
        return new Fp12(...this.coefficients.map((a, i) => a.subtract(rhs.coefficients[i])));
    }
    multiply(otherValue) {
        if (typeof otherValue === "bigint") {
            return new Fp12(...this.coefficients.map(a => a.multiply(otherValue)));
        }
        const LENGTH = this.coefficients.length;
        const filler = Array(LENGTH * 2 - 1)
            .fill(null)
            .map(() => new fp_1.Fp());
        for (let i = 0; i < LENGTH; i++) {
            for (let j = 0; j < LENGTH; j++) {
                filler[i + j] = filler[i + j].add(this.coefficients[i].multiply(otherValue.coefficients[j]));
            }
        }
        for (let exp = LENGTH - 2; exp >= 0; exp--) {
            const top = filler.pop();
            if (top === undefined) {
                break;
            }
            for (const [i, value] of Fp12.ENTRY_COEFFICIENTS) {
                filler[exp + i] = filler[exp + i].subtract(top.multiply(value));
            }
        }
        return new Fp12(...filler);
    }
    square() {
        return this.multiply(this);
    }
    pow(n) {
        if (n === 1n) {
            return this;
        }
        let result = new Fp12(1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
        let value = this;
        while (n > 0n) {
            if ((n & 1n) === 1n) {
                result = result.multiply(value);
            }
            n >>= 1n;
            value = value.square();
        }
        return result;
    }
    degree(nums) {
        let degree = nums.length - 1;
        while (nums[degree] === 0n && degree !== 0) {
            degree--;
        }
        return degree;
    }
    primeNumberInvariant(num) {
        return new fp_1.Fp(num).invert().value;
    }
    optimizedRoundedDiv(coefficients, others) {
        const tmp = [...coefficients];
        const degreeThis = this.degree(tmp);
        const degreeOthers = this.degree(others);
        const zeros = Array.from(tmp).fill(0n);
        const edgeInvariant = this.primeNumberInvariant(others[degreeOthers]);
        for (let i = degreeThis - degreeOthers; i >= 0; i--) {
            zeros[i] = zeros[i] + tmp[degreeOthers + i] * edgeInvariant;
            for (let c = 0; c < degreeOthers; c++) {
                tmp[c + i] = tmp[c + i] - zeros[c];
            }
        }
        return new Fp12(...zeros.slice(0, this.degree(zeros) + 1));
    }
    invert() {
        const LENGTH = this.coefficients.length;
        let lm = [...this.one.coefficients.map(a => a.value), 0n];
        let hm = [...this.zero.coefficients.map(a => a.value), 0n];
        let low = [...this.coefficients.map(a => a.value), 0n];
        let high = [...Fp12.MODULE_COEFFICIENTS, 1n];
        while (this.degree(low) !== 0) {
            const { coefficients } = this.optimizedRoundedDiv(high, low);
            const zeros = Array(LENGTH + 1 - coefficients.length)
                .fill(null)
                .map(() => new fp_1.Fp());
            const roundedDiv = coefficients.concat(zeros);
            let nm = [...hm];
            let nw = [...high];
            for (let i = 0; i <= LENGTH; i++) {
                for (let j = 0; j <= LENGTH - i; j++) {
                    nm[i + j] -= lm[i] * roundedDiv[j].value;
                    nw[i + j] -= low[i] * roundedDiv[j].value;
                }
            }
            nm = nm.map(a => new fp_1.Fp(a).value);
            nw = nw.map(a => new fp_1.Fp(a).value);
            hm = lm;
            lm = nm;
            high = low;
            low = nw;
        }
        const result = new Fp12(...lm);
        return result.div(low[0]);
    }
    div(otherValue) {
        if (typeof otherValue === "bigint") {
            return new Fp12(...this.coefficients.map(a => a.div(otherValue)));
        }
        return this.multiply(otherValue.invert());
    }
}
Fp12.MODULE_COEFFICIENTS = [
    2n, 0n, 0n, 0n, 0n, 0n, -2n, 0n, 0n, 0n, 0n, 0n
];
Fp12.ENTRY_COEFFICIENTS = [
    [0, 2n],
    [6, -2n]
];
__decorate([
    group_1.normalized
], Fp12.prototype, "equals", null);
__decorate([
    group_1.normalized
], Fp12.prototype, "add", null);
__decorate([
    group_1.normalized
], Fp12.prototype, "subtract", null);
__decorate([
    group_1.normalized
], Fp12.prototype, "multiply", null);
__decorate([
    group_1.normalized
], Fp12.prototype, "div", null);
exports.Fp12 = Fp12;

},{"./fp":10,"./group":13}],12:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("./fp");
const group_1 = require("./group");
class Fp2 {
    constructor(coef1 = 0n, coef2 = 0n) {
        this.coeficient1 = new fp_1.Fp(0n);
        this.coeficient2 = new fp_1.Fp(0n);
        this.coeficient1 = coef1 instanceof fp_1.Fp ? coef1 : new fp_1.Fp(coef1);
        this.coeficient2 = coef2 instanceof fp_1.Fp ? coef2 : new fp_1.Fp(coef2);
    }
    static set ORDER(order) {
        this._order = order;
        this.DIV_ORDER = (order + 8n) / 16n;
        const one = new Fp2(1n, 1n);
        const orderEightPart = order / 8n;
        const roots = Array(8)
            .fill(null)
            .map((_, i) => one.pow(BigInt(i) * orderEightPart));
        this.EIGHTH_ROOTS_OF_UNITY = roots;
    }
    static get ORDER() {
        return this._order;
    }
    get value() {
        return [this.coeficient1.value, this.coeficient2.value];
    }
    get zero() {
        return new Fp2(0n, 0n);
    }
    get one() {
        return new Fp2(1n, 0n);
    }
    normalize(v) {
        if (typeof v === "bigint") {
            return v;
        }
        return v instanceof Fp2 ? v : new Fp2(...v);
    }
    isEmpty() {
        return this.coeficient1.isEmpty() && this.coeficient2.isEmpty();
    }
    equals(rhs) {
        return (this.coeficient1.equals(rhs.coeficient1) &&
            this.coeficient2.equals(rhs.coeficient2));
    }
    negative() {
        return new Fp2(this.coeficient1.negative(), this.coeficient2.negative());
    }
    add(rhs) {
        return new Fp2(this.coeficient1.add(rhs.coeficient1), this.coeficient2.add(rhs.coeficient2));
    }
    subtract(rhs) {
        return new Fp2(this.coeficient1.subtract(rhs.coeficient1), this.coeficient2.subtract(rhs.coeficient2));
    }
    multiply(otherValue) {
        if (typeof otherValue === "bigint") {
            return new Fp2(this.coeficient1.multiply(otherValue), this.coeficient2.multiply(otherValue));
        }
        const v0 = this.coeficient1.multiply(otherValue.coeficient1);
        const v1 = this.coeficient2.negative().multiply(otherValue.coeficient2);
        const c0 = v0.add(v1);
        const c1 = this.coeficient1
            .add(this.coeficient2)
            .multiply(otherValue.coeficient1.add(otherValue.coeficient2))
            .subtract(v0)
            .add(v1);
        return new Fp2(c0, c1);
    }
    mulByNonresidue() {
        return new Fp2(this.coeficient1.subtract(this.coeficient2), this.coeficient1.add(this.coeficient2));
    }
    square() {
        const a = this.coeficient1.add(this.coeficient2);
        const b = this.coeficient1.subtract(this.coeficient2);
        const c = this.coeficient1.add(this.coeficient1);
        return new Fp2(a.multiply(b), c.multiply(this.coeficient2));
    }
    modularSquereRoot() {
        const candidateSquareroot = this.pow(Fp2.DIV_ORDER);
        const check = candidateSquareroot.square().div(this);
        const rootIndex = Fp2.EIGHTH_ROOTS_OF_UNITY.findIndex(a => a.equals(check));
        if (rootIndex === -1 || (rootIndex & 1) === 1) {
            return null;
        }
        const x1 = candidateSquareroot.div(Fp2.EIGHTH_ROOTS_OF_UNITY[rootIndex >> 1]);
        const x2 = x1.negative();
        const isImageGreater = x1.coeficient2.value > x2.coeficient2.value;
        const isReconstructedGreater = x1.coeficient2.equals(x2.coeficient2) &&
            x1.coeficient1.value > x2.coeficient1.value;
        return isImageGreater || isReconstructedGreater ? x1 : x2;
    }
    pow(n) {
        if (n === 1n) {
            return this;
        }
        let result = new Fp2(1n, 0n);
        let value = this;
        while (n > 0n) {
            if ((n & 1n) === 1n) {
                result = result.multiply(value);
            }
            n >>= 1n;
            value = value.square();
        }
        return result;
    }
    invert() {
        const t = this.coeficient1
            .square()
            .add(this.coeficient2.square())
            .invert();
        return new Fp2(this.coeficient1.multiply(t), this.coeficient2.multiply(t.negative()));
    }
    div(otherValue) {
        if (typeof otherValue === "bigint") {
            return new Fp2(this.coeficient1.div(otherValue), this.coeficient2.div(otherValue));
        }
        return this.multiply(otherValue.invert());
    }
}
Fp2._order = 1n;
Fp2.DIV_ORDER = 1n;
Fp2.EIGHTH_ROOTS_OF_UNITY = Array(8)
    .fill(null)
    .map(() => new Fp2());
Fp2.COFACTOR = 1n;
__decorate([
    group_1.normalized
], Fp2.prototype, "equals", null);
__decorate([
    group_1.normalized
], Fp2.prototype, "add", null);
__decorate([
    group_1.normalized
], Fp2.prototype, "subtract", null);
__decorate([
    group_1.normalized
], Fp2.prototype, "multiply", null);
__decorate([
    group_1.normalized
], Fp2.prototype, "div", null);
exports.Fp2 = Fp2;

},{"./fp":10,"./group":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function normalized(target, propertyKey, descriptor) {
    const propertyValue = target[propertyKey];
    if (typeof propertyValue !== "function") {
        return descriptor;
    }
    const previousImplementation = propertyValue;
    descriptor.value = function (arg) {
        const modifiedArgument = target.normalize(arg);
        return previousImplementation.call(this, modifiedArgument);
    };
    return descriptor;
}
exports.normalized = normalized;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("./fp");
const point_1 = require("./point");
const fp2_1 = require("./fp2");
const fp12_1 = require("./fp12");
const utils_1 = require("./utils");
var fp_2 = require("./fp");
exports.Fp = fp_2.Fp;
var fp2_2 = require("./fp2");
exports.Fp2 = fp2_2.Fp2;
var fp12_2 = require("./fp12");
exports.Fp12 = fp12_2.Fp12;
var point_2 = require("./point");
exports.Point = point_2.Point;
var utils_2 = require("./utils");
exports.P = utils_2.P;
exports.PRIME_ORDER = utils_2.PRIME_ORDER;
exports.G1 = new point_1.Point(new fp_1.Fp(3685416753713387016781088315183077757961620795782546409894578378688607592378376318836054947676345821548104185464507n), new fp_1.Fp(1339506544944476473020471379941921221584933875938349620426543736416511423956333506472724655353366534992391756441569n), new fp_1.Fp(1n), fp_1.Fp);
exports.G2 = new point_1.Point(new fp2_1.Fp2(352701069587466618187139116011060144890029952792775240219908644239793785735715026873347600343865175952761926303160n, 3059144344244213709971259814753781636986470325476647558659373206291635324768958432433509563104347017837885763365758n), new fp2_1.Fp2(1985150602287291935568054521177171638300868978215655730859378665066344726373823718423869104263333984641494340347905n, 927553665492332455747201965776037880757740193453592970025027978793976877002675564980949289727957565575433344219582n), new fp2_1.Fp2(1n, 0n), fp2_1.Fp2);
const G12 = exports.G2.twist();
const ONE = exports.G1;
const TWO = exports.G1.double();
const THREE = exports.G1.multiply(3);
const NE_ONE = exports.G1.multiply(utils_1.PRIME_ORDER - 1n);
const NE_TWO = exports.G1.multiply(utils_1.PRIME_ORDER - 2n);
const NE_THREE = exports.G1.multiply(utils_1.PRIME_ORDER - 3n);
function createLineBetween(p1, p2, n) {
    let mNumerator = p2.y.multiply(p1.z).subtract(p1.y.multiply(p2.z));
    let mDenominator = p2.x.multiply(p1.z).subtract(p1.x.multiply(p2.z));
    if (!mNumerator.equals(mNumerator.zero) &&
        mDenominator.equals(mDenominator.zero)) {
        return [
            n.x.multiply(p1.z).subtract(p1.x.multiply(n.z)),
            p1.z.multiply(n.z)
        ];
    }
    else if (mNumerator.equals(mNumerator.zero)) {
        mNumerator = p1.x.square().multiply(3n);
        mDenominator = p1.y.multiply(p1.z).multiply(2n);
    }
    const numeratorLine = mNumerator.multiply(n.x.multiply(p1.z).subtract(p1.x.multiply(n.z)));
    const denominatorLine = mDenominator.multiply(n.y.multiply(p1.z).subtract(p1.y.multiply(n.z)));
    const z = mDenominator.multiply(n.z).multiply(p1.z);
    return [numeratorLine.subtract(denominatorLine), z];
}
function castPointToFp12(pt) {
    if (pt.isEmpty()) {
        return new point_1.Point(new fp12_1.Fp12(), new fp12_1.Fp12(), new fp12_1.Fp12(), fp12_1.Fp12);
    }
    return new point_1.Point(new fp12_1.Fp12(pt.x.value, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n), new fp12_1.Fp12(pt.y.value, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n), new fp12_1.Fp12(pt.z.value, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n), fp12_1.Fp12);
}
const PSEUDO_BINARY_ENCODING = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1
];
function millerLoop(Q, P, withFinalExponent = false) {
    const one = new fp12_1.Fp12(1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    if (Q.isEmpty() || P.isEmpty()) {
        return one;
    }
    let R = Q;
    let fNumerator = one;
    let fDenominator = one;
    for (let i = PSEUDO_BINARY_ENCODING.length - 2; i >= 0n; i--) {
        const [n, d] = createLineBetween(R, R, P);
        fNumerator = fNumerator.square().multiply(n);
        fDenominator = fDenominator.square().multiply(d);
        R = R.double();
        if (PSEUDO_BINARY_ENCODING[i] === 1) {
            const [n, d] = createLineBetween(R, Q, P);
            fNumerator = fNumerator.multiply(n);
            fDenominator = fDenominator.multiply(d);
            R = R.add(Q);
        }
    }
    const f = fNumerator.div(fDenominator);
    return withFinalExponent ? f.pow(utils_1.P_ORDER_X_12_DIVIDED) : f;
}
function finalExponentiate(p) {
    return p.pow(utils_1.P_ORDER_X_12_DIVIDED);
}
function pairing(Q, P, withFinalExponent = true) {
    if (!Q.isOnCurve(utils_1.B2)) {
        throw new Error("Fisrt point isn't on elliptic curve");
    }
    if (!P.isOnCurve(utils_1.B)) {
        throw new Error("Second point isn't on elliptic curve");
    }
    return millerLoop(Q.twist(), castPointToFp12(P), withFinalExponent);
}
exports.pairing = pairing;
function getPublicKey(privateKey) {
    privateKey = utils_1.toBigInt(privateKey);
    return utils_1.publicKeyFromG1(exports.G1.multiply(privateKey));
}
exports.getPublicKey = getPublicKey;
async function sign(message, privateKey, domain) {
    domain =
        domain instanceof Uint8Array ? domain : utils_1.toBytesBE(domain, utils_1.DOMAIN_LENGTH);
    privateKey = utils_1.toBigInt(privateKey);
    const messageValue = await utils_1.hashToG2(message, domain);
    const signature = messageValue.multiply(privateKey);
    return utils_1.signatureFromG2(signature);
}
exports.sign = sign;
async function verify(message, publicKey, signature, domain) {
    domain =
        domain instanceof Uint8Array ? domain : utils_1.toBytesBE(domain, utils_1.DOMAIN_LENGTH);
    const publicKeyPoint = utils_1.publicKeyToG1(publicKey).negative();
    const signaturePoint = utils_1.signatureToG2(signature);
    try {
        const signaturePairing = pairing(signaturePoint, exports.G1);
        const hashPairing = pairing(await utils_1.hashToG2(message, domain), publicKeyPoint);
        const finalExponent = finalExponentiate(signaturePairing.multiply(hashPairing));
        return finalExponent.equals(finalExponent.one);
    }
    catch {
        return false;
    }
}
exports.verify = verify;
function aggregatePublicKeys(publicKeys) {
    if (publicKeys.length === 0) {
        throw new Error("Provide public keys which should be aggregated");
    }
    const aggregatedPublicKey = publicKeys.reduce((sum, publicKey) => sum.add(utils_1.publicKeyToG1(publicKey)), utils_1.Z1);
    return utils_1.publicKeyFromG1(aggregatedPublicKey);
}
exports.aggregatePublicKeys = aggregatePublicKeys;
function aggregateSignatures(signatures) {
    if (signatures.length === 0) {
        throw new Error("Provide signatures which should be aggregated");
    }
    const aggregatedSignature = signatures.reduce((sum, signature) => sum.add(utils_1.signatureToG2(signature)), utils_1.Z2);
    return utils_1.signatureFromG2(aggregatedSignature);
}
exports.aggregateSignatures = aggregateSignatures;
async function verifyMultiple(messages, publicKeys, signature, domain) {
    domain =
        domain instanceof Uint8Array ? domain : utils_1.toBytesBE(domain, utils_1.DOMAIN_LENGTH);
    if (messages.length === 0) {
        throw new Error("Provide messsages which should be verified");
    }
    if (publicKeys.length !== messages.length) {
        throw new Error("Count of public keys should be the same as messages");
    }
    try {
        let producer = new fp12_1.Fp12().one;
        for (const message of new Set(messages)) {
            const groupPublicKey = messages.reduce((groupPublicKey, m, i) => m !== message
                ? groupPublicKey
                : groupPublicKey.add(utils_1.publicKeyToG1(publicKeys[i])), utils_1.Z1);
            producer = producer.multiply(pairing(await utils_1.hashToG2(message, domain), groupPublicKey));
        }
        producer = producer.multiply(pairing(utils_1.signatureToG2(signature), exports.G1.negative()));
        const finalExponent = finalExponentiate(producer);
        return finalExponent.equals(finalExponent.one);
    }
    catch {
        return false;
    }
}
exports.verifyMultiple = verifyMultiple;

},{"./fp":10,"./fp12":11,"./fp2":12,"./point":15,"./utils":16}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fp12_1 = require("./fp12");
class Point {
    constructor(x, y, z, C) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.C = C;
    }
    static get W() {
        return new fp12_1.Fp12(0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    }
    static get W_SQUARE() {
        return new fp12_1.Fp12(0n, 0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    }
    static get W_CUBE() {
        return new fp12_1.Fp12(0n, 0n, 0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
    }
    isEmpty() {
        return this.x.isEmpty() && this.y.isEmpty() && this.z.isEmpty();
    }
    isOnCurve(b) {
        if (this.isEmpty()) {
            return true;
        }
        const lefSide = this.y
            .square()
            .multiply(this.z)
            .subtract(this.x.pow(3n));
        const rightSide = b.multiply(this.z.pow(3n));
        return lefSide.equals(rightSide);
    }
    equals(other) {
        return (this.x.multiply(other.z).equals(other.x.multiply(this.z)) &&
            this.y.multiply(other.z).equals(other.y.multiply(this.z)));
    }
    negative() {
        return new Point(this.x, this.y.negative(), this.z, this.C);
    }
    to2D() {
        return [this.x.div(this.z), this.y.div(this.z)];
    }
    double() {
        if (this.isEmpty()) {
            return this;
        }
        const W = this.x.square().multiply(3n);
        const S = this.y.multiply(this.z);
        const B = this.x.multiply(this.y).multiply(S);
        const H = W.square().subtract(B.multiply(8n));
        const newX = H.multiply(S).multiply(2n);
        const tmp = this.y
            .square()
            .multiply(S.square())
            .multiply(8n);
        const newY = W.multiply(B.multiply(4n).subtract(H)).subtract(tmp);
        const newZ = S.pow(3n).multiply(8n);
        return new Point(newX, newY, newZ, this.C);
    }
    add(other) {
        if (other.z.isEmpty()) {
            return this;
        }
        if (this.z.isEmpty()) {
            return other;
        }
        const u1 = other.y.multiply(this.z);
        const u2 = this.y.multiply(other.z);
        const v1 = other.x.multiply(this.z);
        const v2 = this.x.multiply(other.z);
        if (v1.equals(v2) && u1.equals(u2)) {
            return this.double();
        }
        if (v1.equals(v2)) {
            return new Point(this.x.one, this.y.one, this.z.zero, this.C);
        }
        const u = u1.subtract(u2);
        const v = v1.subtract(v2);
        const V_CUBE = v.pow(3n);
        const SQUERED_V_MUL_V2 = v.square().multiply(v2);
        const W = this.z.multiply(other.z);
        const A = u
            .square()
            .multiply(W)
            .subtract(v.pow(3n))
            .subtract(SQUERED_V_MUL_V2.multiply(2n));
        const newX = v.multiply(A);
        const newY = u
            .multiply(SQUERED_V_MUL_V2.subtract(A))
            .subtract(V_CUBE.multiply(u2));
        const newZ = V_CUBE.multiply(W);
        return new Point(newX, newY, newZ, this.C);
    }
    subtract(other) {
        return this.add(other.negative());
    }
    multiply(n) {
        n = BigInt(n);
        let result = new Point(this.x.one, this.y.one, this.z.zero, this.C);
        let point = this;
        while (n > 0n) {
            if ((n & 1n) === 1n) {
                result = result.add(point);
            }
            point = point.double();
            n >>= 1n;
        }
        return result;
    }
    twist() {
        if (!Array.isArray(this.x.value)) {
            return new Point(new fp12_1.Fp12(), new fp12_1.Fp12(), new fp12_1.Fp12(), fp12_1.Fp12);
        }
        const { x, y, z } = this;
        const [cx1, cx2] = [x.value[0] - x.value[1], x.value[1]];
        const [cy1, cy2] = [y.value[0] - y.value[1], y.value[1]];
        const [cz1, cz2] = [z.value[0] - z.value[1], z.value[1]];
        const newX = new fp12_1.Fp12(cx1, 0n, 0n, 0n, 0n, 0n, cx2, 0n, 0n, 0n, 0n, 0n);
        const newY = new fp12_1.Fp12(cy1, 0n, 0n, 0n, 0n, 0n, cy2, 0n, 0n, 0n, 0n, 0n);
        const newZ = new fp12_1.Fp12(cz1, 0n, 0n, 0n, 0n, 0n, cz2, 0n, 0n, 0n, 0n, 0n);
        return new Point(newX.div(Point.W_SQUARE), newY.div(Point.W_CUBE), newZ, fp12_1.Fp12);
    }
}
exports.Point = Point;

},{"./fp12":11}],16:[function(require,module,exports){
(function (process){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("./fp");
const fp2_1 = require("./fp2");
const fp12_1 = require("./fp12");
const point_1 = require("./point");
exports.PRIME_ORDER = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
exports.P = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
exports.DOMAIN_LENGTH = 8;
const P_ORDER_X_12 = exports.P ** 12n - 1n;
exports.P_ORDER_X_12_DIVIDED = P_ORDER_X_12 / exports.PRIME_ORDER;
const G2_COFACTOR = 305502333931268344200999753193121504214466019254188142667664032982267604182971884026507427359259977847832272839041616661285803823378372096355777062779109n;
fp_1.Fp.ORDER = exports.P;
fp2_1.Fp2.ORDER = exports.P ** 2n - 1n;
fp2_1.Fp2.COFACTOR = G2_COFACTOR;
exports.B = new fp_1.Fp(4n);
exports.B2 = new fp2_1.Fp2(4n, 4n);
exports.B12 = new fp12_1.Fp12(4n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n);
exports.Z1 = new point_1.Point(new fp_1.Fp(1n), new fp_1.Fp(1n), new fp_1.Fp(0n), fp_1.Fp);
exports.Z2 = new point_1.Point(new fp2_1.Fp2(1n, 0n), new fp2_1.Fp2(1n, 0n), new fp2_1.Fp2(0n, 0n), fp2_1.Fp2);
const POW_2_381 = 2n ** 381n;
const POW_2_382 = POW_2_381 * 2n;
const POW_2_383 = POW_2_382 * 2n;
const PUBLIC_KEY_LENGTH = 48;
let sha256;
if (typeof window == "object" && "crypto" in window) {
    sha256 = async (message) => {
        const buffer = await window.crypto.subtle.digest("SHA-256", message.buffer);
        return new Uint8Array(buffer);
    };
}
else if (typeof process === "object" && "node" in process.versions) {
    const req = require;
    const { createHash } = req("crypto");
    sha256 = async (message) => {
        const hash = createHash("sha256");
        hash.update(message);
        return Uint8Array.from(hash.digest());
    };
}
else {
    throw new Error("The environment doesn't have sha256 function");
}
function fromHexBE(hex) {
    return BigInt(`0x${hex}`);
}
function fromBytesBE(bytes) {
    if (typeof bytes === "string") {
        return fromHexBE(bytes);
    }
    let value = 0n;
    for (let i = bytes.length - 1, j = 0; i >= 0; i--, j++) {
        value += (BigInt(bytes[i]) & 255n) << (8n * BigInt(j));
    }
    return value;
}
function padStart(bytes, count, element) {
    if (bytes.length >= count) {
        return bytes;
    }
    const diff = count - bytes.length;
    const elements = Array(diff).fill(element).map((i) => i);
    return concatBytes(new Uint8Array(elements), bytes);
}
function toBytesBE(num, padding = 0) {
    let hex = typeof num === "string" ? num : num.toString(16);
    hex = hex.length & 1 ? `0${hex}` : hex;
    const len = hex.length / 2;
    const u8 = new Uint8Array(len);
    for (let j = 0, i = 0; i < hex.length && i < len * 2; i += 2, j++) {
        u8[j] = parseInt(hex[i] + hex[i + 1], 16);
    }
    return padStart(u8, padding, 0);
}
exports.toBytesBE = toBytesBE;
function toBigInt(num) {
    if (typeof num === "string") {
        return fromHexBE(num);
    }
    if (typeof num === "number") {
        return BigInt(num);
    }
    if (num instanceof Uint8Array) {
        return fromBytesBE(num);
    }
    return num;
}
exports.toBigInt = toBigInt;
function hexToBytes(hex) {
    hex = hex.length & 1 ? `0${hex}` : hex;
    const len = hex.length;
    const result = new Uint8Array(len / 2);
    for (let i = 0, j = 0; i < len - 1; i += 2, j++) {
        result[j] = parseInt(hex[i] + hex[i + 1], 16);
    }
    return result;
}
function concatBytes(...bytes) {
    return new Uint8Array(bytes.reduce((res, bytesView) => {
        bytesView =
            bytesView instanceof Uint8Array ? bytesView : hexToBytes(bytesView);
        return [...res, ...bytesView];
    }, []));
}
function powMod(x, power, order) {
    let fx = new fp_1.Fp(x);
    let res = new fp_1.Fp(1n);
    while (power > 0) {
        if (power & 1n) {
            res = res.multiply(fx);
        }
        power >>= 1n;
        fx = fx.square();
    }
    return res.value;
}
async function getXCoordinate(hash, domain) {
    const xReconstructed = toBigInt(await sha256(concatBytes(hash, domain, "01")));
    const xImage = toBigInt(await sha256(concatBytes(hash, domain, "02")));
    return new fp2_1.Fp2(xReconstructed, xImage);
}
exports.getXCoordinate = getXCoordinate;
const POW_SUM = POW_2_383 + POW_2_382;
function compressG1(point) {
    if (point.isEmpty()) {
        return POW_SUM;
    }
    const [x, y] = point.to2D();
    const flag = (y.value * 2n) / exports.P;
    return x.value + flag * POW_2_381 + POW_2_383;
}
const PART_OF_P = (exports.P + 1n) / 4n;
function uncompressG1(compressedValue) {
    const bflag = (compressedValue % POW_2_383) / POW_2_382;
    if (bflag === 1n) {
        return exports.Z1;
    }
    const x = compressedValue % POW_2_381;
    const fullY = (x ** 3n + exports.B.value) % exports.P;
    let y = powMod(fullY, PART_OF_P, exports.P);
    if (powMod(y, 2n, exports.P) !== fullY) {
        throw new Error("The given point is not on G1: y**2 = x**3 + b");
    }
    const aflag = (compressedValue % POW_2_382) / POW_2_381;
    if ((y * 2n) / exports.P !== aflag) {
        y = exports.P - y;
    }
    return new point_1.Point(new fp_1.Fp(x), new fp_1.Fp(y), new fp_1.Fp(1n), fp_1.Fp);
}
function compressG2(point) {
    if (!point.isOnCurve(exports.B2)) {
        throw new Error("The given point is not on the twisted curve over FQ**2");
    }
    if (point.isEmpty()) {
        return [POW_2_383 + POW_2_382, 0n];
    }
    const [[x0, x1], [y0, y1]] = point.to2D().map(a => a.value);
    const producer = y1 > 0 ? y1 : y0;
    const aflag1 = (producer * 2n) / exports.P;
    const z1 = x1 + aflag1 * POW_2_381 + POW_2_383;
    const z2 = x0;
    return [z1, z2];
}
function uncompressG2([z1, z2]) {
    const bflag1 = (z1 % POW_2_383) / POW_2_382;
    if (bflag1 === 1n) {
        return exports.Z2;
    }
    const x = new fp2_1.Fp2(z2, z1 % POW_2_381);
    let y = x
        .pow(3n)
        .add(exports.B2)
        .modularSquereRoot();
    if (y === null) {
        throw new Error("Failed to find a modular squareroot");
    }
    const [y0, y1] = y.value;
    const aflag1 = (z1 % POW_2_382) / POW_2_381;
    const isGreaterCoefficient = y1 > 0 && (y1 * 2n) / exports.P !== aflag1;
    const isZeroCoefficient = y1 === 0n && (y0 * 2n) / exports.P !== aflag1;
    if (isGreaterCoefficient || isZeroCoefficient) {
        y = y.multiply(-1n);
    }
    const point = new point_1.Point(x, y, y.one, fp2_1.Fp2);
    if (!point.isOnCurve(exports.B2)) {
        throw new Error("The given point is not on the twisted curve over Fp2");
    }
    return point;
}
function publicKeyFromG1(point) {
    const z = compressG1(point);
    return toBytesBE(z, PUBLIC_KEY_LENGTH);
}
exports.publicKeyFromG1 = publicKeyFromG1;
function publicKeyToG1(publicKey) {
    const z = fromBytesBE(publicKey);
    return uncompressG1(z);
}
exports.publicKeyToG1 = publicKeyToG1;
function signatureFromG2(point) {
    const [z1, z2] = compressG2(point);
    return concatBytes(toBytesBE(z1, PUBLIC_KEY_LENGTH), toBytesBE(z2, PUBLIC_KEY_LENGTH));
}
exports.signatureFromG2 = signatureFromG2;
function signatureToG2(signature) {
    const halfSignature = signature.length / 2;
    const z1 = fromBytesBE(signature.slice(0, halfSignature));
    const z2 = fromBytesBE(signature.slice(halfSignature));
    return uncompressG2([z1, z2]);
}
exports.signatureToG2 = signatureToG2;
async function hashToG2(hash, domain) {
    let xCoordinate = await getXCoordinate(hash, domain);
    let newResult = null;
    do {
        newResult = xCoordinate
            .pow(3n)
            .add(new fp2_1.Fp2(4n, 4n))
            .modularSquereRoot();
        const addition = newResult ? xCoordinate.zero : xCoordinate.one;
        xCoordinate = xCoordinate.add(addition);
    } while (newResult === null);
    const yCoordinate = newResult;
    const result = new point_1.Point(xCoordinate, yCoordinate, new fp2_1.Fp2(1n, 0n), fp2_1.Fp2);
    return result.multiply(fp2_1.Fp2.COFACTOR);
}
exports.hashToG2 = hashToG2;

}).call(this,require('_process'))
},{"./fp":10,"./fp12":11,"./fp2":12,"./point":15,"_process":1}]},{},[2])