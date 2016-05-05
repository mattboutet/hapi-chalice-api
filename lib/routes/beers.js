

const Joi = require('joi');
const Boom = require('boom');
//const _ = require('lodash');
const Config = require('../../config');

const internals = {};

module.exports = function(server, options) {

    return [
        // - Beer CRUD -
        {
            method: 'GET',
            path: '/beers/{id}',
            config: {
                description: 'Get a beer',
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
            path: '/beers',
            config: {
                description: 'Get all beers',
                tags: ['api'],
                auth: false
            },
            handler: function(request, reply) {
                Beers = request.model.beers;
                Beers.find(function(error,beers){
                    if (error){
                        return reply(Boom.wrap(error));
                    }
                    return reply(beers);
                });
            }
        },
        {
            method: 'POST',
            path: '/beers',
            config: {
                description: 'Add a beer',
                tags: ['api'],
                auth: false
            },
            handler: {
                bedwetter: {}
            },
        },
    ];
};
