module.exports = function(grunt) {

  grunt.initConfig({
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    jshint: {
      files: ['src/color-thief.js']
    },
  	jscs: {
      src: [
        'src/color-thief.js'
      ],
      options: {
        config: ".jscsrc"
      }
    },
    uglify: {
      options: {
        preserveComments: 'some',
        sourceMap: false
      },
      dist: {
        files: {
          'dist/color-thief.min.js': ['src/color-thief.js']
        }
      }
    },
    watch: {
      test: {
        files: ['src/color-thief.js'],
        tasks: ['jshint', 'jscs']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('default', ['connect', 'watch']);
  grunt.registerTask('test', ['jshint', 'jscs']);
  grunt.registerTask('build', ['uglify']);
};
