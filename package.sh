#!/bin/bash

APP_VERSION=$(node -p -e "require('./package.json').version")

PACKAGE_NAME=tracker-data-sync-script-"$APP_VERSION".zip

cp package.json .env.example build/app/
cd build/app || return

zip -r "$PACKAGE_NAME" .

mv "$PACKAGE_NAME" ../

cd ../../
