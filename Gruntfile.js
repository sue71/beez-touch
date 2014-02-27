(function () {

    var beez = {
        projectname: 'beez-touch'
    };

    module.exports = function (grunt) {

        // enviroment
        beez.projectdir = grunt.file.findup(beez.projectname);
        grunt.log.ok('[environment] project name:', beez.projectname);
        grunt.log.ok('[environment] project directory:', beez.projectdir);

        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            clean: {
                src: ['dist', 'release', 'docs']
            },
            jshint: {
                src: ['s'],
                options: {
                    jshintrc: '.jshintrc',
                    jshintignore: ".jshintignore"
                }
            },
            copy: {
                raw: {
                    files: [
                        {
                            src: ['dist/' + beez.projectname + '/index.js'],
                            dest: 'release/beez.touch.js'
                        }
                    ]
                },
                min: {
                    files: [
                        {
                            src: ['dist/' + beez.projectname + '/index.js'],
                            dest: 'release/beez.touch.min.js'
                        }
                    ]
                }
            },
            exec: {
                setver: {
                    command: './setver',
                    stdout: true,
                    stderr: true
                },
                beez_rjs: {
                    command: function (optimize) {
                        return './node_modules/requirejs/bin/r.js -o build.js optimize=' + optimize;
                    },
                    stdout: true,
                    stderr: true
                }
            }
        });

        // These plugins provide necessary tasks.
        require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

        // pre
        grunt.registerTask('pre', [
            'exec:setver'
        ]);

        /**
         * task: rawbuild
         */
        grunt.registerTask('rawbuild', [
            'pre',
            'jshint',
            'exec:beez_rjs:none',
            'copy:raw'
        ]);

        /**
         * task: minbuild
         */
        grunt.registerTask('minbuild', [
            'pre',
            'jshint',
            'exec:beez_rjs:uglify2',
            'copy:min'
        ]);

        // task: defulat
        grunt.registerTask('default', [
            'clean',
            'rawbuild',
            'minbuild'
        ]);

    };
})(this);
