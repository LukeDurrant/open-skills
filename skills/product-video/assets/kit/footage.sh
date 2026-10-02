#!/usr/bin/env bash
# Footage helpers for product videos. Needs ffmpeg.
#
#   footage.sh sheet <movie-or-frames-dir> <out.jpg> [every-N-frames=8] [columns=16]
#       A contact sheet with a number on every tile, to find where each
#       gesture starts and ends. For a movie the number is seconds; for a
#       frames directory it is the tile index (frame = index x N).
#
#   footage.sh cut <movie> <frames-dir> <start-seconds> <length-seconds> [width=804]
#       Cuts part of a recording (simulator .mov, screen capture) into the
#       30 fps JPEG sequence a composition plays: <frames-dir>/0001.jpg ...
set -euo pipefail
command -v ffmpeg >/dev/null || { echo "ffmpeg is not on PATH (brew install ffmpeg)" >&2; exit 1; }

case "${1:-}" in
  sheet)
    src="${2:?movie or frames directory}"; out="${3:?output jpg}"; every="${4:-8}"; cols="${5:-16}"
    if [[ -d "$src" ]]; then
      count=$(ls "$src" | wc -l | tr -d ' ')
      rows=$(( (count / every + cols) / cols ))
      ffmpeg -loglevel error -y -framerate 30 -i "$src/%04d.jpg" \
        -vf "select='not(mod(n\,$every))',scale=150:-1,drawtext=text='%{n}':fontsize=22:fontcolor=red:box=1:boxcolor=white:x=4:y=44,tile=${cols}x${rows}" \
        -frames:v 1 -fps_mode vfr "$out"
    else
      seconds=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
      rows=$(python3 -c "import math; print(max(1, math.ceil($seconds / $cols)))")
      ffmpeg -loglevel error -y -i "$src" \
        -vf "fps=1,scale=170:-1,drawtext=text='%{pts\:flt}':fontsize=20:fontcolor=red:box=1:boxcolor=white:x=4:y=50,tile=${cols}x${rows}" \
        -frames:v 1 "$out"
    fi
    echo "$out"
    ;;
  cut)
    movie="${2:?movie}"; dest="${3:?frames directory}"; start="${4:?start seconds}"; length="${5:?length seconds}"; width="${6:-804}"
    rm -rf "$dest" && mkdir -p "$dest"
    ffmpeg -loglevel error -ss "$start" -t "$length" -i "$movie" \
      -vf "fps=30,scale=${width}:-2:flags=lanczos" -q:v 3 "$dest/%04d.jpg"
    echo "$dest: $(ls "$dest" | wc -l | tr -d ' ') frames"
    ;;
  *)
    sed -n '2,12p' "$0"; exit 2 ;;
esac
