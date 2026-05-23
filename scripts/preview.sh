#!/bin/bash
if [ -z "$1" ]; then
  echo "Error: Need to provide a target domain (e.g. npm run preview usmailsupply.com)"
  exit 1
fi
TARGET=$1
OUTPUT_DIR="output/$TARGET"
if [ ! -d "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="packages/core/output/$TARGET"
  if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Error: Output directory not found for $TARGET"
    exit 1
  fi
fi
echo "Starting preview for $TARGET..."
cd "$OUTPUT_DIR" && npm install && npm run storybook
