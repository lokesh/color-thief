module.exports = function(grunt) {

  grunt.initConfig({
    host_config: grunt.file.readJSON('.host_config'),
    compass: {
      dist: {
        options: {
          sassDir: 'examples/sass',
          cssDir: 'examples/css',
          environment: 'production'
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    'ftp-deploy': {
      build: {
        auth: {
          host: '<%- host_config.host %>',
          port: '<%- host_config.port %>'
        },
        src: '.',
        dest: '<%- host_config.directory %>',
        exclusions: [
          '**/.*',
          '.*',
          'bower_components',
          'node_modules'
        ]
      }
    },
    jshint: {
      files: ['src/color-thief.js']
    },
    uglify: {
      options: {
        preserveComments: 'some',
        sourceMap: false
      },
      dist: {
        files: {
          'dist/color-thief.min.js': ['dist/color-thief.js']
        }
      }
    },
    webpack: {
      build: {
        entry: "./src/ColorThief.js",
        output: {
          libraryTarget: "var",
          library: "ColorThief",
          path: __dirname + "/dist",
          filename: "color-thief.js"
        }
      }
    },
    watch: {
      sass: {
        files: ['examples/sass/*.sass'],
        tasks: ['compass'],
        options: {
          livereload: true,
          spawn: false
        },
      },
      test: {
        files: ['src/color-thief.js'],
        tasks: ['jshint']
      }
    },
    shell: {
      webpack: { command: 'webpack' },
      webpackWatch: { command: 'webpack --watch' }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ftp-deploy');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['compass', 'connect', 'shell:webpackWatch']);
  grunt.registerTask('build', ['compass', 'jshint', 'shell:webpack', 'uglify']);
};
