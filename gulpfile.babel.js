/* -------------------------------------------------------------------------------------------------
** Sphax Patch - Setup
** -------------------------------------------------------------------------------------------------
** Edit the below section to customise the patch
** ---------------------------------------------------------------------------------------------- */
const PATCH_CONFIG = require('./patch.config.json')

/* -------------------------------------------------------------------------------------------------
** Core logic below, only edit the below if you're brave/bored/interested
** ---------------------------------------------------------------------------------------------- */
// Source/generated paths
const PATHS = {
    // Source images/designs folder - source designs should be placed here
    src:  'source-designs/',
    // Destination for generated size packs
    dest: 'size-packs/'
}
// custom plugin SETTINGS
// -------------------------------------------------------------------------------------------------
const SETTINGS = {
        imagemin: {
            // Default is 2 (8 trials)
            optimizationLevel: 4,
            keepBitDepth: false,
            keepColorType: true,
            keepPalette: false,
            keepIDAT: false,
        }
    },
// watched filename patterns
// -------------------------------------------------------------------------------------------------
    WATCHED_PATTERNS = {
        img: PATHS.src + '**/*.{png,mcmeta,txt}'
    },
// Suffix to add onto created size pack directories
// -------------------------------------------------------------------------------------------------
    PATCH_SIZE_SUFFIX = 'x',
// Pre-populate a list of SIZES
// -------------------------------------------------------------------------------------------------
    SIZES = (function () {
        let a = []

        for (let l = 0; l < PATCH_CONFIG.resizeLevels; l++) {
            var size = PATCH_CONFIG.initialSize / Math.pow(2, l)
            a.push(size)
        } // /for ... PATCH_CONFIG.resizeLevels

        return a
    })()


/* -------------------------------------------------------------------------------------------------
** GULP PLUGINS
** ---------------------------------------------------------------------------------------------- */
// Gulp + plugins
import gulp from 'gulp'

const $ = require('gulp-load-plugins')({
    pattern: '*',
    camelize: true
})

// Node core modules
import path from 'path'
import fs from 'fs'

// Get command line CLI_ARGS
const CLI_ARGS = $.minimist(process.argv.slice(2))


/* -------------------------------------------------------------------------------------------------
** GLOBAL FUNCTIONS
** ---------------------------------------------------------------------------------------------- */
// getDirs - returns an array of first-level directory names in a baseDir
function getDirs(baseDir, callback) {
    // Store dirs in new empty array
    var dirs = []

    // Read the contents of baseDir
    fs.readdir(baseDir, function (err, files) {
        function checkDir(count, file, filePath) {
            // ignore hidden/system files
            if (file[0] !== '.') {
                // Get the file's stats
                fs.stat(filePath, function(err, stats) {
                    // If this file is a dir, push to dirs
                    if (stats.isDirectory()) {
                        dirs.push(file)
                    } // /if (stats.isDirectory())

                    // Execute callback when finished looping through files
                    if (count === (files.length - 1)) {
                        return callback(dirs)
                    } // /if (count === 0)
                }) // /fs.stat(filePath...
            } // /ignore hidden/system files
        } // /function checkDir

        // Exit if errors
        if (err) {
            console.error(err)
            return callback([])
        }
        // Otherwise...
        else {
            // For every file in files
            for (let f = 0; f < files.length; f++) {
                // Get the filename and filepath
                var file = files[f],
                    filePath = path.join(baseDir, file)

                // Check whether the file as a dir
                checkDir(f, file, filePath)
            } // / For every file in files
        }
    }) // /fs.readdir(baseDir...
} // /function getDirs

function resizeStream(dirname, size) {
    let pctScale      = size / PATCH_CONFIG.initialSize * 100 + '%' // 50%
    let packName      = size + PATCH_SIZE_SUFFIX // 256x
    let customDirname = path.join(dirname, packName) // 1.7.10/256x

    // Set up PNG-only file filter
    let FILTER_PNG            = $.filter('**/*.png', { restore: true })
    // Optimise these files using OptiPNG
    let FILTER_COMPRESSABLES  = $.filter(PATCH_CONFIG.compressables, { restore: true })
    // Resize these files
    let FILTER_RESIZEABLES    = $.filter(PATCH_CONFIG.resizeables, { restore: true })
    // Apply threshold filter to (remove transparent pixels from) these files
    let FILTER_THRESHOLDABLES = $.filter(PATCH_CONFIG.thresholdables, { restore: true })

    return gulp.src(path.join(PATHS.src, dirname, '**'),
            { base: path.join(PATHS.src, dirname) }
        ) // source everything
        // Only pass through files newer than dest files
        .pipe($.newer(path.join(PATHS.dest, dirname, packName)))
        // Filter out crap
        .pipe($.ignore(PATCH_CONFIG.junkFiletypes))
        // Do the following steps to PNGs only( i.e. no .txt, .mcmeta files)
        .pipe(FILTER_PNG)
            // Do the following to ONLY PATCH_CONFIG.resizeables
            .pipe(FILTER_RESIZEABLES)
                // Use gulp-gm to resize images
                .pipe($.gm(function (imageFile) {
                    return imageFile
                        // Ensure 8-bit RGB
                        .bitdepth(8)
                        // Bilinear
                        // .filter('Triangle')
                        // 'Bicubic' (Catmull-Rom)
                        .filter('Catrom')
                        // Resize to % scale
                        .resize(pctScale, '%')
                }))
            .pipe(FILTER_RESIZEABLES.restore)
            // Use gulp-gm to  apply threshold to (remove partial transparency from) images
            // BUT - Apply only to images we want to remove transparency from
            .pipe(FILTER_THRESHOLDABLES)
                .pipe($.gm(function (imageFile) {
                    return imageFile
                        // Ensure no transparent edges on all PNGs
                        .operator('Opacity', 'Threshold', 50, '%')
                }))
            .pipe(FILTER_THRESHOLDABLES.restore)
            // pass images registered in PATCH_CONFIG.compressables through imagemin
            .pipe(FILTER_COMPRESSABLES)
                // Measure file-by-file byte difference
                .pipe($.bytediff.start())
                    .pipe($.imageminOptipng(SETTINGS.imagemin)())
                .pipe($.bytediff.stop())
            .pipe(FILTER_COMPRESSABLES.restore)
        // Restore non-PNG files to stream
        .pipe(FILTER_PNG.restore)
        .pipe($.rename(function (thisPath) {
            thisPath.dirname = path.join(customDirname, thisPath.dirname)
        }))
        .pipe(gulp.dest(PATHS.dest))
        // Log when basic pack has been written
        .on('end', function () {
            $.util.log($.util.colors.magenta('Finished creating pack:'), $.util.colors.cyan(customDirname))
        })
} // /function resizeStream

function zipStream(dirname, size) {
    // Intended zip name:
    // [dirname] [size] Sphax Patch - PATCH_CONFIG.patchName.zip
    // i.e.: [1.6.4] [32x] Sphax Patch - NoPatchName.zip
    // ---------------------------------------------------------------------------------------------
    var packName = size + PATCH_SIZE_SUFFIX,
        zipName = '[' + dirname + '] [' + size + 'x] Sphax Patch - ' + (CLI_ARGS.patchname || PATCH_CONFIG.patchName) + '.zip',
        targetDir = path.join(PATHS.dest, dirname, packName)

    return gulp.src(targetDir + '/**', { base: targetDir })
        // zip everything up
        .pipe($.zip(zipName))
        .pipe(gulp.dest(PATHS.dest))
        // Log when zip has been written
        .on('end', function () {
            $.util.log($.util.colors.magenta('Created zip:'), $.util.colors.green(zipName))
        })
} // /function zipStream


/* -------------------------------------------------------------------------------------------------
** TASKS
** ---------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------
** Task - makeZips
** ---------------------------------------------------------------------------------------------- */
gulp.task('makeZips', ['optimise'], function () {
    // Set up a new merge-stream instance
    var mergedStream = new $.mergeStream(),
        dirs = []

    // Get the first-level dirs inside PATHS.dest
    getDirs(PATHS.dest, function(destDirs) {
        dirs = destDirs
        // For each dir (assume these are versions)
        dirs.forEach(function(dir) {
            // And for every resize level
            SIZES.forEach(function(size) {
                // Push a new resizeStream to mergedStream
                mergedStream.add(
                    new zipStream(dir, size)
                )
            }) // /SIZES.forEach
        }) // /dirs.forEach
    }) // /getDirs(PATHS.src...

    return mergedStream
        .on('end', function () {
            $.nodeNotifier.notify({
                title: 'Sphax Patch - ' + (CLI_ARGS.patchname || PATCH_CONFIG.patchName),
                message: 'Finished making zips!',
                // icon: path.join(PATHS.src, dirs[0], 'pack.png')
            })
        })
}) // /gulp.task('makeZips'...


/* -------------------------------------------------------------------------------------------------
** Task - optimise
** ---------------------------------------------------------------------------------------------- */
gulp.task('optimise', function () {
    // Set up a new merge-stream instance
    var mergedStream = new $.mergeStream()

    // Get the first-level dirs inside PATHS.src
    getDirs(PATHS.src, function(dirs) {
        // For each dir (assume these are versions)
        dirs.forEach(function(dir) {
            // And for every resize level
            SIZES.forEach(function(size) {
                // Push a new resizeStream to mergedStream
                mergedStream.add(
                    new resizeStream(dir, size)
                )
            }) // /SIZES.forEach
        }) // /dirs.forEach
    }) // /getDirs(PATHS.src...

    // Return mergedStream, allows task to resolve once all async-added streams
    // have collectively resolved
    return mergedStream
        .on('end', function () {
            $.nodeNotifier.notify({
                title: 'Sphax Patch - ' + (CLI_ARGS.patchname || PATCH_CONFIG.patchName),
                message: 'Finished generating size packs!',
                // icon: path.join(PATHS.src, dirs[0], 'pack.png')
            })
        })
})


// Watch task
// -------------------------------------------------------------------------------------------------
gulp.task('watch', function () {
    function watchFiles () {
        $.util.log(
            '\n\n',
            $.util.colors.cyan('Watching for changes:\n'),
            '\t' + $.util.colors.green('Source files:'), WATCHED_PATTERNS.img,
            '\n\n',
            'Size packs will be regenerated when any of these filetypes change within',
            $.util.colors.yellow('\'' + PATHS.src + '\''),
            '.',
            '\n'
        )

        // Watch Images
        // -----------------------------------------------------------------------------------------
        gulp.watch(WATCHED_PATTERNS.img, ['optimise'])
    } // /function watchFiles

    // for each dir inside PATHS.src
    fs.readdir(PATHS.src, function (err, files) {
        if (files.length) {
            watchFiles()
        }
        else {
            $.util.log(
                '\n\n',
                '\t' + 'No source files found to process.',
                '\n',
                '\t' + 'Make sure you\'ve placed the folders you want to process inside the',
                $.util.colors.yellow('\'' + PATHS.src + '\''),
                'directory.',
                '\n',
                '\t' + 'Alternatively, edit the',
                $.util.colors.yellow('\'PATHS\''),
                'variable in',
                $.util.colors.yellow('\'Gulpfile.js\''),
                'to customise the source/destination directories.'
            )
        }
    }) // /fs.readdir(PATHS.src...
}) // /watch
