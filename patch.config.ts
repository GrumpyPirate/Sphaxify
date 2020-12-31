export default {
  /**
   * Patch name
   * ----------
   * Generated size pack zips will use the patch name in the filename.
   */
  patchName: 'MyTexturePack',
  /**
   * Initial Size
   * ------------
   * The initial resolution of the source designs. E.g. for a set of source designs that are 128x128px, set this to 128.
   */
  initialSize: 512,
  /**
   * Resize Levels
   * -------------
   * The number of times to resize the texture pack, inclusive of the initial size.
   * For example, specifying 2 resize levels for an initial size of 128x would generate 128x, and 64x size
   * packs.
   */
  resizeLevels: 5,
  /**
   * Junk file types
   * ---------------
   * Ignore any of these file types, excluding them from the generated size packs.
   */
  junkFiletypes: ['**/*.{ai,psb,psd}', '**/*.{DS_Store,db}'],
  /**
   * Resizeables
   * -----------
   * Images to apply resizing to. By default, this is set up to exclude GUIs.
   */
  resizeables: ['**/*.png', '!**/{gui,guis}/**/*.png'],
  /**
   * Thresholdables
   * --------------
   * Image path patterns to apply alpha thresholding to - or in other words, remove any transparency from
   * textures by forcing pixels' opacity to either 100% or 0. This is particularly useful for items, which
   * arguably look best with hard edges.
   *
   * By default only items are thresholded, to prevent unintended side effects to other textures that often need to be translucent, like
   * fluids.
   *
   * To customise thresholding, add more patterns to this array. For example:
   */
  // Only threshold specific images:
  // thresholdables: [
  //   '**/item/**/*.png',
  //   '**/some-texture.png',
  // ],
  // Threshold everything, but exclude specific images:
  // thresholdables: [
  //   '**/*.png',
  //   '!**/some-texture.png',
  //   '!**/some-directory/**/*.png',
  // ],
  // Disable thresholding altogether:
  // thresholdables: [],
  thresholdables: ['**/*item*/**/*.png'],
  /**
   * Compressables
   * -------------
   * Images to pass through lossless image compression. If you have issues with specific images as a result of
   * compression, then add them to this list.
   */
  compressables: ['**/*.png'],
};
