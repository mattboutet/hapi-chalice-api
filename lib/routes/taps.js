const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Wreck = require('wreck');
const Parser = require('htmlparser');
const Items = require('items');
const Moment = require('Moment');
const Config = require('../../config');

const internals = {};

module.exports = function(server, options) {

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
      },
    },
    {
      method: 'GET',
      path: '/tap/todays',
      config: {
        description: 'Fetch new taplist from Novare',
        tags: ['api'],

        auth: false
      },
      handler: function(request, reply) {
        var uri = 'http://novareresbiercafe.com/draught.php'
        var Taps = request.model.taps;
        var Beers = request.model.beers;

        var begin = Moment(Moment().format("YYYY-MM-DD")).toISOString();
        var end = Moment(Moment().format("YYYY-MM-DD")).add(1, 'days').toISOString();

        Taps.findOne({createdAt: {'>=': begin, '<': end}}).populate('beers')
        .then(function(todaysTaps){
          if (todaysTaps) {
            return reply(todaysTaps);
          } else {

            Taps.create({date: {'>=': begin, '<': end}}, {}, function(error, todaysTaps){
              if (error){
                return reply(Boom.badRequest('Unable to fetch the tap list'));
              }
              Wreck.get(uri, function (err, res, payload) {
                if (err){
                  return reply(Boom.badRequest('Unable to fetch the tap list'));
                }

                var page = payload.toString();
                //grab everything after the wordpress embed tag
                var firstBit = page.split("<!-- Start WordPress embed code -->")[1];
                //grab everything before the wordpress embed close tag.
                //this works shockingly well.
                var draughtList = firstBit.split('<!-- End WordPress embed code -->')[0];

                var handler = new Parser.DefaultHandler(function (error, elements) {
                	if (error) {
                		return reply(Boom.badRequest('Unable to fetch the tap list'));
                  }
                  var span = _.find(elements, function(element){
                    if (element.attribs){
                      return element.attribs.class == 'draughts_reg';
                    } else {
                      return false;
                    }
                  });
                  var draughts = _.filter(span.children, function(child){
                    return child.name == 'p';
                  });

                  Items.parallel(draughts, function(draught, next){

                    if (draught.children && draught.children[0].data && draught.children[0].data !== "&nbsp;"){
                      var beer = internals.unescapeHTML(draught.children[0].data);

                      /*There's quite a bit of variability in how beer
                       *names are presented.  It seems like a levenshtein
                       *distance of 3 is just about right, so that's what I'm
                       *going with here.  Might need adjustment in the future?
                       **/
                      Beers.findCloseOrCreate(beer,function(err, beerToAdd){
                        if (err){
                          next(err);
                        } else {
                          todaysTaps.beers.add(beerToAdd.id);
                          next();
                        }
                      });
                    } else {
                      next();
                    }
                  }, function(err){
                    if (err){
                      return reply(Boom.badRequest('Unable to fetch the tap list'));
                    }
                    todaysTaps.save(function(err){//save() populates associations
                      if (err) {
                        return reply(err);
                      }
                      return reply(todaysTaps);
                    });

                  });

                },{ verbose: false, ignoreWhitespace: true });
                var parser = new Parser.Parser(handler);
                parser.parseComplete(draughtList);
              });
            });
          }
        })
        .catch(function(err){
          return reply(Boom.notFound('Unable to fetch taplist'));
        });
      },
    }
  ];
};

//somebody else has definitely done this, and it's probably in a library I've already `require`d
internals.unescapeHTML = function unescapeHTML(str) {
  return str.replace(/\&([^;]+);/g, function(entity, entityCode) {
  var match;
  var htmlEntities = {
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
  } else {
    return entity;
  }
  });
};
