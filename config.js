var Path = require('path');
var Creds = require('./credentials');

module.exports = {

    product: {
        name: 'chalice-api'
    },

    server: {
        chaliceApi: {
            host: '0.0.0.0',
            port: process.env.PORT || 3009
        }
    },

    dogwater: {
        connections: {
            /*diskDb: {
                adapter: 'disk'
            },*/
            mysql: {
                adapter: "mysql",

                host      : 'localhost',
                port      : 3306,
                user      : Creds.mysqlCreds.user,
                password  : Creds.mysqlCreds.password,
                database  : 'chalice_api',
                connectionLimit: 30,
                waitForConnections: true,//don't know what this does but this is the default value

                // Optional
                charset   : 'utf8',
                collation : 'utf8_swedish_ci'
            }
        },
        adapters: {
            mysql: require('sails-mysql')
        },
        models: Path.normalize(__dirname + '/lib/models'),
        data: {
            dir: Path.normalize(__dirname + '/lib'),
            pattern: 'fixtures.js'
        }
    },

    poop: {
        logPath: Path.join(__dirname, 'poop.log')
    },

    secrets: {
        jwtSecret: Creds.secrets.jwtSecret
    },

};
