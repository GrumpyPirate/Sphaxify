/* eslint-disable no-console */
const colors = require('ansi-colors');
const fs = require('fs');
const { series } = require('gulp');
const gulp = require('gulp');
const bytediff = require('gulp-bytediff');
const filter = require('gulp-filter');
const gm = require('gulp-gm');
const ignore = require('gulp-ignore');
const newer = require('gulp-newer');
const rename = require('gulp-rename');
const zip = require('gulp-zip');
const imagemin = require('gulp-imagemin');
const MergeStream = require('merge-stream');
const minimist = require('minimist');
const nodeNotifier = require('node-notifier');
const path = require('path');

const patchConfig = require('./patch.config.json');

/** ---------------------------------------------------------------------
 * Core logic below, only edit the below if you're brave/bored/interested
 * ------------------------------------------------------------------- */

// Source/generated paths
const paths = {
  // Source images/designs folder - source designs should be placed here
  src: 'source-designs',
  // Destination for generated size packs
  dest: 'size-packs',
};

const imageminSettings = {
  optipng: {
    optimizationLevel: 4,
    bitDepthReduction: true,
    colorTypeReduction: false,
    paletteReduction: true,
  },
};
const watchedFilesGlob = `${paths.src}/**/*.{png,mcmeta,txt}`;
const patchSizeSuffix = 'x';
const targetTextureSizes = Array.from({ length: patchConfig.resizeLevels }).map(
  (_, i) => patchConfig.initialSize / 2 ** i,
);

const cliArgs = minimist(process.argv.slice(2));

/**
 * Returns an array of first-level directory names in a baseDir
 *
 * @param  {string} baseDir
 * @returns {string[]}
 */
const getNonSelfDirs = (baseDir) => fs
  .readdirSync(baseDir)
  .reduce(
    (accDirs, filename) => (fs.statSync(path.join(baseDir, filename)).isDirectory() && !filename.startsWith('.')
      ? [...accDirs, filename]
      : accDirs),
    [],
  );

function ResizeStream(dirname, size) {
  const pctScale = `${(size / patchConfig.initialSize) * 100}%`; // 50%
  const packName = `${size}${patchSizeSuffix}`; // 256x
  const customDirname = path.join(dirname, packName); // 1.7.10/256x

  // Set up PNG-only file filter
  const filterPNG = filter('**/*.png', { restore: true });
  // Optimise these files using OptiPNG
  const filterCompressables = filter(patchConfig.compressables, { restore: true });
  // Resize these files
  const filterResizeables = filter(patchConfig.resizeables, { restore: true });
  // Apply threshold filter to (remove transparent pixels from) these files
  const filterThresholdables = filter(patchConfig.thresholdables, { restore: true });

  return (
    gulp
      // source everything
      .src(path.join(paths.src, dirname, '**'), { base: path.join(paths.src, dirname) })
      // Only pass through files newer than dest files
      .pipe(newer(path.join(paths.dest, dirname, packName)))
      // Filter out crap
      .pipe(ignore(patchConfig.junkFiletypes))
      // Do the following steps to PNGs only( i.e. no .txt, .mcmeta files)
      .pipe(filterPNG)
      // Do the following to ONLY PATCH_CONFIG.resizeables
      .pipe(filterResizeables)
      // Use gulp-gm to resize images
      .pipe(
        gm((imageFile) => imageFile
        // Ensure 8-bit RGB
          .bitdepth(8)
        // Bilinear
        // .filter('Triangle')
        // 'Bicubic' (Catmull-Rom)
          .filter('Catrom')
        // Resize to % scale
          .resize(pctScale, '%')),
      )
      .pipe(filterResizeables.restore)
      // Use gulp-gm to  apply threshold to (remove partial transparency from) images
      // BUT - Apply only to images we want to remove transparency from
      .pipe(filterThresholdables)
      .pipe(
        gm((imageFile) => imageFile
        // Ensure no transparent edges on all PNGs
          .operator('Opacity', 'Threshold', 50, '%')),
      )
      .pipe(filterThresholdables.restore)
      // pass images registered in PATCH_CONFIG.compressables through imagemin
      .pipe(filterCompressables)
      // Measure file-by-file byte difference
      .pipe(bytediff.start())
      .pipe(imagemin([
        imagemin.optipng(imageminSettings.optipng),
      ]))
      .pipe(bytediff.stop())
      .pipe(filterCompressables.restore)
      // Restore non-PNG files to stream
      .pipe(filterPNG.restore)
      .pipe(
        rename((filePath) => ({
          ...filePath,
          dirname: path.join(customDirname, filePath.dirname),
        })),
      )
      .pipe(gulp.dest(paths.dest))
      // Log when basic pack has been written
      .on('end', () => {
        console.log(colors.magenta('Finished creating pack:'), colors.cyan(customDirname));
      })
  );
}

function ZipStream(dirname, size) {
  // Intended zip name:
  // [dirname] [size] Sphax Patch - PATCH_CONFIG.patchName.zip
  // e.g.: [1.6.4] [32x] Sphax Patch - NoPatchName.zip
  const packName = `${size}${patchSizeSuffix}`;
  const zipName = `[${dirname}] [${size}x] Sphax Patch - ${
    cliArgs.patchname || patchConfig.patchName
  }.zip`;
  const targetDir = path.join(paths.dest, dirname, packName);

  return (
    gulp
      .src(`${targetDir}/**`, { base: targetDir })
      // zip everything up
      .pipe(zip(zipName))
      .pipe(gulp.dest(paths.dest))
      // Log when zip has been written
      .on('end', () => {
        console.log(colors.magenta('Created zip:'), colors.green(zipName));
      })
  );
}

/**
 * Task - makeZips
 */
const makeZips = () => {
  const mergedStream = new MergeStream();

  // Get the first-level dirs inside PATHS.dest
  const destDirs = getNonSelfDirs(paths.dest);

  // For each dir (assume these are versions)
  destDirs.forEach((dir) => {
    targetTextureSizes.forEach((size) => {
      // Push a new resizeStream to mergedStream
      mergedStream.add(new ZipStream(dir, size));
    });
  });

  return mergedStream.on('end', () => {
    nodeNotifier.notify({
      title: `Sphax Patch - ${cliArgs.patchname || patchConfig.patchName}`,
      message: 'Finished making zips!',
    });
  });
};

/**
 * Task - optimise
 */
const optimise = () => {
  const mergedStream = new MergeStream();

  // Get the first-level dirs inside PATHS.src
  const dirs = getNonSelfDirs(paths.src);

  // For each dir (assume these are versions)
  dirs.forEach((dir) => {
    targetTextureSizes.forEach((size) => {
      // Push a new resizeStream to mergedStream
      mergedStream.add(new ResizeStream(dir, size));
    });
  });

  // Return mergedStream, allows task to resolve once all async-added streams
  // have collectively resolved
  return mergedStream.on('end', () => {
    nodeNotifier.notify({
      title: `Sphax Patch - ${cliArgs.patchname || patchConfig.patchName}`,
      message: 'Finished generating size packs!',
    });
  });
};

/**
 * Task - watch
 */
const watch = () => {
  const filesToWatch = fs.readdirSync(paths.src);

  if (filesToWatch.length === 0) {
    console.log(
      '\n\n',
      '  No source files found to process.',
      '\n',
      `  Make sure you've placed the folders you want to process inside the ${colors.yellow(
        paths.src,
      )} directory.`,
    );
  } else {
    console.log(
      '\n',
      colors.cyan('Watching for changes:\n'),
      `  ${colors.green('Source files:')}`,
      watchedFilesGlob,
      '\n\n',
      `Size packs will be regenerated when any of these filetypes change within ${colors.yellow(
        `'${paths.src}'`,
      )}.`,
      '\n',
    );

    gulp.watch(watchedFilesGlob, optimise);
  }
};

module.exports.optimise = optimise;
module.exports.makeZips = series(optimise, makeZips);
module.exports.watch = watch;
