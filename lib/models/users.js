module.exports = {
    identity: 'users',
    connection: 'mysql',

    attributes: {
        email: {
            type: 'string',
            unique: true,
            required: true
        },
        password: {
            type: 'string'
        },
        firstName: {
            type: 'string',
            required: true
        },
        lastName: {
            type: 'string',
            required: true
        },
        list: {
            model: 'lists'
        },
        beers: {
            collection: 'beers',
            through: 'checked_beers'
            //via: 'user'
        },
    }
};
