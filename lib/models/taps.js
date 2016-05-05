module.exports = {
    identity: 'taps',
    connection: 'mysql',

    attributes: {
        beers: {
            collection: 'beers',
            via: 'lists',
            dominant: true
        }
    }
};
