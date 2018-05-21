'use strict';

var filter = require('lodash/collection/filter');
var snakeCase = require('lodash/string/snakeCase');
var capitalize = require('lodash/string/capitalize');

// Naïve way
module.exports = function findReferencesNaive(models) {
    for (var type in models) {
        console.log(`Processing foreign keys of entity [${type}]...`);
        models[type].references = findReferencesForModelNaive(models[type], models);
        models[type].listReferences = [];
    }

    return models;
}

function findReferencesForModelNaive(model, models) {
    // Find columns that end with "Id"
    var refs = filter(model.fields, isIdColumn);
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model
    return refs.reduce(function (references, col) {
        // Here we now that col.name ends with '_id' because it is required by design
        var colName = col.name.substr(0, col.name.length - 2).replace(/^parent/, '');
        var parts = snakeCase(colName).split('_'), fieldName;

        console.log(`reducing [${col.name}] => colName [${colName}] parts [${parts}]`);

        do {
            var name = parts.map(capitalize).join('');

            // Do we have a match for this?
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '');

                // If we collide with a different field name, add a "Ref"-suffix
                if (fields.indexOf(fieldName) !== -1) {
                    fieldName += 'Ref';
                }

                console.log(` found [${fieldName}] referencing [${col.name}] in [${models[name].name}]`);

                references.push({
                    model: models[name],
                    field: fieldName,
                    refField: col.name
                });

                return references;
            }

            parts.shift();
        } while (parts.length > 0);

        return references;
    }, []);
}

function isIdColumn(col) {
    return !col.isPrimaryKey && col.name.substr(-2) === 'Id';
}

//

// From the database structure (MySQL only)


/* module.exports = function findReferencesFromDatabaseStructure(models, fks) {
    for (var type in models) {
        console.log(`Processing foreign keys of entity [${type}]...`);
        models[type].references = findReferencesForModelFromDatabaseStructure(models[type], models, fks);
        models[type].listReferences = [];
    }

    return models;
} */

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function findReferencesForModelFromDatabaseStructure(model, models, allForeignKeys) {
    // Find the columns that have a corresponding FK
    var refs = filter(model.fields, isFkColumn);
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model

    return refs.reduce(function (references, col) {
        var colName = col.originalName;
        var parts = snakeCase(colName).split('_'), fieldName;

        console.log(`reducing [${col.name}] => colName [${colName}] parts [${parts}]`);

        do {
            // In the old code, the referenced table name is deduced from the column name
            // ie "tablename_primarykey"
            // This is just impossible in the new case
            // we must look for the column name is the foreign keys
            var fk = allForeignKeys[model.table].filter(function (fk) {
                return fk.columnName === colName;
            })[0];
            var name = fk && fk.referencedTableName || "__no__match__";
            // There could be underscores in table names !!!
            name = toTitleCase(name.replace(/_/g, " ")).replace(" ", ""); // capitalize(name);

            // Do we have a match for this?
            console.log(` looking for a match for [${name}]...`);
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '');

                console.log(` ...found [${fieldName}] referencing [${col.name + 'Id'}] in [${models[name].name}]`);

                references.push({
                    model: models[name],
                    field: fieldName,
                    refField: col.name + 'Id'
                });

                return references;
            }

            parts.shift();
        } while (parts.length > 0);

        return references;
    }, []);
}

function isFkColumn(col) {
    return col.isForeignKey;
}
//

