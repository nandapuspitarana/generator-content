#!/bin/bash
# 02_extract_vq.sh - Fish-Speech VQ Token Extraction
set -e

DATA_DIR="${1:-data/Speaker_Indonesia}"
CODEC_CHECKPOINT="${2:-checkpoints/openaudio-s1-mini/codec.pth}"

echo "=================================================="
echo "🎧 Extracting VQ semantic tokens from: $DATA_DIR"
echo "=================================================="

python tools/vqgan/extract_vq.py "$DATA_DIR" \
    --num-workers 1 \
    --batch-size 4 \
    --config-name "modded_dac_vq" \
    --checkpoint-path "$CODEC_CHECKPOINT"

echo "✅ Semantic VQ extraction complete!"
