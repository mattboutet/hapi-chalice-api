module.exports = {
    identity: 'lists',
    connection: 'mysql',
    
    attributes: {
        name: {
            type: 'string',
            required: true
        },
        beerId: {
            type: 'array',
            required: true
        },
    }
};
