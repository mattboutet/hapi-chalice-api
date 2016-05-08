

const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
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
            /*didn't use a bedwetter handler here because the react polling
             *functionality I'm using sends a ?_=timestamp with the request,
             *and that breaks bedwetter's default handler
             */
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
            /*didn't use a bedwetter handler here because I'm fudging the id
             *on creation in the react appso that I can append the new item to
             *the list immediately without waiting for a response from the API.
             *Bedwetter was using that fake ID, which was causing problems.
             */
            handler: function(request, reply) {
                Beers = request.model.beers;
                //Items.parallel might be better here?
                _.forEach(request.payload, function(newBeer){

                    beerName = newBeer.beerName;
                    beerStyle = newBeer.beerStyle;

                    Beers.create({beerName: beerName, beerStyle: beerStyle},function(error,beer){
                        if (error){
                            return reply(Boom.wrap(error));
                        }
                    });
                });
                return reply('done');
            }
        },
    ];
};
