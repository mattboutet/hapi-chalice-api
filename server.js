var Path = require('path');
var Hapi = require('hapi');
var Glue = require('glue');
var Config = require('./config');


Config.server.chaliceApi.uri = (Config.server.chaliceApi.tls ? 'https://' : 'http://') +
                                    Config.server.chaliceApi.host + ':' +
                                    Config.server.chaliceApi.port;

var manifest = {

    server: {
        app: {
            config: Config
        }
    },

    connections: [
        {
            host: Config.server.chaliceApi.host,
            port: Config.server.chaliceApi.port,
            labels: 'chalice-api',
            routes: {
                //cors: true
                cors: {
                    credentials: true,
                    //isOriginExposed: false,
                    origin: [
                        'http://localhost:*',
                        'https://localhost:*',
                        'http://0.0.0.0:*',
                        'https://0.0.0.0:*',
                    ],
                    additionalHeaders: [
                        'Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin'
                    ]
                },
            }
        }
    ],

    plugins: {

        // General porpoise
        './dogwater':   Config.dogwater,
        './poop':       Config.poop,

        // Server-specific
        '../lib': [{ select: 'chalice-api' }]

    }

};

module.exports = manifest;

// If this is being required, return the manifest.  Otherwise, start the server.
if (!module.parent) {
    Glue.compose(manifest, { relativeTo: Path.join(__dirname, 'node_modules') }, function (err, server) {

        if (err) {

            throw err;
        }

        server.start(function () {

            console.log('Chalice API Started on ' + Config.server.chaliceApi.uri);
        });
    });
}
