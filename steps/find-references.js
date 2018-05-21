'use strict';

var filter = require('lodash/collection/filter');
var snakeCase = require('lodash/string/snakeCase');
var capitalize = require('lodash/string/capitalize');

// Naïve way
module.exports = function findReferencesNaive(models) {
    for (var type in models) {
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
        var colName = col.name.substr(0, col.name.length - 2).replace(/^parent/, '');
        var parts = snakeCase(colName).split('_'), fieldName;

        do {
            var name = parts.map(capitalize).join('');

            // Do we have a match for this?
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '');

                // If we collide with a different field name, add a "Ref"-suffix
                if (fields.indexOf(fieldName) !== -1) {
                    fieldName += 'Ref';
                }

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

// From the dataase structure (MySQL only)

module.exports = function findReferencesFromDatabaseStructure(models, fks) {
    for (var type in models) {
        console.log(`Processing foreign keys of [${type}]...`);
        models[type].references = findReferencesForModelFromDatabaseStructure(models[type], models, fks);
        models[type].listReferences = [];
    }

    return models;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function findReferencesForModelFromDatabaseStructure(model, models, allForeignKeys) {
    // Take all the columns in the allForeignKeys collection
    var refs = allForeignKeys[model.normalizedTable];
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model
    return refs.reduce(function (references, col) {
        var colName = col.columnName;
        var parts = snakeCase(colName).split('_'), fieldName;

        do {

            var name = col.referencedTableName;

            fieldName = col.columnName;

            var entity = toTitleCase(name.replace(/_/g, " ")).replace(" ", "");

            console.log(` found [${fieldName}] referencing [${col.referencedColumnName}] in [${entity}]`);

            references.push({
                model: models[entity],
                field: fieldName,
                refField: col.referencedColumnName
            });

            return references;


            parts.shift();
        } while (parts.length > 0);

        return references;
    }, []);
}
//

