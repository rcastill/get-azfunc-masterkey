const getMasterkey = require('./index');

(() => {
    if (process.argv.length !== 3) {
        console.error(`Usage: ${process.argv[1]} <path-to-authfile>`);
        process.exit(1);
    }
    let authFilePath = (!process.argv[2].startsWith('/')) ?
        `./${process.argv[2]}` : process.argv[2];
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