var TadoApi = require('../node-tado-api').TadoApi;
var PropertiesReader = require('properties-reader');
var assert = require('assert');
var q = require('q');

var properties = PropertiesReader(__dirname + '/test.properties');

var u = properties.get("username");
var p = properties.get("password");

var tado = new TadoApi(u, p);

describe('TadoApis', function() {

    before(function (done) {
        tado.login().then(function (data){
            if (data && data.access_token){
                done();
            }else{
                done(new Error("no valid token returned"));
            }
        }).fail( function(error){
            done(error);
        });
    });

    describe('#getMyDetails()', function() {
        it('should return details of my account', function(done) {
            tado.getMyDetails().then(function (data){
                if (data && data.homes[0]){
                    done();
                }else{
                    done(new Error("no valid details returned"));
                }
            }).fail( function(error){
                done(error);
            });
        });
    });

    describe('#getDevices()', function() {
        it('should return all devices of a home', function(done) {
            tado.getMyDetails().then(function (details) {

                assert(details, 'details undefined.');
                assert(details.homes, 'homes undefined.');

                tado.getDevices(details.homes[0].id).then(function (devices){

                    assert(devices, 'devices undefined.');
                    assert(devices.length > 0, 'no device defined.');
                    console.log(devices);
                    done();

                }).fail( function(error){
                    done(error);
                });

            }).fail( function(error){
                done(error);
            });
        });
    });

    describe('#getZones()', function() {
        it('should return all zones of a home', function(done) {
            tado.getMyDetails().then(function (details) {

                assert(details, 'details undefined.');
                assert(details.homes, 'homes undefined.');

                tado.getZones(details.homes[0].id).then(function (zones){

                    assert(zones, 'zones undefined.');
                    assert(zones.length > 0, 'no zone defined.');
                    console.log(zones);
                    done();

                }).fail( function(error){
                    done(error);
                });

            }).fail( function(error){
                done(error);
            });
        });
    });

    describe('#getState()', function() {
        it('should return the details for a certain zone in a home', function(done) {
            tado.getMyDetails().then(function (details) {

                assert(details, 'details undefined.');
                assert(details.homes, 'homes undefined.');

                tado.getZones(details.homes[0].id).then(function (zones){

                    assert(zones, 'zones undefined.');
                    assert(zones.length > 0, 'no zone defined.');

                    tado.getState(details.homes[0].id, zones[0].id).then(function (state){

                        assert(state, 'state undefined.');
                        console.log(state);
                        done();

                    }).fail( function(error){
                        done(new Error(error[0].title, error[0].code));
                    });

                }).fail( function(error){
                    done(new Error(error[0].title, error[0].code));
                });

            }).fail( function(error){
                done(new Error(error[0].title, error[0].code));
            });
        });
    });

    describe('#testOverlay()', function() {
        it('should set an overlay on a certain zone in a home and delete it again', function(done) {

            this.timeout(5000);

            tado.getMyDetails().then(function (details) {

                assert(details, 'details undefined.');
                assert(details.homes, 'homes undefined.');

                tado.getZones(details.homes[0].id).then(function (zones){

                    assert(zones, 'zones undefined.');
                    assert(zones.length > 0, 'no zone defined.');

                    var celsius = 24;

                    var body = {
                        type: 'MANUAL',
                        setting: {
                          type: 'HEATING',
                          power: 'ON',
                          temperature: {
                              celsius: celsius
                          }
                        },
                        termination: {
                            type: 'MANUAL'
                        }
                    }

                    tado.setOverlay(details.homes[0].id, zones[0].id, body).then(function (updatedOverlay) {

                        assert(updatedOverlay, 'updatedOverlay undefined.');
                        assert(updatedOverlay.setting.temperature.celsius === 24, 'wrong temperature setting.')

                        tado.getOverlay(details.homes[0].id, zones[0].id).then(function (loadedOverlay) {

                            assert(loadedOverlay, 'loadedOverlay undefined.');
                            assert(loadedOverlay.setting.temperature.celsius === 24, 'wrong temperature setting.')

                            setTimeout(function (){

                                tado.deleteOverlay(details.homes[0].id, zones[0].id).then(function () {

                                    tado.getOverlay(details.homes[0].id, zones[0].id).then(function (overlay) {

                                    }).fail( function(error){
                                        assert(error[0].code === 'notFound');
                                        done();
                                    });

                                }).fail( function(error){
                                    done(new Error(error[0].title, error[0].code));
                                });

                            }, 2000);

                        }).fail( function(error){
                            done(new Error(error[0].title, error[0].code));
                        });

                    }).fail( function(error){
                        done(new Error(error[0].title, error[0].code));
                    });

                }).fail( function(error){
                    done(new Error(error[0].title, error[0].code));
                });

            }).fail( function(error){
                done(new Error(error[0].title, error[0].code));
            });
        });
    });
});

