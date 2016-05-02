

const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Config = require('../../config');

const internals = {};

module.exports = function(server, options) {
    
    return [
        
        // - List CRUD -
        {
            method: 'GET',
            path: '/list/{name}',
            config: {
                description: 'Temp endpoint, add a List',
                tags: ['api'],
                validate: {
                    params: {
                        name: Joi.any()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {
    
                var Model = request.model;
                
                var name = request.params.name;
                var lists = Model.lists;
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
    
                var Model = request.model;
                var id = request.params.id;
                var lists = Model.lists;
                
                lists.findOne(id, function(error, list){
                    if (error){
                        return reply (error);
                    }
                    list.beers.add(2);
                    list.save(function(err){
                        if (err) {
                            return reply(err);
                        }
                        return reply(list.beers);
                    });
                    /*Model.beers.find(function(error, beers){
                        if (error){
                            return reply (error);
                        }
                        
                        _.forEach(beers,function(beer){
                            //console.log('adding beer id '+beer.id);
                            list.beers.add(beer.id);
                            list.save(function(err){
                                if (err) {
                                    return reply(err);
                                }
                                console.log(list.beers);
                            })
                        });
                    });*/
                    /*list.save(function(err){
                        if (err) {
                            return reply(err);
                        }
                        return reply(list.beers);
                    })*/
                });
                //return reply('fine?');
            },
        },
        {
            method: 'GET',
            path: '/list/beers/{listId}',
            config: {
                description: 'Get all beers from a list',
                tags: ['api'],
                validate: {
                    params: {
                        listId: Joi.any()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {
    
                var Model = request.model;
                var listId = request.params.listId;
                var lists = Model.lists;
                
                lists.findOne(listId, function(error, list){
                    if (error){
                        return reply (error);
                    }
                    console.log(list.beers);
                    return reply(list.beers);
                });
            },
        },
    ];
};