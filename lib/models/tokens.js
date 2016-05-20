'use strict';

const Uuid = require('node-uuid');

module.exports = (waterline) => {

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
                defaultsTo: () => {

                    return Uuid.v4({
                        rng: Uuid.nodeRNG
                    });
                }
            },
            user: {
                model: 'users'
            }
        }
    };
};
