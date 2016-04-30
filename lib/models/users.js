module.exports = {
    identity: 'users',
    connection: 'mysql',
    
    attributes: { 
        username: {
            type: 'string',
            unique: true,
            required: true
        },
        email: {
            type: 'string',
            unique: true,
            required: true
        },
        firstName: {
            type: 'string',
            required: true
        },
        lastName: {
            type: 'string',
            required: true
        },
        /*beers: {
            collection: 'beers',
            via: 'user'
        },
        
        token: {//random example
            collection: 'tokens',
            via: 'user',
        },
        */
        
    }
};
