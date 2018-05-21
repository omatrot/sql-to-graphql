'use strict';

var async = require('async');

function getTableForeignKeys(adapter, opts, cb) {
    var tables = opts.tables.reduce(function (map, tbl) {
        map[tbl] = getTableForeignKeysTask(adapter, tbl);
        return map;
    }, {});

    async.parallel(tables, cb);
}

function getTableForeignKeysTask(adapter, tblName) {
    return function getTableForeignKeys(cb) {
        adapter.getTableForeignKeys(tblName, cb);
    };
}

module.exports = getTableForeignKeys;
