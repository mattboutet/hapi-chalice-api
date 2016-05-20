'use strict';

const Joi = require('joi');
const Boom = require('boom');

const internals = {};

module.exports = (server, options) => {

    return [

        // - List CRUD -
        /*{//comment this out now that the lists are in there. keep it for when new lists happen
            method: 'GET',
            path: '/list/{name}',
            config: {
                description: 'Temp endpoint, add a List',
                tags: ['api'],
                validate: {
                    params: {
                        name: Joi.string()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {

                const Model = request.model;

                const name = request.params.name;
                const lists = Model.lists;
                lists.create({name: name}, function(error, list){
                    if (error) {
                        return reply(error);
                    }
                    return reply(list);
                });
            },
        },
        {
            method: 'GET',
            path: '/list/assoc/{id}',
            config: {
                description: 'Temp endpoint, add a List',
                tags: ['api'],
                validate: {
                    params: {
                        id: Joi.any()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {

                const Model = request.model;
                const id = request.params.id;
                const lists = Model.lists;

                lists.findOne(id, function(error, list){
                    if (error){
                        return reply (error);
                    }
                    if (list) {

                        Model.beers.find(function(error, beers){
                            if (error){
                                return reply (error);
                            }
console.log(beers);
                            _.forEach(beers,function(beer){
                                //these will be queued and all caught by save() below
                                //nope is for the 2010 list, assuming 2012 beers haven't changed.
                                const nope = [25,28,30,107,108,136,170,180,183,193,215,222]
                                if (_.indexOf(nope,beer.id) < 0){
                                    console.log('adding '+beer.id);
                                    list.beers.add(beer.id);
                                }
                            });
                            list.save(function(err){
                                if (err) {
                                    return reply(err);
                                }
                                return reply('Saved');
                            });
                        });
                    } else {
                        return reply(Boom.badRequest('List not found'));
                    }
                });
            },
        },//*/
        {
            method: 'GET',
            path: '/list/beers/{listId}',
            config: {
                description: 'Get all beers from a list',
                tags: ['api'],
                validate: {
                    params: {
                        listId: Joi.number().required()
                    }
                },
                auth: false
            },
            handler: (request, reply) => {

                const Model = request.model;
                const listId = request.params.listId;
                const lists = Model.lists;

                lists.findOne(listId).populate('beers').then((list) => {

                    return reply(list.beers);
                })
                .catch((error) => {

                    return reply(Boom.wrap(error));
                });
            }
        }
    ];
};
