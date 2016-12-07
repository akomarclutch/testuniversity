'use strict';

const Composer = require('./index');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

Composer((err, server) => {

    if (err) {
        throw err;
    }

    const options = {
        info: {
            'title': 'Credo University Documentation',
            'version': '0.1'
        }
    };

    server.register(
        [
            Inert,
            Vision,
            {
                'register': HapiSwagger,
                options
            }
        ], (err) => {

        if (err) {
            throw err;
        }
        else {
            server.start((err) => {

                if (err) {
                    throw err;
                }
                else {
                    console.log('Server running at:', server.info.uri);
                }
            });
        }
    });
});
