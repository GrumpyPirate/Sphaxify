![Sphaxify logo](logo.png)

# Sphaxify - an automated Minecraft texture pack compiler

A command-line tool that automates the boring resizing/zipping part of creating a Minecraft resource pack that no-one likes.

It takes a folder of source textures, then resizes, optimises, and removes transparent pixels from them. It then copies them into separate 512x, 256x, 128x... etc. folders, and optionally zips each folder up into a shareable texture pack zip.

The tool is highly configurable via a basic config file, `patch.config.ts`.

## Features
- **Automatically resizes all images to standard resource pack sizes.** 512x source images are copied, resized to 256x, 128x, 64x, and 32x, then saved into their own size pack directory.
    - This is fully configurable - is your source only 128x? Want to only generate packs down to 64x? No problem. 👍

- **Optimises generated PNGs losslessly, to ensure small filesizes.** Ensures the patch takes up as little memory as possible when used in-game, for better FPS. 👍

- **Removes translucent pixels from item texture edges.** Ensures no texture flickering with Minecraft's graphics engine.
    - This is configurable, should certain textures need opting-in or -out.

- **Zips up each generated pack with clear, descriptive filenames.** E.g. `SphaxPatch_MyTexturePack_MC1.16.4_64x.zip`

- **Comes with a 'watch' mode, allowing you to design and create packs on the fly.** Any changes to `.png`, `.txt` or `.mcmeta` files will trigger a fresh generation of size packs


## How to use
1. **Install [Node JS](https://nodejs.org/en/) v14+**. It may work with earlier versions, but hasn't been tested on them.

2. **Download and unzip a [Sphaxify release](https://github.com/GrumpyPirate/Sphaxify/releases/latest).** Alternatively, clone this repo locally.

3. **Place your source images inside `source-designs/{MC_VERSION}/`, e.g. `source-designs/1.16.4/`.** Mimic how the textures would be laid out when used as a texture pack. A typical working layout would be:
    - `/source-designs/1.16.4/assets/some-incredible-mod/...`
    - `/source-designs/1.16.4/pack.mcmeta`
    - `/source-designs/1.16.4/pack.png`

    An example `1.16.4/` folder has been provided, along with a barebones `pack.mcmeta` and pack icon design that you're encouraged to customise.

4. **Customise the build options by editing `patch.config.ts`**. Each option has detailed instructions.

**You now have 2 options for running the patch builder...**

### Option 1: For less tech-savvy users
**Simply double-click either `_MakePacks.command` (macOS), or `_MakePacks.bat` (Windows).** This will install everything Sphaxify needs to run, and then create the zipped-up texture packs for you. Generated texture packs will be inside the `size-packs` directory. 🎉

### Option 2: For those comfortable with the command line
1. **Install Sphaxify's dependencies.** Open a terminal and run `npm install` in the Sphaxify directory.
2. The following npm scripts are now available:
    - **`npm run build`** - generates size packs
    - **`npm run zip`** - same as `build`, but also zips them up
    - **`npm run watch`** - will begin watching your `source-designs/` directory for any changes to texture files, generating size packs every time a change is made.

    Or, if you don't want to use the command line, simply double-click either `_MakePacks.bat` (Windows) or `_MakePacks.sh` (Mac OSX/Linux) to make everything.

**Note** - `build` and `zip` will likely to take a while when first run, depending on the size of your texture pack. Go and grab a coffee. ☕️

The console will show the progress of all processed images, and a system notification will appear when complete.

## Issues
Please report any issues encountered either via either via GitHub issues, or on the official [BDCraft Community Thread](http://bdcraft.net/community/pbdc-patches-discuss/sphaxify-automated-bdcraft-patch-builder-t5230.html).
