var Uuid = require('node-uuid');

module.exports = function (waterline) {

    return {
        identity: 'tokens',
        connection: 'mysql',        
        autoPK: false,
        attributes: { 
            id: {
                type: 'string',
                uuidv4: true,
                primaryKey: true,
                required: true,
                defaultsTo: function() {
                    return Uuid.v4({
                        rng: Uuid.nodeRNG
                    });
                }
            },
            user: {
                model: 'users'
            }
        },

    };
}
