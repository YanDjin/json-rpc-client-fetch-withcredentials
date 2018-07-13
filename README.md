# JSON-RPC-CLIENT-FETCH-WITHCREDENTIALS

## INSTALL

```
$ yarn add js-json-rpc-client-withcredentials
```

Open you `main.js` file and add the following:

```
import JsonRpcClient from 'json-rpc-client-fetch-withcredentials';

let client = JsonRpcClient(<url>, <credentials>, <config>)

client.request('method_name', params)
.then((response) => {
    console.log(response);
})
```
