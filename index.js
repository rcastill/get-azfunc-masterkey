// Credits to https://stackoverflow.com/questions/46338239/retrieve-the-host-keys-from-an-azure-function-app
const request = require('request');
const DOMParser = require('xmldom').DOMParser;

function isUndefined(param) {
    return typeof (param) == "undefined";
}

function validateParamsAndGetError(params) {
    if (isUndefined(params)) {
        return { error: "Empty params" };
    }
    if (isUndefined(params.clientId)) {
        return { error: "Missing clientId" };
    }
    if (isUndefined(params.clientSecret)) {
        return { error: "Missing clientSecret" };
    }
    if (isUndefined(params.tenant)) {
        return { error: "Missing tenant" };
    }
    if (isUndefined(params.functionApp)) {
        return { error: "Missing functionApp" };
    }
    if (isUndefined(params.subscriptionId)) {
        return { error: "Missing subscriptionId" };
    }
    if (isUndefined(params.resourceGroup)) {
        return { error: "Missing resourceGroup" };
    }
    return null;
}

function getAuthenticationBody(params) {
    return {
        grant_type: "client_credentials",
        client_id: params.clientId,
        client_secret: params.clientSecret,
        resource: "https://management.azure.com/"
    };
}

function getAuthenticationUrl(params) {
    return `https://login.microsoftonline.com/${params.tenant}/oauth2/token`;
}

function getApiUrlEndpoint(params, endpoint) {
    return `https://${params.functionApp}.scm.azurewebsites.net/api${endpoint}`;
}

function getSiteUrlEndpoint(params, endpoint) {
    return `https://${params.functionApp}.azurewebsites.net${endpoint}`;
}

function getPublishDataUrl(params) {
    return `https://management.azure.com/subscriptions/${params.subscriptionId}/resourceGroups/${params.resourceGroup}/providers/Microsoft.Web/sites/${params.functionApp}/publishxml?api-version=2016-08-01`;
}

function getFirstXmlAttributeByTag(xmlDocument, tag, attribute) {
    return xmlDocument.getElementsByTagName(tag)[0]
        .getAttribute(attribute);
}

function getBase64AuthInfo(user, pass) {
    return Buffer.from(`${user}:${pass}`)
        .toString('base64');
}

function makeMasterKeyHandler(returnCallback) {
    return (err, response, body) => {
        if (err) {
            returnCallback(err, null);
            return;
        }
        if (response && response.statusCode == 200) {
            let masterKey = JSON.parse(body).value;
            returnCallback(null, masterKey);
            return;
        }
        returnCallback(response, null);
    }
}

function makeKuduTokenHandler(params, returnCallback) {
    return (err, response, body) => {
        if (err) {
            returnCallback(err, null);
            return;
        }
        if (response && response.statusCode == 200) {
            let token = JSON.parse(body);
            request.get({
                url: getSiteUrlEndpoint(params, "/admin/host/systemkeys/_master"),
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }, makeMasterKeyHandler(returnCallback));
            return;
        }
        returnCallback(response, null);
    }
}

function makePublishDataHandler(params, returnCallback) {
    return (err, response, body) => {
        if (err) {
            returnCallback(err, null);
            return;
        }
        if (response && response.statusCode == 200) {
            let xml = new DOMParser()
                .parseFromString(body, "text/xml");
            request.get({
                url: getApiUrlEndpoint(params, "/functions/admin/token"),
                headers: {
                    Authorization: `Basic ${getBase64AuthInfo(
                        getFirstXmlAttributeByTag(xml, "publishProfile", "userName"),
                        getFirstXmlAttributeByTag(xml, "publishProfile", "userPWD"))}`
                }
            }, makeKuduTokenHandler(params, returnCallback));
            return;
        }
        returnCallback(response, null);
    };
}

function makeAuthenticationHandler(params, returnCallback) {
    return (err, response, body) => {
        if (err) {
            returnCallback(err, null);
            return;
        }
        if (response && response.statusCode == 200) {
            let token = JSON.parse(body).access_token;
            request.post({
                url: getPublishDataUrl(params),
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }, makePublishDataHandler(params, returnCallback));
            return;
        }
        returnCallback(response, null);
    };
}

module.exports = function (params, returnCallback) {
    let error = validateParamsAndGetError(params);
    if (error !== null) {
        returnCallback(error, null);
        return;
    }
    request.post(getAuthenticationUrl(params),
        { form: getAuthenticationBody(params) },
        makeAuthenticationHandler(params, returnCallback));
}