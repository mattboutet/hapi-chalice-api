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
        }//*/
    }
};