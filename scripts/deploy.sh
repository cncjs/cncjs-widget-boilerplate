#!/usr/bin/env bash

if [ "$TRAVIS" = "true" ]; then
    git config --global user.email "cheton@gmail.com"
    git config --global user.name "Cheton Wu"
    ./node_modules/.bin/gh-pages \
        --silent \
        --repo https://$GITHUB_TOKEN@github.com/cncjs/cncjs-widget-boilerplate.git \
        --add \
        --dist dist
else
    ./node_modules/.bin/gh-pages --add --dist dist
fi
