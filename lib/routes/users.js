const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const Config = require('../../config');

const internals = {};

module.exports = function(server, options) {
    
    return [
        {
            method: 'POST',
            path: '/login',
            config: {
                tags: ['api'],
                description: 'Log into PracticeHub',
                validate: {
                    payload: {
                        email: Joi.string().email().required(),
                        password: Joi.string().required()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {
    
                var Model = request.model;
                var Tokens = request.model.tokens;
                var Users = request.model.users;
                var Payload = request.payload;
                
                var foundUser = Users.findOneByEmail(Payload.email).then(function(foundUser) {

                    if (!foundUser) {
                        return reply(Boom.unauthorized('User or Password is invalid'));
                    }
                    
                    Bcrypt.compare(Payload.password, foundUser.password, function (err, isValid) {

                        if (isValid){


                            var secret = Config.secrets.jwtSecret;

                            Tokens.create({
                                user: foundUser.id
                            })
                            .then(function(token) {
                                var signed = JWT.sign({
                                    jti: token.id,
                                    user: foundUser.id
                                }, secret);//not currently using options param, but it's avail.
                                console.log(signed);//this is so I can use postman more easily
                                reply(null, signed);
                            })
                            .catch(function(error){
                                reply(Boom.wrap(error))
                            });
                        } else {
                            return reply(Boom.unauthorized('User or Password is invalid'));
                        }
                    });
                });
            }
        },
        
        // - User CRUD -
        {
            method: 'GET',
            path: '/users/{id}',
            config: {
                description: 'Get a user',
                tags: ['api'],
                validate: {
                    params: {
                        id: Joi.any()
                    }
                },
                auth: false
            },
            handler: {
                bedwetter: {}
            },
        },
    ];
}