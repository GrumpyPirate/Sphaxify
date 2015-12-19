/* -----------------------------------------------------------------------------
 * VARS
 * -------------------------------------------------------------------------- */

// Project base paths
// -----------------------------------------------------------------------------
var basePaths = {
	src:  'Source/',
	dest: 'Compiled Size Packs/'
},

// Paths for file assets
// -----------------------------------------------------------------------------
paths = {
	img: {
		src:  basePaths.src,
		dest: basePaths.dest
	}
},
// custom plugin settings
// -----------------------------------------------------------------------------
settings = {
	imagemin: {
		// Default is 3 (16 trials)
		optimizationLevel: 3
	}
},

// watched filename patterns
// -----------------------------------------------------------------------------
watchedPatterns = {
	img: paths.img.src + '**/*.png'
},

// Patch name!
// -----------------------------------------------------------------
patchName = 'NoPatchName';

/* -----------------------------------------------------------------------------
 * GULP PLUGINS
 * -------------------------------------------------------------------------- */
var gulp = require('gulp'),
	$ = require('gulp-load-plugins')({
		pattern: '*',
		camelize: true
	}),
	path = require('path');

/* -----------------------------------------------------------------------------
 * Global Functions
 * -------------------------------------------------------------------------- */
/* -----------------------------------------------------------------------------
 * TASKS
 * -------------------------------------------------------------------------- */
/* -----------------------------------------------------------------------------
 * Task - optimise
 * -------------------------------------------------------------------------- */
gulp.task('optimise', function() {
	var initialSize = 512,
		resizeLevels = 5, // Downsize the original pack this many times
		versions = ['1.6.4', '1.7.10'], // define versions to process
		suff = 'x', // suffix to add onto created size pack directories
		mergedStream = new $.mergeStream();

	function resizeStream (version, size) {
		var pctScale = size.toString() + '%', // 50%
			relativeSize = initialSize * size / 100, // 256
			packName = relativeSize + suff, // 256x
			customDirname = version + '/' + packName, // 1.7.10/256x
			zipName = '[' + version + '] [' + packName + '] Sphax Patch - ' + patchName + '.zip',
			ignoreStuff = $.ignore('**/*.{psb,psd,DS_Store,db}'),
			// Optimise these files:
			filterPNG = $.filter(['**/*.png'], { restore: true }),
			// Resize these files:
			filterResizeables = $.filter([
				'**/*.png',
				'!**/{gui,guis,font,fonts}/**/*.png',
				'!**/pack.png'
			], { restore: true }),
			// Apply threshold filter to these files:
			filterThresholdable = $.filter([
				'**/*.png'
			], { restore: true });

		// Log process
		console.log('\n', );

		return fileStream = gulp.src(paths.img.src + version + '/**', // source everything
				{ base: paths.img.src + version + '/' }
			)
			.pipe(ignoreStuff)
			.pipe($.newer(paths.img.dest))
			// Cache everything past this point, name the cache using dirname
			.pipe($.cached(relativeSize.toString()))
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
							.filter('Triangle')
							// Resize to % scale
							.resize(pctScale, '%');
					}))
				.pipe(filterResizeables.restore)
				// Use gulp-gm to  apply threshold to (remove partial transparency from) images
				// Apply only to images we want to remove transparency from
				.pipe(filterThresholdable)
					.pipe($.gm(function (imageFile) {
						return imageFile
							// Ensure no transparent edges on all PNGs
							.operator('Opacity', 'Threshold', 50, '%');
					}))
				.pipe(filterThresholdable.restore)
				// pass all images through gulp-imagemin
				.pipe($.imagemin(settings.imagemin))
			// Restore non-PNG files to stream
			.pipe(filterPNG.restore)
			.pipe($.rename(function (thisPath) {
				// { dirname: 'Example Project 2',
				//   basename: 'test1',
				//   extname: '.png' }
				// console.log(thisPath.dirname);
				thisPath.dirname = customDirname + '/' + thisPath.dirname;
			}))
			.pipe(gulp.dest(paths.img.dest))
			// zip everything up
			.pipe($.rename(function (thisPath) {
				// Remove version + packName from current path
				// The goal is to store only assets/** folder inside zip
				var i = thisPath.dirname.indexOf(packName),
					// zipPath = path.join(paths.img.dest, thisPath.dirname.slice(i + packName.length));
					zipPath = thisPath.dirname.slice(i + packName.length);
				thisPath.dirname = zipPath;
			}))
			.pipe($.zip(zipName))
			.pipe(gulp.dest(paths.img.dest));
	} // /function resizeStream

	// For each version (1.6.4, 1.7.10, etc.)
	for (var v = 0; v < versions.length; v++) {
		// For each resiseLevel
		for (var l = 0; l < resizeLevels; l++) {
			// Get percentage scale of resizeLevel from initialSize
			var size = 100 / Math.pow(2, l);

			// Push a file stream to mergedStream
			mergedStream.add(
				resizeStream(versions[v], size)
			);
		} // /for ... resizeLevels
	} // /for ... versions

	// Return merged streams to allow task to resolve
	return mergedStream;
});

// default task
// -----------------------------------------------------------------------------
gulp.task('default', function () {
	console.log('\nWatching for changes:\n');
	// Watch Images
	// -------------------------------------------------------------------------
	console.log('- IMG Files: ' + watchedPatterns.img);
	gulp.watch(watchedPatterns.img, ['optimise']);

	console.log('\n');
}); // /default
