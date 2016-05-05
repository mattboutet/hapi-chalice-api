module.exports = {
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
    findCloseOrCreate: function(values, reply){
        //try to find, if not, levenshtein w/distance of ~3 to see if they misspelled.
    }
};
