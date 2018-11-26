module.exports = function(grunt) {

    // 1. All configuration goes here 
    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),

	// Project configuration.
	uglify: {
            main: {
                files: [
                    {src: 'js/msging-main.js', dest: 'js/msging-main.min.js'},
                ],
            },
            display: {
                files: [
                    {src: 'js/msging-dsply-msg.js', dest: 'js/msging-dsply-msg.min.js'},
                ],
            },
            history: {
                files: [
                    {src: 'js/crrspndnc-hstry-stndaln.js', dest: 'js/crrspndnc-hstry-stndaln.min.js'},
                ],
            },
	},

	watch: {
            main: {
                files: ['js/msging-main.js'],
                tasks: ['uglify:main'],
                options: {
                    spawn: false,
                },
            },
            display: {
                files: ['js/msging-dsply-msg.js'],
                tasks: ['uglify:display'],
                options: {
                    spawn: false,
                },
            },
            history: {
                files: ['js/crrspndnc-hstry-stndaln.js'],
                tasks: ['uglify:history'],
                options: {
                    spawn: false,
                },
            },
	},

	jsbeautifier : {
	    files : ['js/msging-main.js', 
		     'js/msging-dsply-msg',
		     'js/crrspndnc-hstry-stndaln.js'],
	},

	jshint: { 
	    // lint your project's server code
	    all: [ 'js/msging-main.js', 
		     'js/msging-dsply-msg',
		     'js/crrspndnc-hstry-stndaln.js'],
	}
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['uglify']);

};

