#!/bin/bash
printf "Generating size packs + zipping up...\n"

# Run zip task
npm run makezips

printf "\nComplete!\n"
read -p "Press [Enter] to close."
