![Sphaxify logo](logo.png)

Sphaxify - an Automated [BDCraft](http://bdcraft.net/community/) Community Patch Builder
================================================================================
This is a simple [Gulp](http://gulpjs.com/) script for patch artists to use when creating BDCraft texture packs, automating the boring resizing/zipping part that no-one likes.

It takes a folder of source images, then resizes/optimises/removes transparent pixels from everything into separate 512x, 256x, 128x... etc. folders, then zips each one up into neatly-named files.

__Everything is configurable.__


Features
--------------------------------------------------------------------------------
- **Automatically resizes all images as needed**
    - Source **512x** images are resized to **256x**, **128x**, **64x**, and **32x** into their own directories
    - This is fully configurable - is your source only 128x? Want to only generate packs down to 64x? _No problem._

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

- **Allows certain images to be excluded from resizing/transparent pixel removal**
    - Useful for troublesome images that need to be kept the same size (hello, GUIs) or need transparency (some fluid textures)
    - GUIs are excluded by default

- **Can watch your `source-designs/` directory for any changes while you work, to auto-regenerate packs on-the-fly**
    - Any changes to `.png`, `.txt` or `.mcmeta` files will trigger a fresh generation of size packs


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
- **Alternatively, double-click `_Install.bat` (Windows) or `_Install.sh` (Mac OSX/Linux)**
- **When complete, Sphaxify is ready to use.**


How to use
--------------------------------------------------------------------------------
1. **Place your source images inside `source-designs/{MC_VERSION}/`, e.g. `source-designs/1.7.10/`**
    - Mimic how the textures would be laid out when used as a texture pack. A typical working layout would be
        - `My Sphax Texture Project/source-designs/1.7.10/assets/someincrediblemod/textures/...`
        - `My Sphax Texture Project/source-designs/1.7.10/pack.mcmeta`
        - `My Sphax Texture Project/source-designs/1.7.10/pack.png`
    - An example `1.7.10/` folder has been provided, along with a barebones `pack.mcmeta` and `pack.png/psd`

2. **Customise the build options by opening `Gulpfile.js` in your favourite text editor.** You'll see some variables at the top of the file - customise these to how you want your patch to be built and named:
    - **Set `patchName`** to whatever you'd like your generated .zip files to be named
    - **Set `initialSize`** to the resolution of your source images (default is 512)
    - **Set `resizeLevels`** to however many times you want the patch to be downsized
    - **Add to `resizeables`** any images you don't want resized
    - **Add to `thresholdables`** any images you need to keep their transparency
    - **Optional**: If you'd like to specify the location of your source images (and where they'll be generated), edit `paths.src/dest` - otherwise, leave as default.

3. **Ready! You can now run any of the following from a terminal/command prompt within the folder:**
    - **`npm run optimise`** - generates size packs into `size-packs/`
    - **`npm run makezips`** - runs optimise, then zips up each size pack in `size-packs/`
    - **`npm run watch`** - will begin watching your `source-designs/` directory for any changes to `.png`, `.txt` or `.mcmeta` files, and will run the optimise only on images newer than the equivalents currently in `size-packs/`. Stop watching at any time by hitting `CTRL+C`

4. **Or, if you don't want to use the command line**
    - simply double-click either `_MakePacks.bat` (Windows) or `_MakePacks.sh` (Mac OSX/Linux) to make everything.

**Note** - `optimise` and `makezips` are likely to take a while when first run, depending on the size of your texture pack - go and grab a coffee. The console will show the progress of all processed images, and a system notification will appear when complete.


Issues
--------------------------------------------------------------------------------
This is a young project, please report any issues encountered either via either via GitHub issues, or on the official [BDCraft Community Thread](http://bdcraft.net/community/pbdc-patches-discuss/sphaxify-automated-bdcraft-patch-builder-t5230.html) and they'll be fixed as soon as possible.
