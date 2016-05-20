'use strict';

const Items = require('items');

const internals = {};
module.exports = (waterline) => {

    return {
        identity: 'beers',
        connection: 'mysql',

        attributes: {
            beerName: {
                type: 'string',
                unique: true,
                required: true
            },
            beerStyle: {
                type: 'string',
                required: true
            },
            lists: {
                collection: 'lists',
                via: 'beers'
            },
            taps: {
                collection: 'taps',
                via: 'beers'
            }
        },
        findCloseOrCreate: (beerName, reply) => {

            const Beers = waterline.collections.beers;
            Beers.findOne({ beerName: beerName }, (err, known) => {

                if (err){
                    return next(err);
                }
                if (known){
                    return reply(null, known);
                }

                Beers.find({ }, (error, beers) => {
                    //should '3' be moved out to Config?
                    if (error){
                        return reply(error);
                    }
                    let match = {};

                    Items.parallel(beers, (beer, next) => {

                        if (internals.levenshtein(beerName, beer.beerName) < 3){
                            match = beer;
                        }
                        next();
                    },
                    (err) => {

                        if (err) {
                            return reply(err);
                        } else if (match.beerName){
                            return reply(null,match);
                        }

                        Beers.create({ beerName: beerName, beerStyle: 'unknown' }, (err, newBeer) => {

                            if (err){
                                return reply(err);
                            }
                            return reply(null, newBeer);

                        });
                    });
                });
            });
        }
    };
};

internals.levenshtein = function (compare, correct) {

    if (compare.length === 0){
        return correct.length;
    }

    if (correct.length === 0){
        return compare.length;
    }

    const matrix = [];

    // increment along the first column of each row

    for (let i = 0; i <= correct.length; ++i){
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let i = 0; i <= compare.length; ++i){
        matrix[0][i] = i;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= correct.length; ++i){
        for (let j = 1; j <= compare.length; ++j){

            if (correct.charAt(i - 1) === compare.charAt(j - 1)){
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }
    //return the integer levenshtein distance
    return matrix[correct.length][compare.length];
};
