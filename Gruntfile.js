module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      development: {
        src: 'src/**/*.less',
        dest: 'dist/main.css',
        options: {
          dumpLineNumbers: 'comments'
        }
      },
      production: {
        src: 'src/**/*.less',
        dest: 'dist/main.css',
        options: {
          yuicompress: true
        }
      }
    },
    develop: {
      server: {
        file: 'app.js'
      }
    },
    watch: {
      less: {
        files: ['src/**/*.less'],
        tasks: ['less:development'],
        options: { nospawn: true }
      },
      node: {
        files: [
          'app.js',
          'routes/**/*.js',
          'lib/*.js',
        ],
        tasks: ['jshint', 'develop'],
        options: { nospawn: true }
      },
      requirejs: {
        files: [
          'src/**/*.js'
        ],
        tasks: ['jshint', 'copy'],
        options: { nospawn: true }
      },
    },
    copy: {
      main: {
        expand: true,
        cwd: './src',
        src:'**/*.js',
        dest: 'dist'
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'app.js',
        'routes/**/*.js',
        'src/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    nunjucks: {
      files: {
        src: 'src/**/*.html',
        dest: 'dist/templates.js'
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: './bower_components',
          mainConfigFile: './src/main.js',
          include: ['main'],
          paths: {
            'main': '../src/main',
            'templates': '../dist/templates',
            'src': '../src'
          },
          out: './dist/main.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadTasks('./lib/grunt');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('default', [
    'less:development',
    'nunjucks',
    'jshint',
    'copy',
    'develop',
    'watch'
  ]);

  grunt.registerTask('heroku', [
    'nunjucks',
    'less:production',
    'requirejs',
  ]);

};
