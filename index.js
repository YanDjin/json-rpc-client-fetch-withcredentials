'use strict';

var defaultHeaders = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
};

var settings = {
  lastId: 1,
  endPoint: null,
  headers: defaultHeaders,
  credentials: null,
  debug: null,
}

function JsonRpcClient(endPoint, credentials = 'include', debug = false) {
  settings.endPoint = endPoint;
  settings.credentials = credentials;
  settings.debug = debug;
}

JsonRpcClient.prototype.request = function(method, params = {}) {
  let id = settings.lastId++;

  let req = {
    method: 'POST',
    credentials: settings.credentials,
    headers: settings.headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: id,
      method: method,
      params: params,
    }),
  };

  return fetch(settings.endPoint, req)
      .then(res => checkStatus(res))
      .then(res => parseJSON(res))
      .then(res => checkError(res, req, settings.debug))
      .then(res => logResponse(res, settings.debug));
}

function parseJSON(response) {
    return response.json();
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

        const error = new RpcError(data.error, req, data);
        error.response = data;

        throw error;
    }

    return data;
}

function logResponse(response, debug = false) {
    if (debug === true) {
        /* eslint-disable no-console */
        console.log('Got response for id', response.id, 'with response', response.result);
        console.log('Response message for request', response.id, ':', response.result.message);
        /* eslint-enable no-console */
    }

    return response.result;
}

/**
 * RpcError is a simple error wrapper holding the request and the response.
 */
export class RpcError extends Error {
    constructor(message, request, response) {
        super(message);

        this.name = 'RpcError';
        this.message = (message || '');
        this.request = request;
        this.response = response;
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
}

export default JsonRpcClient;
