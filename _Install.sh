#!/bin/bash
cd -- "$(dirname "$0")"
printf "Installng Sphaxify locally...\n"

# Install local packages
npm install

printf "\nSphaxify has finished installing. You can now run the commands listed in README.md to generate your packs.\n"
read -p "Press [Enter] to close."
