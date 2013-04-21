var vows = require('vows');
var assert = require('assert');
var util = require('util');
var XingStrategy = require('passport-xing/strategy');


vows.describe('XingStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new XingStrategy({
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      function() {});
    },
    
    'should be named xing': function (strategy) {
      assert.equal(strategy.name, 'xing');
    },
  },
  
  'strategy when loading user profile': {
    topic: function() {
      var strategy = new XingStrategy({
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth.get = function(url, token, tokenSecret, callback) {
        if (url == 'https://api.xing.com/v1/users/me.json?fields=id,first_name,last_name') {
          var body = '{ "users": [ { "first_name": "Jared", "id": "_XX0XXX00X", "last_name": "Hanson" } ]}';
          callback(null, body, undefined);
        } else {
          callback(new Error('Incorrect user profile URL'));
        }
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'xing');
        assert.equal(profile.id, '_XX0XXX00X');
        assert.equal(profile.displayName, 'Jared Hanson');
        assert.equal(profile.name.familyName, 'Hanson');
        assert.equal(profile.name.givenName, 'Jared');
        assert.isUndefined(profile.emails);
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile with email address': {
    topic: function() {
      var strategy = new XingStrategy({
        consumerKey: 'ABC123',
        consumerSecret: 'secret',
        profileFields: ['id', 'name', 'emails']
      },
      function() {});
      
      // mock
      strategy._oauth.get = function(url, token, tokenSecret, callback) {
        if (url == 'https://api.xing.com/v1/users/me.json?fields=id,first_name,last_name,active_email') {
          var body = '{ "users" : [ { "id": "_XX0XXX00X", "active_email": "jaredhanson@example.com", "first_name": "Jared", "last_name": "Hanson" } ]}';
          callback(null, body, undefined);
        } else {
          callback(new Error('Incorrect user profile URL'));
        }
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'xing');
        assert.equal(profile.id, '_XX0XXX00X');
        assert.equal(profile.displayName, 'Jared Hanson');
        assert.equal(profile.name.familyName, 'Hanson');
        assert.equal(profile.name.givenName, 'Jared');
        assert.equal(profile.emails[0].value, 'jaredhanson@example.com');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile with unmapped Xing profile fields': {
    topic: function() {
      var strategy = new XingStrategy({
        consumerKey: 'ABC123',
        consumerSecret: 'secret',
        profileFields: ['id', 'first_name', 'last_name', 'wants', 'organisation_member', 'private_address', 'business_address.email']
      },
      function() {});
      
      // mock
      strategy._oauth.get = function(url, token, tokenSecret, callback) {
        if (url == 'https://api.xing.com/v1/users/me.json?fields=id,first_name,last_name,wants,organisation_member,private_address,business_address.email') {
          var body = '{ "users": [ { "wants": "A job", "id": "_XX0XXX00X", "organisation_member": "ACME", "first_name": "Jared", "last_name": "Hanson", "business_address": { "email": "jaredhanson@example.biz" }, "private_address": { "email": "jaredhanson@example.name" } } ]}';
          callback(null, body, undefined);
        } else {
          callback(new Error('Incorrect user profile URL: ' + url));
        }
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'xing');
        assert.equal(profile.id, '_XX0XXX00X');
        assert.equal(profile.displayName, 'Jared Hanson');
        assert.equal(profile.name.familyName, 'Hanson');
        assert.equal(profile.name.givenName, 'Jared');
        assert.equal(profile.emails[0].value, 'jaredhanson@example.name');
        assert.equal(profile.emails[1].value, 'jaredhanson@example.biz');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new XingStrategy({
        consumerKey: 'ABC123',
        consumerSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth.get = function(url, token, tokenSecret, callback) {
        callback(new Error('something went wrong'));
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('token', 'token-secret', {}, done);
        });
      },
      
      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },
  
  'strategy handling a request that has been denied': {
    topic: function() {
      var strategy = new XingStrategy({
          consumerKey: 'ABC123',
          consumerSecret: 'secret'
        },
        function() {}
      );
      return strategy;
    },
    
    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};
        strategy.success = function(user) {
          self.callback(new Error('should not be called'));
        }
        strategy.fail = function() {
          self.callback(null, req);
        }
        
        req.query = {};
        req.query.oauth_problem = 'user_refused';
        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },
      
      'should not call success' : function(err, req) {
        assert.isNull(err);
      },
      'should call fail' : function(err, req) {
        assert.isNotNull(req);
      },
    },
  },

}).export(module);
