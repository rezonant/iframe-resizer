module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt) // eslint-disable-line import/no-extraneous-dependencies

  // load all grunt tasks
  // require('load-grunt-tasks')(grunt);

  // eslint-disable-next-line import/no-extraneous-dependencies
  require('jit-grunt')(grunt, {
    'bump-only': 'grunt-bump',
    'bump-commit': 'grunt-bump',
    coveralls: 'grunt-karma-coveralls'
  })

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      bannerLocal:
        '/*! iFrame Resizer (iframeSizer.min.js ) - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' *  Desc: Force cross domain iframes to size to content.\n' +
        ' *  Requires: iframeResizer.contentWindow.min.js to be loaded into the target frame.\n' +
        ' *  Copyright: (c) <%= grunt.template.today("yyyy") %> David J. Bradshaw - dave@bradshaw.net\n' +
        ' *  License: MIT\n */\n',
      bannerRemote:
        '/*! iFrame Resizer (iframeSizer.contentWindow.min.js) - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' *  Desc: Include this file in any page being loaded into an iframe\n' +
        ' *        to force the iframe to resize to the content size.\n' +
        ' *  Requires: iframeResizer.min.js on host page.\n' +
        ' *  Copyright: (c) <%= grunt.template.today("yyyy") %> David J. Bradshaw - dave@bradshaw.net\n' +
        ' *  License: MIT\n */\n'
    },

    clean: ['coverage', 'coverageLcov'],

    // qunit: {
    //   files: ['test/*.html'],
    //   puppeteer: {
    //     args: [
    //       '--disable-web-security',
    //       '--allow-file-access-from-files',
    //       '--user-data-dir=/tmp'
    //     ]
    //   }
    // },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      travis: {
        singleRun: true,
        browsers: ['Chrome'], // 'PhantomJS'
        coverageReporter: {
          type: 'lcov',
          dir: 'coverageLcov/'
        }
      },
      single: {
        singleRun: true,
        browsers: ['Chrome'] // 'Safari', 'PhantomJS', 'Firefox'
      },
      watch: {
        singleRun: false,
        browsers: ['Chrome'], // 'Firefox', 'Safari', 'PhantomJS'
        reporters: ['logcapture', 'progress']
      }
    },

    coveralls: {
      options: {
        debug: true,
        coverageDir: 'coverageLcov',
        dryRun: false,
        force: true,
        recursive: true
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        report: 'gzip'
      },
      local: {
        options: {
          banner: '<%= meta.bannerLocal %>',
          sourceMapName: 'js/iframeResizer.map'
        },
        src: ['js/iframeResizer.js'],
        dest: 'js/iframeResizer.min.js'
      },
      remote: {
        options: {
          banner: '<%= meta.bannerRemote %>',
          sourceMapName: 'js/iframeResizer.contentWindow.map'
        },
        src: ['js/iframeResizer.contentWindow.js'],
        dest: 'js/iframeResizer.contentWindow.min.js'
      }
    },

    watch: {
      files: ['src/**/*'],
      tasks: 'default'
    },

    bump: {
      options: {
        files: ['package.json', 'package-lock.json', 'bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'], // '-a' for all files
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    },

    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true
      },
      npm: {
        command: 'npm publish'
      },
      deployExample: {
        command() {
          let retStr = ''
          const fs = require('node:fs')

          if (fs.existsSync('bin')) {
            retStr = 'bin/deploy.sh'
          }

          return retStr
        }
      }
    },

    jsonlint: {
      json: {
        src: ['*.json']
      }
    },

    removeBlock: {
      options: ['TEST CODE START', 'TEST CODE END'],
      files: [
        {
          src: 'src/iframeResizer.contentWindow.js',
          dest: 'js/iframeResizer.contentWindow.js'
        }
      ]
    },

    copy: {
      main: {
        nonull: true,
        src: 'src/iframeResizer.js',
        dest: 'js/iframeResizer.js'
      }
    },

    eslint: {
      options: {
        fix: true
      },
      target: ['src/**', '*.js']
    }
  })

  grunt.registerTask('default', ['notest', 'karma:single'])
  grunt.registerTask('build', ['removeBlock', 'copy', 'uglify'])
  grunt.registerTask('notest', ['eslint', 'jsonlint', 'build'])
  grunt.registerTask('test', ['clean', 'eslint', 'karma:single']) // , 'qunit'
  grunt.registerTask('test-watch', ['clean', 'karma:watch'])
  grunt.registerTask('travis', [
    'clean',
    'notest',
    // 'qunit',
    'karma:travis',
    'coveralls'
  ])

  grunt.registerTask('postBump', ['build', 'bump-commit', 'shell'])
  grunt.registerTask('preBump', ['clean', 'notest'])
  grunt.registerTask('patch', ['preBump', 'bump-only:patch', 'postBump'])
  grunt.registerTask('minor', ['preBump', 'bump-only:minor', 'postBump'])
  grunt.registerTask('major', ['preBump', 'bump-only:major', 'postBump'])

  grunt.registerMultiTask('removeBlock', function () {
    // set up a removal regular expression
    // eslint-disable-next-line security/detect-non-literal-regexp
    const removalRegEx = new RegExp(
      `(// ${this.options()[0]} //)(?:[^])*?(// ${this.options()[1]} //)`,
      'g'
    )

    this.data.forEach((fileObj) => {
      const sourceFile = grunt.file.read(fileObj.src)
      const removedFile = sourceFile.replace(removalRegEx, '')

      grunt.file.write(fileObj.dest, removedFile)
    }) // for each loop end
  })
}
