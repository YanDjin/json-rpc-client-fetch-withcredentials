"use strict";

var defaultHeaders = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest"
};

var settings = {
  lastId: 1,
  endPoint: null,
  headers: defaultHeaders,
  credentials: null,
  debug: null,
  callbacksOnResponse: []
};

/**
 * callbacksOnResponse must be a json with this content
 * key : status code
 * value : json composed of and object or multiple objects in an array
 *         each object is composed of a func field (function definition) and a params field (array containing the function parameters)
 *         the parameters are taken by the function in order
 * ex: {
 *    403: {
 *      func: console.log,
 *      params: ['aaa', 'bbb']
 *    }
 * }
 * result: on result, if the status code is 403 : console.log('aaa', 'bbb'); is executed
 */
function JsonRpcClient(endPoint, credentials = "include", newHeaders = null, debug = false, callbacksOnResponse = []) {
  settings.endPoint = endPoint;
  settings.credentials = credentials;
  settings.debug = debug;
  settings.callbacksOnResponse = callbacksOnResponse;
  if (newHeaders !== null) {
    for (const [key, value] of Object.entries(newHeaders)) {
      settings.headers[key] = value;
    }
  }
}

JsonRpcClient.prototype.setNewHeaders = (newHeaders = {}) => {
  for (const [key, value] of Object.entries(newHeaders)) {
    settings.headers[key] = value;
  }
};

JsonRpcClient.prototype.request = (method, params = {}) => {
  let id = settings.lastId++;
  let req = {
    method: "POST",
    credentials: settings.credentials,
    headers: settings.headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: id,
      method: method,
      params: params
    })
  };

  return fetch(settings.endPoint, req)
    .catch(error => {
      throw error;
    })
    .then(res => checkStatus(res))
    .then(res => parseJSONAndCheckCallbacks(res))
    .then(res => checkError(res, req, settings.debug))
    .then(res => logResponse(res, settings.debug));
};

function parseJSONAndCheckCallbacks(response) {
  let callbacksOnResponse = settings.callbacksOnResponse;

  return response.json().then(json => {
    callBackLoop: for (let i = 0; i < callbacksOnResponse.length; i++) {
      if (!callbacksOnResponse[i].hasOwnProperty("condition")) {
        continue;
      }
      const { code, method } = callbacksOnResponse[i].condition;
      const { func, params } = callbacksOnResponse[i];

      if (code !== undefined && !Array.isArray(code)) {
        code = [code];
      } else if (code !== undefined) {
        statusCodeLoop: for (let j = 0; j < code.length; j++) {
          if (code[i] === response.status) {
            break statusCodeLoop;
          }
          if (j === callbacksOnResponse.length - 1) {
            break callBackLoop;
          }
        }
      }

      if (method !== undefined && method.func !== undefined) {
        if (method.params) {
          if (!method.func(json, ...method.params)) {
            break callBackLoop;
          }
        } else {
          if (!method.func(json)) {
            break callBackLoop;
          }
        }
      }

      if (params !== undefined) {
        if (!Array.isArray(params)) {
          params = [params];
        }
        func(...params);
      } else {
        func();
      }
    }

    return Promise.resolve(json);
  });
}

function checkStatus(response) {
  // we assume 400 as valid code here because it's the default return code when sth has gone wrong,
  // but then we have an error within the response, no?
  if (response.status >= 200 && response.status <= 400) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function checkError(data, req, debug = false) {
  if (data.error) {
    /* eslint-disable no-console */
    if (debug === true && console && console.error) {
      console.error(`Request ID ${data.id} failed: ${data.error}`);
    } else if (debug === true && console && console.log) {
      console.log(`Request ID ${data.id} failed: ${data.error}`);
    }
    /* eslint-enable no-console */

    throw new RpcError(data.error.message, req, data.error.data, data.error.code);
  }

  return data;
}

function logResponse(response, debug = false) {
  if (debug === true) {
    /* eslint-disable no-console */
    console.log("Got response for id", response.id, "with response", response.result);
    console.log("Response message for request", response.id, ":", response.result.message);
    /* eslint-enable no-console */
  }
  return response.result;
}

/**
 * RpcError is a simple error wrapper holding the request and the response.
 */
export class RpcError extends Error {
  constructor(message, request, response, code) {
    super(message);
    this.name = "RpcError";
    this.message = message || "";
    this.request = request;
    this.response = response;
    this.code = code;
  }

  toString() {
    return this.message;
  }

  getRequest() {
    return this.request;
  }

  getResponse() {
    return this.response;
  }

  getCode() {
    return this.code;
  }

  hasMessage() {
    return this.message !== undefined;
  }

  hasResponse() {
    return this.response !== undefined;
  }
}

export default JsonRpcClient;
