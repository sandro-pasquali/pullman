'use strict';

let util = require('util');
let path = require('path');
let chalk = require('chalk');
let Promise = require('bluebird');
let winston = require('winston');
let Realm = require('realm');
let _ = require('lodash');

let isDev = process.env.NODE_ENV === 'development';

let RealmBus = function(options) {

    winston.Transport.call(this, options);

    // Configure the Realm
    //
    let LogSchema = {
        name: 'Log',
        properties: {
            level: 'string',
            message: 'string',
            timestamp: 'date'
        }
    };

    this.realm = new Realm({
        path: this.realmPath,
        schema: [LogSchema]
    });
};

// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(RealmBus, winston.Transport);

// Expose the name of this Transport on the prototype
//
RealmBus.prototype.name = 'realm';

// Define a getter so that `winston.transports.Realm`
// is available and thus backwards compatible.
//
winston.transports.Realm = RealmBus;

// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
RealmBus.prototype.log = function(level, msg, meta, callback) {
    return Promise.try(() => {

        // The logging db
        //
        this.realm.write(() => this.realm.create('Log', {
            level: level,
            message: msg,
            timestamp: new Date()
        }));

        // If it can be stringified, do that.
        // Otherwise use as is.
        //
        try {
            meta = JSON.stringify(meta);
        } catch(e) {}

        // Console logging when in dev mode
        //
        if(isDev) {
            level = chalk.bgYellow.black.bold(` ${level} `);
            msg = chalk.bgGreen.white.bold(` ${msg} `);
            meta = chalk.bgWhite.black(` ${meta} `);

            console.log(level, msg, meta);
        }

        callback(null, true);
    })
    .catch(err => {
        console.log(chalk.bgRed.white.bold(` BUS ERROR: ${err.message} `));
        callback(err)
    })
};

module.exports = (realmPath) => {

    RealmBus.prototype.realmPath = realmPath;

    return RealmBus;
}
