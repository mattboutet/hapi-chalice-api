module.exports = {
    identity: 'checked_beers',
    connection: 'mysql',

    attributes: {
        checked: {//if I'm only creating when one's checked, then this is redundant
            type: 'boolean'
        },
        user: {
            columnName: 'user',
            type: 'integer',
            foreignKey: true,
            references: 'users',
            on: 'id',
            onKey: 'id',
            via: 'user'
        },
        beer: {
            columnName: 'beer',
            type: 'integer',
            foreignKey: true,
            references: 'beers',
            on: 'id',
            onKey: 'id',
            via: 'beer'
        }
    }
};
