'use strict';

const Boom = require('boom');
const Bcrypt = require('bcrypt');
const Config = require('../config');

const internals = {};

module.exports = (server, options) => {

    const Model = server.plugins.dogwater;
    const Tokens = Model.tokens;
    const Users = Model.users;

    server.auth.strategy('hapi-auth-basic', 'basic', false,
        {

            /**
             * was a stopgap, should go away?
             */
            validateFunc: (email, password, request, reply) => {

                Users.findOne().where({ 'email': email }).then((user) => {

                    if (!user) {
                        return reply(null, false);
                    }
                    //arrow syntax still seems chintzy to me, but es6 and all...
                    Bcrypt.compare(password, user.password, (err, isValid) => {

                        return reply(err, isValid, { id: user.id, email: user.email });
                    });
                })
                .catch((error) => {

                    return reply(Boom.wrap(error));
                });
            }
            //verifyOptions: { algorithms: [ 'HS256' ] } // pick a strong algorithm
        });

    //the TRUE here, sets this strategy as the default for all routes.    This
    //isn't necessarily bad, but needs to be noted.
    server.auth.strategy('api-user-jwt', 'jwt', true,
        {
            key: Config.secrets.jwtSecret,
            /**
             * [validateFunc description]
             * @param    decoded    decoded but unverified JWT token
             * @param    request    original request received from client
             * @param    callback function, must have signature (err,valid,credentials(optional))
             */
            validateFunc: (decoded, request, reply) => {

                Tokens.findOneById(decoded.jti)
                .then((token) => {

                    if (token) {
                        Users.findOne().where({ 'id': token.user }).then((user) => {

                            if (typeof (user) !== 'undefined') {

                                reply(null, true, { user: user });

                            } else {

                                reply(null,false);

                            }
                        })
                        .catch((error) => {

                            console.log(error);
                            reply(null,false);
                        });
                    } else {
                        return reply(null, false);
                    }
                })
                .catch((error) => {

                    return reply(Boom.wrap(error));
                });
            },
            verifyOptions: { algorithms: ['HS256'] } // pick a strong algorithm
        });
};
