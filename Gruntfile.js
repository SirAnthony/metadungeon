
module.exports = function(grunt){
    grunt.initConfig({
        bower: {install: {options: {targetDir: './build/'}}},
        jshint: {all: ['Gruntfile.js', 'lib/dungeon.js', 'lib/generator.js',
            'lib/room.js', 'lib/util/random.js', 'viewer/painter.js', 
            'viewer/viewer.js']},
    });
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['bower', 'jshint']);
};
