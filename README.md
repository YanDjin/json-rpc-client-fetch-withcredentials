# JSON-RPC-CLIENT-FETCH-WITHCREDENTIALS

## INSTALL

```
$ yarn add json-rpc-client-fetch-withcredentials
```

Open you `main.js` file and add the following:

```
import JsonRpcClient from 'json-rpc-client-fetch-withcredentials';

let client = new JsonRpcClient(<url>, <config>)

client.request('method_name', {params})
.then((response) => {
    console.log(response);
})
```
