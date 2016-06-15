'use strict';

const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Wreck = require('wreck');
const Parser = require('htmlparser');
const Items = require('items');
const Moment = require('Moment');

const internals = {};

module.exports = (server, options) => {

    return [

        // - Taplist CRUD -
        {//using /beers here is a bedwetter that will cause a populate()
            method: 'GET',
            path: '/taps/{id}/beers',
            config: {
                description: 'Get specified taplist',
                tags: ['api'],
                validate: {
                    params: {
                        id: Joi.any()
                    }
                },
                auth: false
            },
            handler: {
                bedwetter: {}
            }
        },
        {
            method: 'GET',
            path: '/tap/todays',
            config: {
                description: 'Fetch new taplist from Novare',
                tags: ['api'],
                auth: false
            },
            handler: (request, reply) => {

                const uri = 'http://novareresbiercafe.com/draught.php';
                const Taps = request.model.taps;
                const Beers = request.model.beers;

                const begin = Moment(Moment().format('YYYY-MM-DD')).toISOString();
                const end = Moment(Moment().format('YYYY-MM-DD')).add(1, 'days').toISOString();

                Taps.findOne({ createdAt: { '>=': begin, '<': end } }).populate('beers')
                .then((todaysTaps) => {

                    if (todaysTaps) {
                        return reply(todaysTaps);
                    }

                    Taps.create({ date: { '>=': begin, '<': end } }, { }, (error, todaysTapList) => {

                        if (error){
                            return reply(Boom.wrap(error));
                        }
                        Wreck.get(uri, (err, res, payload) => {

                            if (err){
                                return reply(Boom.wrap(err));
                            }

                            const page = payload.toString();
                            //grab everything after the wordpress embed tag
                            const firstBit = page.split('<!-- Start WordPress embed code -->')[1];
                            //grab everything before the wordpress embed close tag.
                            //this works shockingly well.
                            const draughtList = firstBit.split('<!-- End WordPress embed code -->')[0];

                            const handler = new Parser.DefaultHandler((err, elements) => {

                                if (err) {
                                    return reply(Boom.wrap(err));
                                }
                                const span = _.find(elements, (element) => {

                                    if (element.attribs){
                                        return element.attribs.class === 'draughts_reg';
                                    }
                                    return false;
                                });
                                const draughts = _.filter(span.children, (child) => {

                                    return child.name === 'p';
                                });

                                Items.parallel(draughts, (draught, next) => {

                                    if (draught.children && draught.children[0].data && draught.children[0].data !== '&nbsp;'){
                                        const beer = internals.unescapeHTML(draught.children[0].data);

                                        /*There's quite a bit of constiability in how beer
                                         *names are presented.  It seems like a levenshtein
                                         *distance of 3 is just about right, so that's what I'm
                                         *going with here.  Might need adjustment in the future?
                                        **/
                                        Beers.findCloseOrCreate(beer,(err, beerToAdd) => {

                                            if (err){
                                                next(err);
                                            } else {
                                                todaysTapList.beers.add(beerToAdd.id);
                                                next();
                                            }
                                        });
                                    } else {
                                        next();
                                    }
                                },
                                (err) => {

                                    if (err){
                                        return reply(Boom.wrap(err));
                                    }
                                    todaysTapList.save((err) => {//save() populates associations

                                        if (err) {
                                            return reply(err);
                                        }
                                        return reply(todaysTapList);
                                    });
                                });
                            },{ verbose: false, ignoreWhitespace: true });
                            const parser = new Parser.Parser(handler);
                            parser.parseComplete(draughtList);
                        });
                    });
                })
                .catch((err) => {

                    return reply(Boom.wrap(err));
                });
            }
        }
    ];
};

//somebody else has definitely done this, and it's probably in a library I've already `require`d
internals.unescapeHTML = function unescapeHTML(str) {

    return str.replace(/\&([^;]+);/g, (entity, entityCode) => {

        let match;
        const htmlEntities = {
            nbsp: ' ',
            cent: '¢',
            pound: '£',
            yen: '¥',
            euro: '€',
            copy: '©',
            reg: '®',
            lt: '<',
            gt: '>',
            quot: '"',
            amp: '&',
            apos: '\''
        };
        //yes, that's supposed to be = and not ==
        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        }
        return entity;

    });
};
