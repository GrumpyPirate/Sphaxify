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
	});

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
		suff = 'x', // suffix to add onto created size pack directories
		fileStream = gulp.src(paths.img.src + '**', // source everything
			{ base: paths.img.src }
		),
		mergedStream = new $.mergeStream();

	function resizeStream (size) {
		var pctScale = size.toString() + '%',
			relativeSize = initialSize * size / 100,
			customDirname = path.join(relativeSize + suff),
			zipName = '[' + customDirname + '] Sphax Patch - ' + patchName + '.zip',
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

		return fileStream
			.pipe($.clone())
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
				console.log(thisPath.dirname);
				thisPath.dirname = customDirname + '/' + thisPath.dirname;
			}))
			.pipe(gulp.dest(paths.img.dest))
			// zip everything up
			.pipe($.zip(zipName))
			.pipe(gulp.dest(paths.img.dest));
	} // /function resizeStream


	for (var i = 0; i < resizeLevels; i++) {
		var size = 100 / Math.pow(2, i);

		mergedStream.add(
			resizeStream(size)
		);
	}

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
