![Sphaxify logo](_sphaxify/images/logo.png)

# Sphaxify - an automated Minecraft texture pack compiler

A command-line tool that automates the boring resizing/zipping part of creating a Minecraft resource pack that no-one likes.

It takes a folder of source textures, then resizes, optimises, and removes transparent pixels from them. It then copies them into separate 512x, 256x, 128x... etc. folders, and optionally zips each folder up into a shareable texture pack zip.

The tool is highly configurable via a basic config file, [patch.config.toml](patch.config.toml).

## Features
**Automatically resizes all images to standard resource pack sizes.**
512x source images are copied, resized to 256x, 128x, 64x, and 32x, then saved into their own size pack directory.

This is fully configurable. Is your source only 128x? Want to only generate packs down to 64x? No problem. 👍

**Optimises generated PNGs losslessly, to ensure small filesizes.**
Ensures the patch takes up as little memory as possible when used in-game, for better FPS. 👍

**Removes translucent pixels from item texture edges.**
Ensures no texture flickering with Minecraft's graphics engine. This is configurable should certain textures need opting-in or -out, and is only applied to item textures by default.

**Zips up each generated pack with clear, descriptive filenames.**
E.g. `SphaxPatch_MyTexturePack_MC1.16.4_64x.zip`

**Comes with a 'watch' mode, allowing you to design and create packs on the fly.**
Any changes to `.png`, `.txt` or `.mcmeta` files will trigger a fresh generation of size packs

## How to use
1. **Install [Node JS](https://nodejs.org/en/) v14+**. It may work with earlier versions, but hasn't been tested on them.

2. **Download and unzip a [Sphaxify release](https://github.com/GrumpyPirate/Sphaxify/releases/latest).** Alternatively, clone this repo locally.

3. **Place your source images inside `source-designs/{MC_VERSION}/`, e.g. `source-designs/1.16.4/`.** Mimic how the textures would be laid out when used as a texture pack. A typical working layout would be:
    - `/source-designs/1.16.4/assets/some-incredible-mod/...`
    - `/source-designs/1.16.4/pack.mcmeta`
    - `/source-designs/1.16.4/pack.png`

    An example `1.16.4/` folder has been provided, along with a barebones `pack.mcmeta` and pack icon design that you're encouraged to customise.

4. **Customise the build options by editing [patch.config.toml](patch.config.toml)**. Worry not, each option has detailed instructions, and has been set up with the defaults expected of a 512x source patch.
    - If your source designs are a different size (e.g. 128x), then make sure you customise `initialSize` and `resizeLevels`!

**You now have 2 options for running the patch builder...**

### Option 1: For less tech-savvy users
**Simply double-click either `_MakePacks.command` (macOS), or `_MakePacks.bat` (Windows).** This will install everything Sphaxify needs to run, and then create the zipped-up texture packs for you. Generated texture packs will be inside the `size-packs` directory, ready to be shared. 🚀

### Option 2: For those comfortable with the command line
1. **Install Sphaxify's dependencies.** Open a terminal, browse to the `_sphaxify` directory, and run `npm install`.
2. **The following npm scripts are now available:**
    - **`npm run build`** - generates size packs
    - **`npm run zip`** - same as `build`, but also zips them up
    - **`npm run watch`** - will begin watching your `source-designs/` directory for any changes to texture files, generating size packs every time a change is made.
    - **`npm run clean`** - nukes the `size-packs/` directory. Handle with care! 🧨

**Note** - `build` and `zip` will likely to take a while when first run, especially for larger resource packs. Go and grab a coffee. ☕️

The console will show the progress of all processed images, and a system notification will appear when complete.

## Issues
Please report any issues encountered either via either via GitHub issues, or on the official [BDCraft Community Thread](http://bdcraft.net/community/pbdc-patches-discuss/sphaxify-automated-bdcraft-patch-builder-t5230.html).
