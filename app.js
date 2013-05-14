#!/usr/bin/env node
var _ = require('underscore');
var mysql = require('mysql');
var argv = require('optimist').argv;



if (!_.isUndefined(argv.help)){
    console.log("Usage: obfuscate_mysql [OPTIONS] --database <database> --config <path/to/config.json>");
    console.log("Options:");
    console.log("   --username=<mysql_username>         Your username for mysql. Defaults to root.");
    console.log("   --password=<mysql_password>         Your password for mysql. Defaults to blank.");
    console.log("   --host=<mysql_host_address>         The address for mysql. Defaults to localhost.");
    console.log("");
    console.log("Config file format:");
    console.log('{');
    console.log('    "tables": [{');
    console.log('        "name": "Address",');
    console.log('        "configs": [{');
    console.log('            "where": "AddressCountryId = 2",');
    console.log('            "id": "AddressId",');
    console.log('            "AddressStreetLine1": "fake_address_US.StreetAddress",');
    console.log('            "AddressStreetLine2": "null",');
    console.log('            "AddressCity": "fake_address_US.City",');
    console.log('            "AddressProvince": "fake_address_US.State",');
    console.log('            "AddressPostalCode": "fake_address_US.ZipCode",');
    console.log('            "AddressCountryId": "fake_address_US.Country",');
    console.log('            "Phone": "fake_address_US.TelephoneNumber",');
    console.log('            "ContactPersonFirstName": "fake_address_US.GivenName",');
    console.log('            "ContactPersonLastName": "fake_address_US.Surname"');
    console.log('        },{');
    console.log('            "where": "AddressCountryId = 1",');
    console.log('            "id": "AddressId",');
    console.log('            "AddressStreetLine1": "fake_address_CA.StreetAddress",');
    console.log('            "AddressStreetLine2": "null",');
    console.log('            "AddressCity": "fake_address_CA.City",');
    console.log('            "AddressProvince": "fake_address_CA.State",');
    console.log('            "AddressPostalCode": "fake_address_CA.ZipCode",');
    console.log('            "AddressCountryId": "fake_address_CA.Country",');
    console.log('            "Phone": "fake_address_CA.TelephoneNumber",');
    console.log('            "ContactPersonFirstName": "fake_address_CA.GivenName",');
    console.log('            "ContactPersonLastName": "fake_address_CA.Surname"');
    console.log('        }]');
    console.log('    },{');
    console.log('        "name": "Person",');
    console.log('        "configs": [{');
    console.log('            "where": "",');
    console.log('            "id": "PersonId",');
    console.log('            "PersonFirstName": "fake_person.GivenName",');
    console.log('            "PersonLastName": "fake_person.Surname",');
    console.log('            "company": "fake_person.Company",');
    console.log('            "phone": "fake_person.TelephoneNumber"');
    console.log('        }]');
    console.log('    }]');
    console.log('}');

    process.exit(code=0);
}




var commandline_host = _.isUndefined(argv.host) ? 'localhost' : argv.host;
var commandline_user = _.isUndefined(argv.username) ? 'root' : argv.username;
var commandline_pass = _.isUndefined(argv.password) ? '' : argv.password;
var commandline_configfile = null;
if (_.isUndefined(argv.config)) {
    console.log("the --config command line parameter is required.")
    process.exit(1);
} else {
    commandline_configfile = argv.config;
}
var config = require(commandline_configfile);

var commandline_database = null;
if (_.isUndefined(argv.database)) {
    console.log("the --database command line parameter is required.")
    process.exit(1);
} else {
    commandline_database = argv.database;
}

var connection = mysql.createConnection({
    host     : commandline_host,
    user     : commandline_user,
    password : commandline_pass,
    database : commandline_database
});

connection.connect(function(err) {
    if (err !== undefined && err !== null) {
        console.log("Error connecting to database: " + err);
        process.exit(1);
    }
});

var tableConfigs = {};
var secondLevelQueryCount = 0;
var secondLevelQueryCounter = 0;

obfuscate();



function obfuscate() {

    for (var i = 0; i < config.tables.length; i++) {
        var table = config.tables[i];
        var tableName = table.name;
        for (var j = 0; j < table.configs.length; j++) {
            var tableConfig = table.configs[j];
            tableConfig.table = tableName;
            tableConfigs[i + "_" + j] = tableConfig;
            var whereClause = tableConfig.where;
            var tableIdCol = tableConfig.id;

            var querySql = 'SELECT \'' + i + '_' + j + '\' as tableConfig, ' + tableIdCol + ' FROM ' + tableName + '' + (whereClause === '' ? '' : ' WHERE ' + whereClause) + ";";
            connection.query(querySql, function(err, results) {
                secondLevelQueryCount += results.length;
                for (var k = 0; k < results.length; k++) {
                    var tblConf = tableConfigs[results[k]["tableConfig"]];


                    var cols = _.filter(_.keys(tblConf), function(keyName) {
                        return keyName !== "where" && keyName !== "id" && keyName !== "table";
                    });
                    var idToUpdate = results[k][tblConf.id];

                    var updateSql = 'update ' + tblConf.table + ' set ';

                    for (var l = 0; l < cols.length; l++) {
                        var col = cols[l];

                        if (tblConf[col] !== "null") {
                            var filename = tblConf[col].split('.')[0];
                            var property = tblConf[col].split('.')[1];

                            var fakeFile = require("./" + filename);
                            var fakeFileIndex = k
                            if (fakeFile.length - 1 < k) {
                                fakeFileIndex -= fakeFile.length;
                            }
                            console.log("fakeFileIndex: %d", fakeFileIndex)

                            updateSql += col + " = " + connection.escape(fakeFile[fakeFileIndex][property]);
                        } else {
                            updateSql += col + " = null"
                        }

                        if (l + 1 < cols.length) {
                            updateSql += ","
                        }
                    }

                    updateSql += " WHERE " + tblConf.id + "=" +idToUpdate+";";

                    connection.query(updateSql, function(err, results) {
                        if (err !== null) {
                            console.log(err);
                        }
                    }).on("end", function() {
                        secondLevelQueryCounter++;
                        if (secondLevelQueryCounter == secondLevelQueryCount) {
                            connection.end();
                        }
                    });
                }
            });
        }
    }
}