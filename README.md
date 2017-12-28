## Node TADO API

An API library for Node.js that interacts with Tado's Smart Thermostat system.

The API is not complete yet and at the moment mainly used for personal
purposes only. I will continue completing the API and also adding more
documentation and examples.

# Example based on test.js

```
var TadoApi = require('../node-tado-api').TadoApi;

var tado = new TadoApi(u, p);
tado.login().then(function (data){
    tado.getMyDetails().then(function (myDetails){

    });
});

```
