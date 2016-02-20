#!/bin/bash
cd -- "$(dirname "$0")"
printf "Generating size packs + zipping up...\n"

# Run zip task
npm run makezips

printf "\nComplete!\n"
read -p "Press [Enter] to close."
