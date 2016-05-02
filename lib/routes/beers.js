

const Joi = require('joi');
const Boom = require('boom');
//const _ = require('lodash');
const Config = require('../../config');

const internals = {};

module.exports = function(server, options) {
    
    return [
        
        // - User CRUD -
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
    ];
};