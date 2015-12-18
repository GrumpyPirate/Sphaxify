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
};

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
	var initialSize = 512, // Define original base texture size
		suff = 'x', // suffix to add onto created size pack directories
		fileStream = gulp.src(paths.img.src + '**', // source everything
			{ base: paths.img.src }
		);

	function resizeStream (stream, size) {
		var pctScale = (size / initialSize * 100).toString() + '%',
			customDirname = size.toString() + suff + '/',
			ignoreStuff = $.ignore('**/*.{psb,psd}'),
			filterPNG = $.filter(['**/*.png'], { restore: true }),
			filterResizeables = $.filter([
				'**/*.png',
				'!**/pack.png'
			], { restore: true }),
			// If there are images that need their transparency preserved, define them here, e.g.:
			// filterThresholdable = $.filter(['**/*.png', '!**/items/icons/**/*.png'], { restore: true });
			filterThresholdable = $.filter([
				'**/*.png'
			], { restore: true });

		return stream
			.pipe(ignoreStuff)
			.pipe($.clone())
			.pipe($.rename(function (path) {
				// { dirname: 'Example Project 2',
				//   basename: 'test1',
				//   extname: '.png' }
				path.dirname = customDirname + path.dirname;
			}))
			.pipe($.newer(paths.img.dest))
			// Cache everything past this point, name the cache using dirname
			.pipe($.cached(customDirname))
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
			.pipe(gulp.dest(paths.img.dest));
	} // /function resizeStream

	return $.mergeStream(
		resizeStream(fileStream, 512),
		resizeStream(fileStream, 256),
		resizeStream(fileStream, 128),
		resizeStream(fileStream, 64),
		resizeStream(fileStream, 32)
	);
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
