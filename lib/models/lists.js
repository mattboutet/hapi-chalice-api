module.exports = {
    identity: 'lists',
    connection: 'mysql',
    
    attributes: {
        name: {
            type: 'string',
            unique: true,
            required: true
        },
        beers: {
            collection: 'beers',
            via: 'lists',
            dominant: true
        }//*/
    }
};
