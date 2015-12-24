Sphax Community Patch - Blank Template
======================================
This small collection of files and directories aims to make the process of generating Sphax Patch size packs quick, effortless and hassle-free.

It uses [Gulp JS](http://gulpjs.com/) to automate the otherwise-lengthy and laborious manual process of creating multiple zips of resized, optimised PNG images.

Features
--------
- Handles resizing of all source 512x images to **256x**, **128x**, **64x**, and **32x** (based on % size of original, and configurable)
-  Optimise generated PNGs losslessly to ensure small filesizes
- Saves processed images to neatly-named directories - e.g. dist/**1.7.10**/**128x**/assets/**(modname)**/...
- Zips up each generated pack and names appropriately - e.g.: `[128x] [1.7.10] Sphax Patch - ModName.zip`
- Watches your `src/` directory for any changes to .PNG, .TXT and .MCMETA, and auto-runs the resize/optimise/zip tasks


How to Install
--------------
1. Install [Node JS](https://nodejs.org/en/) latest (required for *Gulp*)
2. Install both [ImageMagick](http://www.imagemagick.org/script/binary-releases.php) and [GraphicsMagick](http://www.graphicsmagick.org/download.html) - for simplicity's sake, choose the Q16 versions
3. Open a terminal,
