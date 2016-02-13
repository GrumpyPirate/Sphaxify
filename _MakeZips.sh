#!/bin/bash
# Install global packages
which gulp || npm install -g gulp gulp-cli || sudo npm install -g gulp gulp-cli

# Install local packages
npm install

# Run zip task
gulp makeZips
