

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
                        name: Joi.string()
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
        /*{//comment this out now that the main 2012 list is in there.
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
                    if (list) {

                        Model.beers.find(function(error, beers){
                            if (error){
                                return reply (error);
                            }
                            
                            _.forEach(beers,function(beer){
                                //these will be queued and all caught by save() below
                                list.beers.add(beer.id);
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
            handler: function(request, reply) {
    
                var Model = request.model;
                var listId = request.params.listId;
                var lists = Model.lists;
                
                lists.findOne(listId).populate('beers').then(function(list){
                    return reply(list.beers);
                })
                .catch(function(error){
                    return reply(Boom.wrap(error));
                });
            },
        },
        {//this probably makes more sense in users.js, move this functionality there once associations are crystallized
            method: 'GET',
            path: '/list/{listId}/on/{beerName}',
            config: {
                description: 'See if a beer is on a given list',
                tags: ['api'],
                validate: {
                    params: {
                        listId: Joi.number().required(),
                        beerName: Joi.number().required()
                    }
                },
                auth: false
            },
            handler: function(request, reply) {
    
                var Model = request.model;
                var listId = request.params.listId;
                var beerName = request.params.beerName
                
                lists.findOne(listId).populate('beers').then(function(list){
                    //see if there's a perfect match, if not, see if there's one with 
                    //levenshtein less than n (3?).
                })
                .catch(function(error){
                    return reply(Boom.wrap(error));
                });
            },
        },
    ];
};
//this too, shouldn't be in list.
internals.levenshtein = function (compare, correct){
    if(compare.length == 0) return correct.length; 
    if(correct.length == 0) return compare.length; 
    
    var matrix = [];
    
    // increment along the first column of each row
    var i;
    for(i = 0; i <= correct.length; i++){
        matrix[i] = [i];
    }
    
    // increment each column in the first row
    var j;
    for(j = 0; j <= compare.length; j++){
        matrix[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for(i = 1; i <= correct.length; i++){
        for(j = 1; j <= compare.length; j++){
            if(correct.charAt(i-1) == compare.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                Math.min(matrix[i][j-1] + 1, // insertion
                matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    
    return matrix[correct.length][compare.length];
};