"use strict";

var request = require('request');
var EventSource = require('EventSource'); // TODO
var q = require('q');

var dateFormat = require('dateformat');

var debug = require('debug')('node-tado-api')

var uuid = require('node-uuid');
var replace = require('simple-replace');

var eventStream;

var CLIENT_ID = 'tado-web-app';
var CLIENT_SECRET = 'wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc';

function TadoApi(config) {
    this._config = config;
    this._config.TADO_BASE_URL = 'https://my.tado.com/api/v2';
    this._config.TADO_AUTH_URL = 'https://auth.tado.com/';
    this._config.LOGIN_URL = this._config.TADO_AUTH_URL + 'oauth/token';

    this._config.ME_ENDPOINT = this._config.TADO_BASE_URL + '/me';

    this._config.HOMES_ENDPOINT = this._config.TADO_BASE_URL + '/homes';
    this._config.HOMES_DEVICES_ENDPOINT = this._config.HOMES_ENDPOINT + '/${homeId}/devices'
    this._config.HOME_ZONES_ENDPOINT = this._config.HOMES_ENDPOINT + '/${homeId}/zones';
    this._config.HOME_ZONES_STATE_ENDPOINT = this._config.HOMES_ENDPOINT + '/${homeId}/zones/${zone}/state';
    this._config.HOME_ZONES_OVERLAY_ENDPOINT = this._config.HOMES_ENDPOINT + '/${homeId}/zones/${zone}/overlay';

    this._config.WEATHER_ENDPOINT = this._config.TADO_BASE_URL + '/weather';

}

module.exports = function (username, password) {
    var config = {
        "username" : username,
        "password" : password 
    };

    return new TadoApi(config);
};

TadoApi.prototype.login = function () {
    return this._login();    
};

TadoApi.prototype.getMyDetails = function () {
    return this._getMyDetails();
};

TadoApi.prototype.getDevices = function (homeId) {
    return this._getDevices(homeId);
};

TadoApi.prototype.getZones = function (homeId) {
    return this._getZones(homeId);
};

TadoApi.prototype.getState = function (homeId, zone) {
    return this._getState(homeId, zone);
};

TadoApi.prototype.getOverlay = function (homeId, zone) {
    return this._getOverlay(homeId, zone);
};

/**
 * Body:
 * {
 *      type: "MANUAL",
 *      setting: {
 *          type: "HEATING",
 *          power: "ON",
 *          temperature: {
 *              celsius: 23,
 *              fahrenheit: 73.4
 *          }
 *      },
 *      termination: {
 *          type: "MANUAL",
 *          projectedExpiry: null
 *      }
 * }
 *
 * @param homeId
 * @param zone
 * @param body
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype.setOverlay = function (homeId, zone, body) {
    return this._setOverlay(homeId, zone, body);
};

TadoApi.prototype.deleteOverlay = function (homeId, zone) {
    return this._deleteOverlay(homeId, zone);
};

TadoApi.prototype._login = function () {

    var deferred = q.defer();

    var options = {
        url: this._config.LOGIN_URL,
        form: {
            client_id : CLIENT_ID,
            client_secret : CLIENT_SECRET,
            grant_type : 'password',
            scope : 'home.user',
            username : this._config.username,
            password : this._config.password
        },
        headers: {
            'Referer' : 'https://my.tado.com/',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };


    request.post(options, function (err, resp, body) {
        if (!err){
            this._config.session = JSON.parse(body);
            deferred.resolve(this._config.session);
        }else{
            var error = new Error();
            error.message = data.error.description;
            deferred.reject(error);
        }
    }.bind(this));

    return deferred.promise;
};

/**
 * URL: https://my.tado.com/api/v2/me
 *
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._getMyDetails = function () {

    var deferred = q.defer();

    this._get(this._config.ME_ENDPOINT).then(function (data) {
        deferred.resolve(data);
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/devices
 *
 * @param homeId
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._getDevices = function (homeId) {

    var deferred = q.defer();

    this._get(this._config.HOMES_ENDPOINT + '/' + homeId + '/devices').then(function (data) {
        deferred.resolve(data);
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/zones
 *
 * @param homeId
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._getZones = function (homeId) {

    var deferred = q.defer();

    this._get(replace(this._config.HOME_ZONES_ENDPOINT, {homeId: homeId})).then(function (data) {
        deferred.resolve(data);
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/zones/${zone}/state
 *
 * @param homeId
 * @param zone
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._getState = function (homeId, zone) {

    var deferred = q.defer();

    this._get(replace(this._config.HOME_ZONES_STATE_ENDPOINT, {homeId: homeId, zone: zone})).then(function (data) {
        if (data.errors) {
            deferred.reject(data.errors);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/zones/${zone}/overlay
 *
 * @param homeId
 * @param zone
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._getOverlay = function (homeId, zone) {

    var deferred = q.defer();

    this._get(replace(this._config.HOME_ZONES_OVERLAY_ENDPOINT, {homeId: homeId, zone: zone})).then(function (data) {
        if (data.errors) {
            deferred.reject(data.errors);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/zones/${zone}/overlay
 *
 * @param homeId
 * @param zone
 * @param body
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._setOverlay = function (homeId, zone, body) {

    var deferred = q.defer();

    this._put(replace(this._config.HOME_ZONES_OVERLAY_ENDPOINT, {homeId: homeId, zone: zone}), body).then(function (data) {
        if (data.errors) {
            deferred.reject(data.errors);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * URL: https://my.tado.com/api/v2/homes/${homeId}/zones/${zone}/overlay
 *
 * @param homeId
 * @param zone
 * @returns {*|promise}
 * @private
 */
TadoApi.prototype._deleteOverlay = function (homeId, zone) {

    var deferred = q.defer();

    this._delete(replace(this._config.HOME_ZONES_OVERLAY_ENDPOINT, {homeId: homeId, zone: zone})).then(function (data) {
        if (data && data.errors) {
            deferred.reject(data.errors);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

TadoApi.prototype._get = function (url) {

    var deferred = q.defer();

    var options = {
        url: url,
        json: true,
        headers: {
            referer : 'https://my.tado.com/',
        },
        auth: {
            bearer: this._config.session.access_token
        }
    };

    request.get(options, function (err, resp, body) {
        if (!err){
            deferred.resolve(body);
        }else{
            var error = new Error();
            error.message = data.error.description;
            deferred.reject(error);
        }
    });

    return deferred.promise;
}

TadoApi.prototype._put = function (url, body) {

    var deferred = q.defer();

    var options = {
        url: url,
        body: body,
        json: true,
        headers: {
            referer : 'https://my.tado.com/',
        },
        auth: {
            bearer: this._config.session.access_token
        }
    };

    request.put(options, function (err, resp, body) {
        if (!err){
            deferred.resolve(body);
        }else{
            var error = new Error();
            error.message = data.error.description;
            deferred.reject(error);
        }
    });

    return deferred.promise;
}

TadoApi.prototype._delete = function (url) {

    var deferred = q.defer();

    var options = {
        url: url,
        json: true,
        headers: {
            referer : 'https://my.tado.com/',
        },
        auth: {
            bearer: this._config.session.access_token
        }
    };

    request.delete(options, function (err, resp, body) {
        if (!err){
            deferred.resolve(body);
        }else{
            var error = new Error();
            error.message = data.error.description;
            deferred.reject(error);
        }
    });

    return deferred.promise;
}

