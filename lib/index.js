'use strict';

const Path = require('path');
const Package = require('../package.json');

exports.register = (server, options, next) => {

    server.register([
        {
            // Tag routes with "api" for use with swagger.
            register: require('hapi-swagger'),
            options: {
                basePath: '',
                apiVersion: 1,
                enableDocumentationPage: false
            }
        },
        {
            register: require('bedwetter'),
            options: {
                actAsUser: true,
                userIdProperty: 'user.id',
                setOwner: false,
                requireOwner: false,
                userUrlPrefix: '/user',
                userModel: 'users',
                ownerAttr: 'owner',
                childOwnerAttr: 'owner'
            }
        },
        {
            register: require('bassmaster'),
            options: {
                batchEndpoint: '/',
                tags: ['bassmaster']
            }
        },
        {
            register: require('hapi-auth-basic')
        },
        {
            register: require('hapi-auth-jwt2')
        },
        {
            register: require('inert')
        },
        {
            register: require('vision')
        }
    ],
    (err) => {

        if (err) {
            return next(err);
        }

        require('./authentication')(server, options);

        // Swagger docs
        server.route({
            method: 'GET',
            path: '/swagger',
            config: {
                description: 'Chalice API interface',
                auth: false
            },
            handler: { file: Path.normalize(__dirname + '/swagger.html') }
        });

        /**
         * pull in the routes from standalone files.
         */
        server.route(require('./routes/users')(server, options));
        server.route(require('./routes/lists')(server, options));
        server.route(require('./routes/beers')(server, options));
        server.route(require('./routes/taps')(server, options));
        next();
    });

};

exports.register.attributes = {
    pkg: Package,
    dependencies: 'dogwater'
};
