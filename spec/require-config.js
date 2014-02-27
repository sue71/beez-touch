(function(global) {
    var require = global.require;

    // Configure RequireJS
    require.config({
        "baseUrl": "../s",
        "urlArgs": "v="+(new Date()).getTime(),
        "paths": {
            "mocha": "../bower_components/mocha/mocha",
            "chai": "../bower_components/chai/chai",
            "backbone": "../bower_components/backbone/backbone",
            "underscore": "../bower_components/underscore/underscore",
            "zepto": "../bower_components/zepto/zepto",
            "handlebars": "../bower_components/handlebars/handlebars",
            "beez": "../bower_components/beez/release/beez",
            "index": "./beez-touch/index",
            "spec": '../spec'
        },
        "shim": {
            "backbone": {
                "deps": [
                    "underscore",
                    "zepto"
                ],
                "exports": "Backbone"
            },
            "zepto": {
                "exports": "$"
            },
            "underscore": {
                "exports": "_"
            },
            "handlebars": {
                "exports": "Handlebars"
            }
        },
        "config": {
        }
    });

    // Require libraries
    require(['require', 'chai', 'mocha'], function(require, chai, mocha){
        // Chai
        global.assert = chai.assert;
        //global.should = chai.should();
        global.expect = chai.expect;

        // Mocha
        global.mocha.setup({
            ui: 'bdd',
            timeout: 10*1000
        });
        var spec = global.spec;

        spec.rerun = function rerun() {
            if (!spec.TestCaseName) {
                return;
            }

            // Require base tests before starting
            require(['spec/' + spec.TestCaseName], function(suite){
                // Start runner
                global.mocha.suite.suites = []; // clear
                suite();
                var runner = global.mocha.run();
                runner.globals([
                        '_zid' // Backbone.history
                ]);
            });
        };

    });
})(this);
