/* -----------------------------------------------------------------------------
 * Sphax Patch - Setup
 * -----------------------------------------------------------------------------
 * Edit the below section to customise the patch
 * -------------------------------------------------------------------------- */
// Set patch name - will be used to name .zip files.
// Alternatively, when calling 'gulp makeZips' on the command line, pass in the
// argument '--patchname MyPatchName' to override
var patchName = 'NoPatchName';
// Initial size of source images - set this to the starting size of the patch
// E.g. if resizing a 128x patch, set to 128
var initialSize = 512;
// Set how many times the original patch should be downsized (inclusive)
// E.g. processing a 512x patch 5 times would produce: 512, 256, 128, 64, 32
var resizeLevels = 5;
// Prevent these files from being included in generated size packs:
var ignoreTheseFiles = [
    // Design files
    '**/*.{ai,psb,psd}',
    // Win/OSX system files
    '**/*.{DS_Store,db}',
];
// Resize these files:
var resizeables = [
    '**/*.png',
    // By default, don't resize GUIs (i.e. anything inside a gui/ or guis/ folder)
    '!**/{gui,guis}/**/*.png',
    // Add similar entries to the below to disable resizing for specific files, e.g.:
    // '!**/blocks/someBlock.png',
    // '!**/blocks/someOtherBlock.png',
    // '!**/items/someItem.png',
    // etc...
];
// Apply threshold filter to (remove transparent pixels from) these files:
var thresholdables = [
    '**/*.png',
    // Add similar entries to the below to disable thresholding for specific files, e.g.:
    // '!**/blocks/someBlock.png',
    // '!**/blocks/someOtherBlock.png',
    // '!**/items/someItem.png',
    // etc...
];
// Optimise these files using imagemin:
var compressables = [
    '**/*.png',
    // Add similar entries to the below to disable lossless image compression for specific files, e.g.:
    // '!**/blocks/someBlock.png',
    // '!**/blocks/someOtherBlock.png',
    // '!**/items/someItem.png',
    // etc...
];
// Paths - set these to whatever, or simply leave as default
var paths = {
    // Source images/designs folder - source designs should be placed here
    src:  'source-designs/',
    // Destination for generated size packs
    dest: 'size-packs/'
};


/* -----------------------------------------------------------------------------
 * Core logic below, only edit the below if you're brave/bored/interested
 * -------------------------------------------------------------------------- */
// custom plugin settings
// -----------------------------------------------------------------------------
var settings = {
        imagemin: {
            // Default is 2 (8 trials)
            optimizationLevel: 3,
            keepBitDepth: false,
            keepColorType: true,
            keepPalette: false,
            keepIDAT: false,
        }
    },
// watched filename patterns
// -----------------------------------------------------------------------------
    watchedPatterns = {
        img: paths.src + '**/*.{png,mcmeta,txt}'
    },
// Suffix to add onto created size pack directories
// -----------------------------------------------------------------------------
    suff = 'x',
// Pre-populate a list of sizes
// -----------------------------------------------------------------------------
    sizes = (function () {
        var a = [];

        for (var l = 0; l < resizeLevels; l++) {
            var size = initialSize / Math.pow(2, l);
            a.push(size);
        } // /for ... resizeLevels

        return a;
    })();


/* -----------------------------------------------------------------------------
 * GULP PLUGINS
 * -------------------------------------------------------------------------- */
// Gulp + plugins
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern: '*',
        camelize: true
    }),
// Node core modules
    path = require('path'),
    fs = require('fs'),
// Get command line args
    args = $.minimist(process.argv.slice(2));


/* -----------------------------------------------------------------------------
 * GLOBAL FUNCTIONS
 * -------------------------------------------------------------------------- */
// getDirs - returns an array of first-level directory names in a baseDir
function getDirs(baseDir, callback) {
    // Store dirs in new empty array
    var dirs = [];

    // Read the contents of baseDir
    fs.readdir(baseDir, function (err, files) {
        function checkDir(count, file, filePath) {
            // ignore hidden/system files
            if (file[0] !== '.') {
                // Get the file's stats
                fs.stat(filePath, function(err, stats) {
                    // If this file is a dir, push to dirs
                    if (stats.isDirectory()) {
                        dirs.push(file);
                    } // /if (stats.isDirectory())

                    // Execute callback when finished looping through files
                    if (count === (files.length - 1)) {
                        return callback(dirs);
                    } // /if (count === 0)
                }); // /fs.stat(filePath...
            } // /ignore hidden/system files
        } // /function checkDir

        // Exit if errors
        if (err) {
            console.error(err);
            return cb([]);
        }
        // Otherwise...
        else {
            // For every file in files
            for (var f = 0; f < files.length; f++) {
                // Get the filename and filepath
                var file = files[f],
                    filePath = path.join(baseDir, file);

                // Check whether the file as a dir
                checkDir(f, file, filePath);
            } // / For every file in files
        }
    }); // /fs.readdir(baseDir...
} // /function getDirs

function resizeStream(dirname, size) {
    var pctScale = size / initialSize * 100 + '%', // 50%
        packName = size + suff, // 256x
        customDirname = path.join(dirname, packName), // 1.7.10/256x
        // Set up PNG-only file filter:
        filterPNG = $.filter('**/*.png', { restore: true });
        // Optimise these files using OptiPNG:
        filterCompressables = $.filter(compressables, { restore: true });
        // Resize these files:
        filterResizeables = $.filter(resizeables, { restore: true });
        // Apply threshold filter to (remove transparent pixels from) these files:
        filterThresholdables = $.filter(thresholdables, { restore: true });

    return gulp.src(path.join(paths.src, dirname, '**'),
            { base: path.join(paths.src, dirname) }
        ) // source everything
        // Only pass through files newer than dest files
        .pipe($.newer(path.join(paths.dest, dirname, packName)))
        // Filter out crap
        .pipe($.ignore(ignoreTheseFiles))
        // Do the following steps to PNGs only( i.e. no .txt, .mcmeta files)
        .pipe(filterPNG)
            // Do the following to ONLY resizeables
            .pipe(filterResizeables)
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
                        .resize(pctScale, '%');
                }))
            .pipe(filterResizeables.restore)
            // Use gulp-gm to  apply threshold to (remove partial transparency from) images
            // BUT - Apply only to images we want to remove transparency from
            .pipe(filterThresholdables)
                .pipe($.gm(function (imageFile) {
                    return imageFile
                        // Ensure no transparent edges on all PNGs
                        .operator('Opacity', 'Threshold', 50, '%');
                }))
            .pipe(filterThresholdables.restore)
            // pass images registered in compressables through imagemin
            .pipe(filterCompressables)
                // Measure file-by-file byte difference
                .pipe($.bytediff.start())
                    .pipe($.imageminOptipng(settings.imagemin)())
                .pipe($.bytediff.stop())
            .pipe(filterCompressables.restore)
        // Restore non-PNG files to stream
        .pipe(filterPNG.restore)
        .pipe($.rename(function (thisPath) {
            thisPath.dirname = path.join(customDirname, thisPath.dirname);
        }))
        .pipe(gulp.dest(paths.dest))
        // Log when basic pack has been written
        .on('end', function () {
            $.util.log($.util.colors.magenta('Finished creating pack:'), $.util.colors.cyan(customDirname));
        });
} // /function resizeStream

function zipStream(dirname, size) {
    // Intended zip name:
    // [dirname] [size] Sphax Patch - patchName.zip
    // i.e.: [1.6.4] [32x] Sphax Patch - NoPatchName.zip
    // -------------------------------------------------------------------------
    var packName = size + suff,
        zipName = '[' + dirname + '] [' + size + 'x] Sphax Patch - ' + (args.patchname || patchName) + '.zip',
        targetDir = path.join(paths.dest, dirname, packName);

    return gulp.src(targetDir + '/**', { base: targetDir })
        // zip everything up
        .pipe($.zip(zipName))
        .pipe(gulp.dest(paths.dest))
        // Log when zip has been written
        .on('end', function () {
            $.util.log($.util.colors.magenta('Created zip:'), $.util.colors.green(zipName));
        });
} // /function zipStream


/* -----------------------------------------------------------------------------
 * TASKS
 * -------------------------------------------------------------------------- */
/* -----------------------------------------------------------------------------
 * Task - makeZips
 * -------------------------------------------------------------------------- */
gulp.task('makeZips', ['optimise'], function () {
    // Set up a new merge-stream instance
    var mergedStream = new $.mergeStream(),
        dirs = [];

    // Get the first-level dirs inside paths.dest
    getDirs(paths.dest, function(destDirs) {
        dirs = destDirs;
        // For each dir (assume these are versions)
        dirs.forEach(function(dir) {
            // And for every resize level
            sizes.forEach(function(size) {
                // Push a new resizeStream to mergedStream
                mergedStream.add(
                    new zipStream(dir, size)
                );
            }); // /sizes.forEach
        }); // /dirs.forEach
    }); // /getDirs(paths.src...

    return mergedStream
        .on('end', function () {
            $.nodeNotifier.notify({
                title: 'Sphax Patch - ' + (args.patchname || patchName),
                message: 'Finished making zips!',
                // icon: path.join(paths.src, dirs[0], 'pack.png')
            });
        });
}); // /gulp.task('makeZips'...


/* -----------------------------------------------------------------------------
 * Task - optimise
 * -------------------------------------------------------------------------- */
gulp.task('optimise', function () {
    // Set up a new merge-stream instance
    var mergedStream = new $.mergeStream();

    // Get the first-level dirs inside paths.src
    getDirs(paths.src, function(dirs) {
        // For each dir (assume these are versions)
        dirs.forEach(function(dir) {
            // And for every resize level
            sizes.forEach(function(size) {
                // Push a new resizeStream to mergedStream
                mergedStream.add(
                    new resizeStream(dir, size)
                );
            }); // /sizes.forEach
        }); // /dirs.forEach
    }); // /getDirs(paths.src...

    // Return mergedStream, allows task to resolve once all async-added streams
    // have collectively resolved
    return mergedStream
        .on('end', function () {
            $.nodeNotifier.notify({
                title: 'Sphax Patch - ' + (args.patchname || patchName),
                message: 'Finished generating size packs!',
                // icon: path.join(paths.src, dirs[0], 'pack.png')
            });
        });
});


// Watch task
// -----------------------------------------------------------------------------
gulp.task('watch', function () {
    function watchFiles () {
        $.util.log(
            '\n\n',
            $.util.colors.cyan('Watching for changes:\n'),
            '\t' + $.util.colors.green('Source files:'), watchedPatterns.img,
            '\n\n',
            'Size packs will be regenerated when any of these filetypes change within',
            $.util.colors.yellow('\'' + paths.src + '\''),
            '.',
            '\n'
        );

        // Watch Images
        // ---------------------------------------------------------------------
        gulp.watch(watchedPatterns.img, ['optimise']);
    } // /function watchFiles

    // for each dir inside paths.src
    fs.readdir(paths.src, function (err, files) {
        if (files.length) {
            watchFiles();
        }
        else {
            $.util.log(
                '\n\n',
                '\t' + 'No source files found to process.',
                '\n',
                '\t' + 'Make sure you\'ve placed the folders you want to process inside the',
                $.util.colors.yellow('\'' + paths.src + '\''),
                'directory.',
                '\n',
                '\t' + 'Alternatively, edit the',
                $.util.colors.yellow('\'paths\''),
                'variable in',
                $.util.colors.yellow('\'Gulpfile.js\''),
                'to customise the source/destination directories.'
            );
        }
    }); // /fs.readdir(paths.src...
}); // /watch
