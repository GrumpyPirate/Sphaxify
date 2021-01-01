import { notify } from 'node-notifier';
import { Transform } from 'stream';
import ansiColors from 'ansi-colors';
import fs from 'fs';
import gulp, { TaskFunction } from 'gulp';
import gulpFilter from 'gulp-filter';
import gulpImagemin from 'gulp-imagemin';
import gulpNewer from 'gulp-newer';
import gulpRename from 'gulp-rename';
import gulpZip from 'gulp-zip';
import mergeStream from 'merge-stream';
import minimist from 'minimist';
import path from 'path';
import rimraf from 'rimraf';
import sharp from 'sharp';
import toml from '@iarna/toml';
import Vinyl, { BufferFile } from 'vinyl';

const gulpBytediff = require('gulp-bytediff');
const gulpIgnore = require('gulp-ignore');

const patchConfig = toml.parse(
  fs.readFileSync(path.join(__dirname, '..', 'patch.config.toml'), 'utf-8'),
) as {
  patchName: string;
  initialSize: number;
  resizeLevels: number;
  junkFiletypes: string[];
  resizeables: string[];
  thresholdables: string[];
};

// Source/generated paths
const paths = {
  // Source images/designs folder - source designs should be placed here
  src: path.join(__dirname, '..', 'source-designs'),
  // Destination for generated size packs
  dest: path.join(__dirname, '..', 'size-packs'),
};

const imageminSettings = {
  optipng: {
    optimizationLevel: 4,
    bitDepthReduction: true,
    colorTypeReduction: false,
    paletteReduction: true,
  },
};
const watchedFilesGlob = `${paths.src}/**/*.{png,mcmeta,txt,json}`;
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
const getNonSelfDirs = (baseDir: string): string[] =>
  fs
    .readdirSync(baseDir)
    .reduce<string[]>(
      (accDirs, filename) =>
        fs.statSync(path.join(baseDir, filename)).isDirectory() && !filename.startsWith('.')
          ? [...accDirs, filename]
          : accDirs,
      [],
    );

const createResizeStream = (dirname: string, size: number): NodeJS.ReadWriteStream => {
  const scale = size / patchConfig.initialSize; // e.g. 0.5, 0.25, 0.125, etc.
  const packName = `${size}${patchSizeSuffix}`; // 256x
  const customDirname = path.join(dirname, packName); // 1.7.10/256x

  // Set up PNG-only file filter
  const filterPNG = gulpFilter('**/*.png', { restore: true });
  // Resize these files
  const filterResizeables = gulpFilter(patchConfig.resizeables, { restore: true });
  // Apply threshold filter to (remove transparent pixels from) these files
  const filterThresholdables = gulpFilter(patchConfig.thresholdables, { restore: true });

  return (
    gulp
      // source everything
      .src(path.join(paths.src, dirname, '**'), { base: path.join(paths.src, dirname) })
      // Only pass through files newer than dest files
      .pipe(gulpNewer(path.join(paths.dest, dirname, packName)))
      // Filter out crap
      .pipe(gulpIgnore(patchConfig.junkFiletypes))
      // Do the following steps to PNGs only( i.e. no .txt, .mcmeta files)
      .pipe(filterPNG)
      // Do the following to ONLY PATCH_CONFIG.resizeables
      .pipe(filterResizeables)
      // Resize images
      .pipe(
        new Transform({
          objectMode: true,
          transform: async (chunk: BufferFile, encoding, callback) => {
            const origImage = sharp(chunk.contents);
            const {
              height = patchConfig.initialSize,
              width = patchConfig.initialSize,
            } = await origImage.clone().metadata();

            callback(
              null,
              new Vinyl({
                path: path.resolve(chunk.relative),
                contents: await origImage
                  .resize({
                    width: width * scale,
                    height: height * scale,
                    kernel: sharp.kernel.cubic,
                  })
                  .png()
                  .toBuffer(),
              }),
            );
          },
        }),
      )
      .pipe(filterResizeables.restore)
      // Apply threshold to (remove partial transparency from) whitelisted images paths
      .pipe(filterThresholdables)
      .pipe(
        new Transform({
          objectMode: true,
          transform: async (chunk: BufferFile, encoding, callback) => {
            const origImage = sharp(chunk.contents);
            const { isOpaque } = await origImage.stats();

            if (isOpaque) {
              callback(null, chunk);
            } else {
              try {
                // Extract the alpha channel, threshold it
                const alphaChannel = await origImage
                  .clone()
                  .extractChannel('alpha')
                  .toColourspace('b-w')
                  .toBuffer();
                const alphaChannelThresholded = await sharp(alphaChannel).threshold().toBuffer();

                // Combine it with original image
                const newImageWithoutAlpha = await origImage.removeAlpha().toBuffer();
                const newImageWithAlpha = await sharp(newImageWithoutAlpha)
                  .joinChannel(alphaChannelThresholded)
                  .toBuffer();

                callback(
                  null,
                  new Vinyl({
                    path: path.resolve(chunk.relative),
                    contents: newImageWithAlpha,
                  }),
                );
              } catch (error) {
                console.log('error:', error);
                callback(error, chunk);
              }
            }
          },
        }),
      )
      .pipe(filterThresholdables.restore)
      // Measure file-by-file byte difference
      .pipe(gulpBytediff.start())
      .pipe(gulpImagemin([gulpImagemin.optipng(imageminSettings.optipng)]))
      .pipe(gulpBytediff.stop())
      // Restore non-PNG files to stream
      .pipe(filterPNG.restore)
      .pipe(
        gulpRename((filePath) => ({
          ...filePath,
          dirname: path.join(customDirname, filePath.dirname),
        })),
      )
      .pipe(gulp.dest(paths.dest))
      // Log when basic pack has been written
      .on('end', () => {
        console.log(ansiColors.magenta('Finished creating pack:'), ansiColors.cyan(customDirname));
      })
  );
};

const createZipStream = (dirname: string, size: number): NodeJS.ReadWriteStream => {
  // Intended zip name:
  // e.g.: SphaxPatch_MyTexturePack_MC1.16.4_64x.zip
  const packName = `${size}${patchSizeSuffix}`;
  const zipName = `SphaxPatch_${
    cliArgs.patchname || patchConfig.patchName
  }_MC${dirname}_${packName}.zip`;
  const targetDir = path.join(paths.dest, dirname, packName);

  return (
    gulp
      .src(`${targetDir}/**`, { base: targetDir })
      // zip everything up
      .pipe(gulpZip(zipName))
      .pipe(gulp.dest(paths.dest))
      // Log when zip has been written
      .on('end', () => {
        console.log(ansiColors.magenta('Created zip:'), ansiColors.green(zipName));
      })
  );
};

const clean: TaskFunction = (cb) => {
  rimraf(paths.dest, cb);
};

/**
 * Task - makeZips
 */
const makeZips = () => {
  const streams = getNonSelfDirs(paths.dest).map((dir) =>
    targetTextureSizes.map((size) => createZipStream(dir, size)),
  );

  return mergeStream(...streams).on('end', () => {
    notify({
      title: `Sphax Patch - ${cliArgs.patchname || patchConfig.patchName}`,
      message: 'Finished making zips!',
    });
  });
};

/**
 * Task - optimise
 */
const optimise = () => {
  const streams = getNonSelfDirs(paths.src).map((dir) =>
    targetTextureSizes.map((size) => createResizeStream(dir, size)),
  );

  return mergeStream(...streams).on('end', () => {
    notify({
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
      `  Make sure you've placed the folders you want to process inside the ${ansiColors.yellow(
        paths.src,
      )} directory.`,
    );
  } else {
    console.log(
      '\n',
      ansiColors.cyan('Watching for changes:\n'),
      `  ${ansiColors.green('Source files:')}`,
      watchedFilesGlob,
      '\n\n',
      `Size packs will be regenerated when any of these filetypes change within ${ansiColors.yellow(
        `'${paths.src}'`,
      )}.`,
      '\n',
    );

    gulp.watch(watchedFilesGlob, optimise);
  }
};

module.exports.clean = clean;
module.exports.optimise = gulp.series(optimise);
module.exports.makeZips = gulp.series(optimise, makeZips);
module.exports.watch = watch;
