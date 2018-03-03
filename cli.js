#!/usr/bin/env node

const getMasterkey = require('./index');
const path = require('path');

(() => {
    if (process.argv.length !== 3) {
        console.error(`Usage: ${process.argv[1]} <path-to-authfile>`);
        process.exit(1);
    }
    let authFilePath = (!process.argv[2].startsWith('/')) ?
        path.join(process.cwd(), process.argv[2]) : process.argv[2];
    let authJsonFile;
    try {
        authJsonFile = require(authFilePath);
    } catch (err) {
        console.error(err.toString());
        process.exit(1);
    }
    getMasterkey(authJsonFile,
        (err, masterKey) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(masterKey);
        });
})();