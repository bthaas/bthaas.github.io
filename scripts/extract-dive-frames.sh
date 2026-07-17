#!/usr/bin/env bash
# Extracts the dive scroll-sequence frames from the source video.
# Source video lives in design-refs/video/ (gitignored via .git/info/exclude);
# the committed frames in public/frames/dive/ are the canonical asset.
#
# Frames 0-47 of the video are pillarboxed (Veo intro artifact) and skipped.
# The bottom 32px crop removes the "Veo" watermark (rows ~692-705 of 720).
set -euo pipefail

SOURCE="design-refs/video/camera-glides-into-water.mp4"
OUT_DIR="public/frames/dive"

mkdir -p "$OUT_DIR"
ffmpeg -i "$SOURCE" \
  -vf "select='gte(n,48)',crop=1280:688:0:0" \
  -fps_mode vfr -c:v libwebp -quality 72 -start_number 0 \
  "$OUT_DIR/frame_%03d.webp"

COUNT=$(ls "$OUT_DIR" | wc -l | tr -d ' ')
if [ "$COUNT" -ne 144 ]; then
  echo "Expected 144 frames, got $COUNT" >&2
  exit 1
fi
echo "Extracted $COUNT frames to $OUT_DIR"
