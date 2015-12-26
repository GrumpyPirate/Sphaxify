/* -----------------------------------------------------------------------------
 * VARS
 * -------------------------------------------------------------------------- */
// Paths for file assets
// -----------------------------------------------------------------------------
var paths = {
		src:  'src/',
		dest: 'dist/'
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
		img: paths.src + '**/*.{png,mcmeta,txt}'
	},
	// Patch name
	patchName = 'NoPatchName',
	// Define versions to process
	versions = ['1.6.4', '1.7.10'],
	// Suffix to add onto created size pack directories
	suff = 'x',
	// Initial size of source images (should be 512px)
	initialSize = 512,
	// Downsize the original pack this many times (inclusive), e.g.:
	// 512, 256, 128, 64, 32
	resizeLevels = 5,
	// Pre-populate a list of sizes
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
 * Task - makeZips
 * -------------------------------------------------------------------------- */
gulp.task('makeZips', ['optimise'], function () {
	var mergedStream = new $.mergeStream();

	function zipStream (version, size) {
		// Intended zip name:
		// [version] [size] Sphax Patch - patchName.zip
		// i.e.: [1.6.4] [32x] Sphax Patch - NoPatchName.zip
		// ---------------------------------------------------------------------
		var packName = size + suff,
			zipName = '[' + version + '] [' + size + 'x] Sphax Patch - ' + patchName + '.zip',
			targetDir = paths.dest + version + '/' + packName + '/';

		return gulp.src(targetDir + '**', { base: targetDir })
			// zip everything up
			.pipe($.zip(zipName))
			.pipe(gulp.dest(paths.dest))
			// Log when zip has been written
			.on('end', function () {
				$.util.log($.util.colors.magenta('Created zip:'), $.util.colors.green(zipName));
			});
	} // /function zipStream

	// For each version (1.6.4, 1.7.10, etc.)
	for (var v = 0; v < versions.length; v++) {
		// For each size
		for (var s = 0; s < sizes.length; s++) {
			mergedStream.add(
				zipStream(versions[v], sizes[s])
			);
		} // /for ... sizes
	} // for ... versions

	return mergedStream
		.pipe($.notify({
			title: 'Sphax Patch - ' + patchName,
			message: 'Finished making size packs!',
			icon: path.join(paths.src, versions[0], 'pack.png'),
			sound: true
		}));
}); // /gulp.task('makeZips'...

/* -----------------------------------------------------------------------------
 * Task - optimise
 * -------------------------------------------------------------------------- */
gulp.task('optimise', function () {
	var mergedStream = new $.mergeStream();

	function resizeStream (version, size) {
		var pctScale = size / initialSize * 100 + '%', // 50%
			packName = size + suff, // 256x
			customDirname = version + '/' + packName, // 1.7.10/256x
			ignoreStuff = $.ignore('**/*.{psb,psd,DS_Store,db}'),
			// Optimise these files:
			filterPNG = $.filter(['**/*.png'], { restore: true }),
			// Resize these files:
			filterResizeables = $.filter([
				'**/*.png',
				// By default, don't resize GUIs
				'!**/{gui,guis}/**/*.png',
				'!**/pack.png'
			], { restore: true }),
			// Apply threshold filter to these files:
			filterThresholdable = $.filter([
				'**/*.png'
			], { restore: true });

		return gulp.src(paths.src + version + '/**',
				{ base: paths.src + version + '/' }
			) // source everything
			// Only pass through files newer than dest files
			.pipe($.newer(paths.dest + version + '/' + packName + '/'))
			// Filter out crap
			.pipe(ignoreStuff)
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
				thisPath.dirname = customDirname + '/' + thisPath.dirname;
			}))
			.pipe(gulp.dest(paths.dest))
			// Log when basic pack has been written
			.on('end', function () {
				$.util.log($.util.colors.magenta('Finished creating pack:'), $.util.colors.cyan(customDirname));
			});
	} // /function resizeStream

	// For each version (1.6.4, 1.7.10, etc.)
	for (var v = 0; v < versions.length; v++) {
		// For each resiseLevel
		for (var s = 0; s < sizes.length; s++) {
			// Push a file stream to mergedStream
			mergedStream.add(
				resizeStream(versions[v], sizes[s])
			);
		} // /for ... sizes
	} // /for ... versions

	// Return merged streams to allow task to resolve
	return mergedStream;
});

// default task
// -----------------------------------------------------------------------------
gulp.task('default', ['makeZips'], function () {
	$.util.log(
		'\n\n',
		$.util.colors.cyan('Watching for changes:\n'),
		'\t',
		$.util.colors.green('Source files:'), watchedPatterns.img,
		'\n'
	);
	// Watch Images
	// -------------------------------------------------------------------------
	gulp.watch(watchedPatterns.img, ['makeZips']);
}); // /default
