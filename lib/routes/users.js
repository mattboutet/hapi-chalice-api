const Async = require('async');
const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const Moment = require('Moment');
const _ = require('lodash');

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

        Users.findOne({email: Payload.email}).then(function(foundUser) {

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
    {
      method: 'GET',
      path: '/user',
      config: {
        description: 'Get logged-in user',
        tags: ['api', 'private', 'findone'],
        auth: {
          strategy: 'api-user-jwt',
        },
      },
      handler: function(request, reply) {
        var Users = request.model.users;
        var user = request.auth.credentials.user;

        if (user){
          //var jsonWebToken = request.headers.authorization;

          Users.findOne().where({'id': user.id}).then(function(user){
            return reply(user);
          })
          .catch(function(err){
            return reply(Boom.notFound('User not found'));
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
      handler: function(request, reply) {

        var Tokens = request.model.tokens;
        var Users = request.model.users;
        var Payload = request.payload;
        var password = Payload.password;

        Bcrypt.hash(Payload.password, 10, (err, hash) =>{
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
          function(error, user){
            if (error){
              return reply(Boom.wrap(error));
            } else {
              return reply(user);
            }

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
            }).unknown(),
        },
        auth: {
          strategy: 'api-user-jwt',
        },
      },
      handler: function(request, reply) {
        var Users = request.model.users;
        var user = request.auth.credentials.user;
        var Lists = request.model.lists;

        if (user){
          //I was hoping to do something like this, but https://github.com/balderdashy/waterline/pull/1052 has been pending for 6+ months
          //so I'm gonna do it by hand instead(since there's only 1 list), and will figure the PR out later.
          //Users.findOne().where({'id': user.id}).populate('beers').populate('list.beers').then(function(user){
          Users.findOne().where({'id': user.id}).populate('beers').then(function(user){
            Lists.findOne().where({'id': user.list}).populate('beers').then(function(list){

              userList = {
                drank: user.beers,
                unDrank: _.differenceBy(list.beers, user.beers, 'id')
              };
              
              return reply(userList);
            })
            .catch(function(err){
              return reply(Boom.notFound('No list found for user'));
            });
          })
          .catch(function(err){
            return reply(Boom.notFound('User not found'));
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
            }).unknown(),
        },
        auth: {
          strategy: 'api-user-jwt',
        },
      },
      handler: function(request, reply) {
        var Users = request.model.users;
        var user = request.auth.credentials.user;
        var Lists = request.model.lists;
        var Taps = request.model.taps;

        if (user){
          Users.findOne().where({'id': user.id}).populate('beers').then(function(user){
            Lists.findOne().where({'id': user.list}).populate('beers').then(function(list){

              var begin = Moment(Moment().format("YYYY-MM-DD")).toISOString();
              var end = Moment(Moment().format("YYYY-MM-DD")).add(1, 'days').toISOString();

              Taps.findOne({createdAt: {'>=': begin, '<': end}}).populate('beers').then(function(tapList){
                custom = {};
                //lodash to the rescue!
                onTapOnList = _.intersectionBy(tapList.beers, list.beers, 'id');
                custom.onTapDrank = _.intersectionBy(onTapOnList, user.beers, 'id');
                custom.onTapUndrank = _.differenceBy(onTapOnList, custom.onTapDrank, 'id');
                custom.theRest = _.differenceBy(tapList.beers, custom.onTapDrank, custom.onTapUndrank, 'id');
                return reply(custom);

              })
              .catch(function(err){
                console.log(err);
                return reply(Boom.badRequest('There was a problem processing the lists'));
              });
            })
            .catch(function(err){
              console.log(err);
              return reply(Boom.notFound('User list not found'));
            });
          }).catch(function(err){
            Boom.notFound('User not found')
          });
        } else {
          reply(Boom.notFound('User not found'));
        }
      }
    },
  ];
}
