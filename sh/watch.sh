#!/bin/bash

rm -r dist
tsc-watch --onSuccess sh/rollup.sh --onFailure sh/rollup.sh