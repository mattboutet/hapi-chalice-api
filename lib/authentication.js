const Wreck = require('wreck');
const Boom = require('boom');
const Bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const Config = require('../config');

const internals = {};

module.exports = function(server, options) {
    
    var Model = server.plugins['dogwater'];
    var Users = Model.users;

    server.auth.strategy('hapi-auth-basic', 'basic', true,
    {   
        
        /**
         * [validateFunc description]
         */
        validateFunc: function (email, password, request, reply) {
            Users.findOne().where({'email': email}).then(function(user){
        
                if (!user) {
                    return reply(null, false);
                }
                //arrow syntax still seems chintzy to me, but es6 and all...
                Bcrypt.compare(password, user.password, (err, isValid) => {
                    return reply(err, isValid, { id: user.id, email: user.email });
                });
            })
            .catch(function(error){
                return reply(Boom.wrap(error));
            });
        }
        verifyOptions: { algorithms: [ 'HS256' ] } // pick a strong algorithm
    });
}
