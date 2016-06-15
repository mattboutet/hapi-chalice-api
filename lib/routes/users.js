'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const Moment = require('Moment');
const _ = require('lodash');

const Config = require('../../config');

const internals = {};

module.exports = (server, options) => {

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
            handler: (request, reply) => {

                const Tokens = request.model.tokens;
                const Users = request.model.users;
                const Payload = request.payload;

                Users.findOne({ email: Payload.email }).then((foundUser) => {

                    if (!foundUser) {
                        return reply(Boom.unauthorized('User or Password is invalid'));
                    }

                    Bcrypt.compare(Payload.password, foundUser.password, (err, isValid) => {

                        if (err) {
                            return reply(Boom.wrap(err));
                        }

                        if (isValid){
                            const secret = Config.secrets.jwtSecret;

                            Tokens.create({
                                user: foundUser.id
                            })
                            .then((token) => {

                                const signed = JWT.sign({
                                    jti: token.id,
                                    user: foundUser.id
                                }, secret);//not currently using options param, but it's avail.
                                console.log(signed);//this is so I can use postman more easily
                                reply(null, signed);
                            })
                            .catch((error) => {

                                return reply(Boom.wrap(error));
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
            }
        },
        {
            method: 'GET',
            path: '/user',
            config: {
                description: 'Get logged-in user',
                tags: ['api', 'private', 'findone'],
                validate: {
                    headers: Joi.object({
                        authorization: Joi.string()
                        .description('JWT')
                    }).unknown()
                },
                auth: {
                    strategy: 'api-user-jwt'
                }
            },
            handler: (request, reply) => {

                const Users = request.model.users;
                const user = request.auth.credentials.user;

                if (user){

                    Users.findOne().where({ 'id': user.id }).then((foundUser) => {

                        return reply(foundUser);
                    })
                    .catch((err) => {

                        return reply(Boom.wrap(err));
                    });
                } else {
                    reply(Boom.notFound('User not found'));
                }
            }
        },
        {
            method: 'POST',
            path: '/user',
            config: {
                tags: ['api'],
                description: 'Register new user',
                validate: {
                    payload: {
                        email: Joi.string().email().required(),
                        password: Joi.string().required(),
                        firstName: Joi.string().required(),
                        lastName: Joi.string().required(),
                        listId: Joi.any().valid('1','2')
                    }
                },
                auth: false
            },
            handler: (request, reply) => {

                const Users = request.model.users;
                const Payload = request.payload;

                Bcrypt.hash(Payload.password, 10, (err, hash) => {

                    if (err) {
                        return reply(Boom.internal());
                    }
                    Users.create({
                        email: Payload.email,
                        password: hash,
                        firstName: Payload.firstName,
                        lastName: Payload.lastName,
                        list: Payload.listId
                    },
                    (error, user) => {

                        if (error){
                            return reply(Boom.wrap(error));
                        }

                        return reply(user);
                    });
                });
            }
        },
        {
            method: 'GET',
            path: '/user/list',
            config: {
                description: 'Get list for logged-in user',
                tags: ['api', 'private'],
                validate: {
                    headers: Joi.object({
                        authorization: Joi.string()
                        .description('JWT')
                    }).unknown()
                },
                auth: {
                    strategy: 'api-user-jwt'
                }
            },
            handler: (request, reply) => {

                const Users = request.model.users;
                const user = request.auth.credentials.user;
                const Lists = request.model.lists;

                if (user){
                    //I was hoping to do something like this, but https://github.com/balderdashy/waterline/pull/1052 has been pending for 6+ months
                    //so I'm gonna do it by hand instead(since there's only 1 list), and will figure the PR out later.
                    //Users.findOne().where({'id': user.id}).populate('beers').populate('list.beers').then(function(user){
                    Users.findOne().where({ 'id': user.id }).populate('beers').then((foundUser) => {

                        Lists.findOne().where({ 'id': user.list }).populate('beers').then((list) => {

                            const userList = {
                                drank: foundUser.beers,
                                unDrank: _.differenceBy(list.beers, foundUser.beers, 'id')
                            };

                            return reply(userList);
                        })
                        .catch((err) => {

                            return reply(Boom.wrap(err));
                        });
                    })
                    .catch((err) => {

                        return reply(Boom.wrap(err));
                    });
                } else {
                    reply(Boom.notFound('User not found'));
                }
            }
        },
        {
            method: 'GET',
            path: '/user/onTap',
            config: {
                description: 'Get user customized taplist for today',
                tags: ['api', 'private'],
                validate: {
                    headers: Joi.object({
                        authorization: Joi.string()
                        .description('JWT')
                    }).unknown()
                },
                auth: {
                    strategy: 'api-user-jwt'
                }
            },
            handler: (request, reply) => {

                const Users = request.model.users;
                const user = request.auth.credentials.user;
                const Lists = request.model.lists;
                const Taps = request.model.taps;

                if (user){
                    Users.findOne().where({ 'id': user.id }).populate('beers').then((foundUser) => {

                        Lists.findOne().where({ 'id': foundUser.list }).populate('beers').then((list) => {

                            const begin = Moment(Moment().format('YYYY-MM-DD')).toISOString();
                            const end = Moment(Moment().format('YYYY-MM-DD')).add(1, 'days').toISOString();

                            Taps.findOne({ createdAt: { '>=': begin, '<': end } }).populate('beers').then((tapList) => {

                                const custom = {};

                                //lodash to the rescue!
                                const onTapOnList = _.intersectionBy(tapList.beers, list.beers, 'id');
                                custom.onTapDrank = _.intersectionBy(onTapOnList, foundUser.beers, 'id');
                                custom.onTapUndrank = _.differenceBy(onTapOnList, custom.onTapDrank, 'id');
                                custom.theRest = _.differenceBy(tapList.beers, custom.onTapDrank, custom.onTapUndrank, 'id');
                                return reply(custom);

                            })
                            .catch((err) => {

                                console.log(err);
                                return reply(Boom.wrap(err));
                            });
                        })
                        .catch((err) => {

                            console.log(err);
                            return reply(Boom.wrap(err));
                        });
                    }).catch((err) => {

                        return reply(Boom.wrap(err));
                    });
                } else {
                    reply(Boom.notFound('User not found'));
                }
            }
        }
    ];
};
