# JS-JSON-RPC-CLIENT-WITHCREDENTIALS

## INSTALL

```
$ npm install js-json-rpc-client-withcredentials
```

Open you `main.js`file and add the following:

```
import JsonRpcClient from 'js-json-rpc-client-withcredentials';

let client = JsonRpcClient(<url>, <headers>, <withCredentials>, <config>)

client.request('method_name', params)
.then((response) => {
    console.log(response);
})
```
