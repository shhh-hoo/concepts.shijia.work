#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./encode-media.sh /path/to/'WSS intro.mov' /path/to/'WSS2 Preview.MP4' ./media
# Experimental derivatives only; source assets are never overwritten.

WSS_SOURCE=${1:?WSS intro source required}
WSS2_SOURCE=${2:?WSS2 preview source required}
OUT=${3:-media}
mkdir -p "$OUT"

COMMON=(-an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -g 9 -keyint_min 9 -sc_threshold 0 -movflags +faststart)

ffmpeg -y -i "$WSS_SOURCE" -t 8.6 -vf 'scale=1280:720:flags=lanczos,fps=30' "${COMMON[@]}" "$OUT/wss-scrub.mp4"
ffmpeg -y -i "$WSS2_SOURCE" -vf 'scale=1280:720:flags=lanczos,fps=30' "${COMMON[@]}" "$OUT/wss2-scrub.mp4"

ffprobe -v error -select_streams v:0 -skip_frame nokey   -show_entries frame=best_effort_timestamp_time -of csv=p=0 "$OUT/wss-scrub.mp4"
ffprobe -v error -select_streams v:0 -skip_frame nokey   -show_entries frame=best_effort_timestamp_time -of csv=p=0 "$OUT/wss2-scrub.mp4"
