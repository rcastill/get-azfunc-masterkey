# Get Azure Functionapp master key

The name of this module is very self-explanaitory. It is useful when you want to automate an Azure Functionapp deployment.

## Installation

Use your favorite `NPM` package manager:

```sh
$ yarn global add get-azfunc-masterkey
```

## Usage

As a cli tool:

```sh
$ get-azfunc-masterkey <path-to-authfile>
```

Where the `authfile` is written in json format representing a single toplevel object with the following fields:

- **clientId**: a clientId of an Azure Active Directory application registration
- **clientSecret**: the clients secret
- **tenant**: the tenant ID
- **functionApp**: the name of your functionapp
- **subscriptionId**: the subscription ID
- **resourceGroup**: the resource group where the app resides

---

As a JS module:

```javascript
const getMasterKey = require('get-azfunc-masterkey');

getMasterKey({
    /* JS object with same fields as the authfile for the cli version */
}, (err, masterKey) => {
    if (err) {
        console.err(err);
        process.exit(1);
    }
    console.log(masterKey);
});
```

> **Note:** `clientId`, `clientSecret` and `tenant` fields can be obtained by running:
>
> `az ad sp create-for-rbac -n <application-registration-identifier>`
>
> That will create a new application registration and return the credentials (you must have the Azure cli 2.0 app and be logged in).
