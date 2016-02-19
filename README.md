![Sphaxify](http://i63.tinypic.com/js0yu9.jpg)

Sphaxify - an Automated [BDCraft](http://bdcraft.net/community/) Community Patch Builder
================================================================================
This simple-to-use [Gulp](http://gulpjs.com/) build script aims to make the process of generating BDCraft Patch size packs as quick and hassle-free as possible, so that patch artists can focus their creative energy on *actual texturing* rather than mind-numbing asset organisation (zzz).


Features
--------------------------------------------------------------------------------
- **Automatically resizes all images as needed**
    - Source **512x** images are compiled to **512x**, **256x**, **128x**, **64x**, and **32x** into their own dedicated directories.
    - This is fully configurable - is your source only 128x? Want to only generate packs down to 64x? *No problem.*
- **Optimises generated PNGs losslessly to ensure small filesizes**
    - Passes all images through OptiPNG to ensure the patch uses as little VRAM as possible, for the best possible system performance on users' machines.
- **Removes any semi-transparent pixels from texture edges**
    - Ensures no texture flickering with Minecraft's awkward graphics engine.
    - Uses an 'either-or' method of setting pixel colour intensity - pixels below 50% get removed, above 50% get converted to 100% intensity.
- **Saves processed images to separate, neatly-named directories**
    - The script will generate separate directories for each set of processed files, leaving the source images untouched - allowing generated packs to be chucked away and simply regenerated whenever needed without worry.
- **Zips up each generated pack with clean, standardised filenames**
    - E.g. `[128x] [1.7.10] Sphax Patch - SomeIncredibleMod.zip`
- **Allows specific images to be skipped when resizing, optimising and thresholding**
    - Useful for troublesome images that need:
        - To be kept 24bit (non-indexed colour)
        - To be kept the same size (hello, GUIs)
        - Transparency (glass or fluid textures)
- **Can watch your `source-designs/` directory for any changes while you work, to auto-regenerate packs on-the-fly**
    - Any changes to `.png`, `.txt` or `.mcmeta` files will trigger a fresh generation of size packs
    - Allows patch artists to keep creative, letting your machine do the grunt work in the background


Requirements
--------------------------------------------------------------------------------
- [Node.js](https://nodejs.org/en/), [ImageMagick](http://www.imagemagick.org/script/binary-releases.php#windows) and [GraphicsMagick](http://www.graphicsmagick.org/download.html)


How to Install
--------------------------------------------------------------------------------
### 1. Get Node, GraphicsMagick and ImageMagick for your system ###
#### Windows ####
1. **Install [Node JS](https://nodejs.org/en/) latest**
2. **Install the graphic processing libraries [ImageMagick](http://www.imagemagick.org/script/binary-releases.php#windows) and [GraphicsMagick](http://www.graphicsmagick.org/download.html)**
    - Choose the recommended Q16 version
    - You may have to grab GraphicsMagick from [SourceForge](https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/) (sorry), as the FTP is often broken

#### Mac OSX ####
1. **Install [Homebrew](http://brew.sh/)**
    - Allows Linux-like simple package installation
2. **Ensure Homebrew is up to date, and ready to install brew packages**
    - `brew update && brew doctor`
3. **Install Node.js, ImageMagick, and GraphicsMagick via Homebrew**
    - `brew install node imagemagick graphicsmagick`

### 2. Grab a copy of Sphaxify ###
- **Download and unzip a [Release of Sphaxify](https://github.com/GrumpyPirate/Sphaxify/releases/latest)**
    - Alternatively, `git clone` this repo wherever

### 3. Install the local Node packages required by Sphaxify ###
- **Open a terminal/command prompt, browse (`cd`) to the Sphaxify folder**
    - A simple Windows shortcut: open the folder in the file explorer, type `cmd` in the explorer address bar and hit `Enter`. This'll open a command prompt in the directory
- **`npm install`**
- **When complete, Sphaxify is ready to use.**


How to use
--------------------------------------------------------------------------------
1. **Place your source images inside `source-designs/{MC_VERSION}/`, e.g. `source-designs/1.7.10/`**
    - Mimic how the textures would be laid out when used as a texture pack. A typical working layout would be
        - `My Sphax Texture Project/source-designs/1.7.10/assets/someincrediblemod/textures/...`
        - `My Sphax Texture Project/source-designs/1.7.10/pack.mcmeta`
        - `My Sphax Texture Project/source-designs/1.7.10/pack.png`
    - An example `1.7.10/` folder has been provided, along with a barebones `pack.mcmeta` and `pack.png/psd`

2. **Customise the builder options by opening `Gulpfile.js` in your favourite text editor.** You'll see some variables at the top of the file - customise these to how you want your patch to be built and named:
    - **Set `patchName`** to whatever you'd like your generated .zip files to be named
    - **Set `initialSize`** to the resolution of your source images (default is 512)
    - **Set `resizeLevels`** to however many times you want the patch to be downsized
    - **Optional**: If you'd like to specify the location of your source images (and where they'll be generated), edit `paths.source-designs/dest` - otherwise, leave as default.

3. **Ready! You can now run any of the following from a terminal/command prompt within the folder:**
    - **`npm run optimise`** - generates size packs into `size-packs/`
    - **`npm run makezips`** - runs optimise, then zips up each size pack in `size-packs/`
    - **`npm run watch`** - will begin watching your `source-designs/` directory for any changes to `.png`, `.txt` or `.mcmeta` files, and will run the optimise only on images newer than the equivalents currently in `size-packs/`. Stop watching at any time by hitting `CTRL+C`


**Note** - `optimise` and `makezips` are likely to take a while when first run, depending on the size of your texture pack - go and grab a coffee. The console will show the progress of all processed images, and a system notification will appear when complete.


Current limitations
--------------------------------------------------------------------------------
- **Some mods don't play well with images that have been passed through OptiPNG, particularly images that have had their bit depth reduced to PNG-8 from PNG-24**
    - Test how your texture pack works in-game to see if any textures don't look quite right. For any such cases, add the texture's filename to the `filterImagemin` list in `Gulpfile.js` (around line 128~). This will prevent these files from being passed through OptiPNG.
    - For example, **Mekanism** steel blocks, **Immersive Engineering** machine top/side, and **Railcraft** Quarried Stone all suffer from this issue, as their colour palettes end up getting indexed
- **To prevent certain images from being resized (GUIs are ignored by default)**: add the filenames to the `filterResizeables` list in `Gulpfile.js` (around line 134~)
- **To prevent certain images from having their transparency removed (e.g. fluids, glass)**:  add their filenames to the `filterThresholdable` list in `Gulpfile.js` (around line 141~)

A much simpler method for customising these is planned for the future.


Issues
--------------------------------------------------------------------------------
This is a young project, please report any issues encountered either via either via GitHub issues, or on the official [BDCraft Community Thread](http://bdcraft.net/community/pbdc-patches-discuss/sphaxify-automated-bdcraft-patch-builder-t5230.html) and they'll be fixed as soon as possible.
