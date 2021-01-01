#!/bin/zsh
cd -- "$(dirname "$0")/_sphaxify"
printf "Generating size packs + zipping up...\n"

# Install node dependencies
npm i

# Run zip task
npm run zip

printf "\nComplete!\n"
read "?Press [Enter] to close."
