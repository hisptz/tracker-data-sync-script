#!/bin/bash

APP_VERSION=$(node -p -e "require('./package.json').version")
APP_NAME=$(node -p -e "require('./package.json').pkgName")

PACKAGE_NAME=$APP_NAME-"$APP_VERSION".zip

rm -r bundle/

cp package.json .env.example dist/
cd dist/ || return

zip -r "$PACKAGE_NAME" .

mkdir ../bundle
mv "$PACKAGE_NAME" ../bundle

cd ../
