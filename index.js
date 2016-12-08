'use strict';

let path = require('path');
let _ = require('lodash');
let winston = require('winston');
let Realm = require('realm');

// We don't use native Console(log) transport.
//
winston.remove(winston.transports.Console);

module.exports = (logPath) => {

    if(!_.isString(logPath)) {
        throw new Error('No #path sent to @pullman');
    }

    let realmPath = path.join(logPath, 'bus.realm');

    let RealmWinston = require('./bus-realm.js')(realmPath);

    try {
        winston.add(RealmWinston, {});
    } catch(e) {
        // TODO: maybe warn?
    }

    return {
        write: winston,
        read: new Realm({
            path: realmPath
        }).objects('Events')
    };
};