'use strict';

const Path = require('path');
const Glue = require('glue');
const Config = require('./config');


Config.server.chaliceApi.uri = (Config.server.chaliceApi.tls ? 'https://' : 'http://') +
                                    Config.server.chaliceApi.host + ':' +
                                    Config.server.chaliceApi.port;

const manifest = {

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
                        'https://0.0.0.0:*'
                    ],
                    additionalHeaders: [
                        'Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin'
                    ]
                }
            }
        }
    ],
    registrations: [
        {
            plugin: {
                register: './dogwater',
                options: Config.dogwater
            }
        },
        {
            plugin: {
                register: './poop',
                options: Config.poop
            }
        },
        {
            plugin: {
                register: '../lib'
            },
            options: {
                select: 'chalice-api'
            }
        }
    ]

};

module.exports = manifest;

// If this is being required, return the manifest.  Otherwise, start the server.
if (!module.parent) {
    Glue.compose(manifest, { relativeTo: Path.join(__dirname, 'node_modules') }, (err, server) => {

        if (err) {

            throw err;
        }

        server.start((err) => {

            if (err) {
                throw (err);
            }

            console.log('Chalice API Started on ' + Config.server.chaliceApi.uri);
        });
    });
}
