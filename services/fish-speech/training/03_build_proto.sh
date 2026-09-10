#!/bin/bash
# 03_build_proto.sh - Fish-Speech Protobuf Dataset Builder
set -e

INPUT_DIR="${1:-data/Speaker_Indonesia}"
OUTPUT_DIR="${2:-data/protos}"

echo "=================================================="
echo "📦 Building Protobuf dataset from: $INPUT_DIR"
echo "=================================================="

python tools/llama/build_dataset.py \
    --input "$INPUT_DIR" \
    --output "$OUTPUT_DIR" \
    --text-extension .lab \
    --num-workers 4

echo "✅ Protobuf dataset built at: $OUTPUT_DIR"
