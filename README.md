Sphaxify - a [BDCraft](http://bdcraft.net/community/) Community Patch Builder (v1.0.0)
================================================================================
This set of build tools aims to make the process of generating BDCraft Patch size packs as quick and hassle-free as possible, so that patch artists can focus their creative energy on *actual texturing* rather than mind-numbing asset organisation (zzz).

It uses [the Node.js package 'Gulp'](http://gulpjs.com/) to automate the otherwise-laborious manual process of creating multiple zips of resized, optimised PNG images.

It's designed to work on a set of 512x images as its source, but can be configured to work from any base size.

**The setup and usage has been kept as simple as possible, but there will be a small amount of installation, configuration and command line use.**

**A couple of basic executable files are included for those not comfortable with using the command line.**


Features
--------------------------------------------------------------------------------
- **Automatically resizes all images as needed**
    - Source **512x** images are resized to **256x**, **128x**, **64x**, and **32x** into their own directories
    - This is fully configurable - is your source only 128x? Want to only generate packs down to 64x? *No problem.*
- **Optimises generated PNGs losslessly to ensure small filesizes**
    - Ensures the patch uses as little VRAM as possible, for better system performance on users' machines
- **Removes any semi-transparent pixels from texture edges**
    - Ensures no texture flickering with Minecraft's graphics engine
    - Uses an 'either-or' method of setting pixel colour intensity - pixels below 50% get removed, above 50% get converted to 100% intensity
- **Saves processed images to separate, neatly-named directories**
    - The build system will generate separate directories for each set of processed files, leaving the source images untouched
    - This allows generated packs to be chucked away and simply regenerated whenever needed without worry
- **Zips up each generated pack with nice, standardised filenames**
    - E.g. `[128x] [1.7.10] Sphax Patch - SomeIncredibleMod.zip`
    - *Fully customisable!*
- **Allows certain images to be exempt from resizing/optimisation/thresholding**
    - Useful for troublesome images that need to be kept 24bit, need to be kept the same size (hello, GUIs) or need transparency (some fluid textures)
- **Can watch your `src/` directory for any changes while you work, to auto-regenerate packs on-the-fly**
    - Any changes to `.png`, `.txt` or `.mcmeta` files will trigger a fresh generation of size packs
    - Allows patch artists to keep creative, letting your machine do the grunt work


How to Install
--------------------------------------------------------------------------------
The build system is run using the command line (or via the included double-clickables), but first needs a few things on your system in order to work. Namely:
    - [Node JS](https://nodejs.org/en/)
    - [Gulp](http://gulpjs.com/)
    - [ImageMagick](http://www.imagemagick.org/script/binary-releases.php#windows) and [GraphicsMagick](http://www.graphicsmagick.org/download.html)

### Windows ###
1. **Install [Node JS](https://nodejs.org/en/) latest**
    - Ensure all options are checked when installing, especially '*Add Node to system PATH*'
2. **Install the graphic processing libraries [ImageMagick](http://www.imagemagick.org/script/binary-releases.php#windows) and [GraphicsMagick](http://www.graphicsmagick.org/download.html)**
    - Choose the recommended Q16 version applicable for your system (x86/x64)
    - You may need to grab GraphicsMagick from [the sourceforge page](https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/), as the official FTP is often broken
3. **Install Gulp via NPM (comes with Node)**
    - Open a command prompt - hit the WIN key, type `cmd`, hit `Enter`
    - `npm install --global gulp gulp-cli`

### Mac OSX ###
1. **Open a terminal anywhere; install Command Line Tools for Xcode**
    - `xcode-select --install`
    - Needed to build/run some Node packages
2. **Install [Homebrew](http://brew.sh/)**
    - Allows Linux-like simple package installation
3. **Ensure Homebrew is up to date, and ready to install brew packages**
    - `brew update && brew doctor`
4. **Install Node.js, ImageMagick, and GraphicsMagick via Homebrew**
    - `brew install node imagemagick graphicsmagick`
5. **Install Gulp via NPM (comes with Node)**
    - `npm install --global gulp gulp-cli`

### All OSes ###

- **Download and unzip a [Release of Sphaxify](https://github.com/GrumpyPirate/Sphaxify/releases/latest)**
    - Or alternatively, `git clone` this project into whatever directory you like
- **Open a terminal/command prompt, `cd` into the folder**
    - Windows shortcut - open the folder in the file explorer, type `cmd` in the explorer address bar and hit `Enter`
- **Install the local Node packages required by the build tools**
    - `npm install`
    - If you see a warning along the lines of: `npm WARN enoent ENOENT: no such file or directory, open (current dir)\package.json'`, then you aren't in the correct directory. Ensure you `cd` to the directory containing both `package.json` and `Gulpfile.js`.


How to use
--------------------------------------------------------------------------------
- **Place your source images inside `src/{MC_VERSION}/`, e.g. `src/1.7.10/`**
    - Mimic how the textures would be laid out when used as a texture pack. A typical working layout would be
    `My Sphax Texture Project/src/1.7.10/assets/someincrediblemod/textures/...`
    `My Sphax Texture Project/src/1.7.10/pack.mcmeta`
    `My Sphax Texture Project/src/1.7.10/pack.png`

- **Customise the build options by opening `Gulpfile.js` in your favourite text editor.** You'll see some variables at the top of the file - customise these to how you want your patch to be built and named:
    - Set `patchName` to whatever you'd like your generated .zip files to be named
    - Set `initialSize` to the resolution of your source images (default is 512)
    - Set `resizeLevels` to however many times you want the patch to be downsized
    - If you'd like to specify where your source images live, edit the paths.src/dest - otherwise, leave these as default.

- **Customise the included `pack.mcmeta` and `pack.psd`**
    - Give your patch some flair, let the world know who you are

- **From a terminal/command prompt in the project directory (same level as Gulpfile.js):**
    - `gulp optimise` - generates size packs into `dist/`
        - Likely to take a while when first run, depending on the size of your texture pack - go and grab a coffee
        - A system notification will appear when complete
    - `gulp makeZips` - runs optimise, then zips up each size pack in `dist/`
    - `gulp` - will begin watching your `src/` directory for any changes to `.png`, `.txt` or `.mcmeta` files, and will run the optimise only on images newer than the equivalents currently in `dist/`. Stop watching at any time by hitting `CTRL+C`


Current limitations
--------------------------------------------------------------------------------
- **Some mods don't play well with images that have been passed through OptiPNG, particularly images that have had their bit depth reduced to PNG-8 from PNG-24**
    - Test how your texture pack works in-game to see if any textures don't look quite right. For any such cases, add the texture's filename to the `filterImagemin` list in `Gulpfile.js` (around line 128~)
- To prevent certain images from being resized (GUIs are ignored by default), add the filenames to the `filterResizeables` list in `Gulpfile.js` (around line 134~)
- To prevent certain images from having their transparency removed - i.e. for a lot of flud textures with transparency - add their filenames to the `filterThresholdable` list in `Gulpfile.js` (around line 141~)

A much simpler method for customising these is planned for the future.

Issues
--------------------------------------------------------------------------------
This is a young project, please report any issues encountered and they'll be fixed as soon as possible.
