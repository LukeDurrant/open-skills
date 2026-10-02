#!/usr/bin/env bash
# Records each "shot" UI test as its own iOS Simulator movie.
#
#   capture-ios.sh --project App.xcodeproj | --workspace App.xcworkspace
#                  --scheme <scheme> --tests "<UITestTarget>/<TestClass>"
#                  --out <dir> [--device "iPhone 17"] [--derived-data dir] [shot ...]
#
# Writes <out>/<shot>.mov for every `func test_…()` named on the command
# line. Each movie starts before the app launches and ends after the test,
# so trim the ends in the edit (footage.sh cut). The shots must launch the
# app on fixture data themselves; this script only records.
#
# One simulator, one recording at a time: do not run two copies in parallel.
set -euo pipefail
container=(); scheme=""; tests=""; out=""; device="iPhone 17"; derived=""; shots=()
while (( $# )); do
  case "$1" in
    --project) container=(-project "$2"); shift 2 ;;
    --workspace) container=(-workspace "$2"); shift 2 ;;
    --scheme) scheme="$2"; shift 2 ;;
    --tests) tests="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --device) device="$2"; shift 2 ;;
    --derived-data) derived="$2"; shift 2 ;;
    --*) echo "unknown option $1" >&2; exit 2 ;;
    *) shots+=("$1"); shift ;;
  esac
done
if (( ${#container[@]} == 0 )) || [[ -z "$scheme" || -z "$tests" || -z "$out" ]] || (( ${#shots[@]} == 0 )); then
  sed -n '2,13p' "$0"; exit 2
fi
mkdir -p "$out"; out="$(cd "$out" && pwd)"
derived="${derived:-$out/.derived-data}"

udid=$(xcrun simctl list devices available -j | DEVICE="$device" python3 -c '
import json, os, sys
runtimes = json.load(sys.stdin)["devices"]
found = [d for devices in runtimes.values() for d in devices if d["name"] == os.environ["DEVICE"]]
found.sort(key=lambda d: d["state"] != "Booted")
print(found[0]["udid"] if found else "")')
[[ -n "$udid" ]] || { echo "No simulator named \"$device\" (xcrun simctl list devices available)." >&2; exit 1; }

xcrun simctl boot "$udid" 2>/dev/null || true
xcrun simctl bootstatus "$udid" -b > /dev/null
# A clean, familiar status bar: full signal, full battery, 9:41.
xcrun simctl status_bar "$udid" override --time "9:41" \
  --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 \
  --batteryState charged --batteryLevel 100

xcodebuild build-for-testing "${container[@]}" -scheme "$scheme" \
  -destination "id=$udid" -derivedDataPath "$derived" -quiet

for shot in "${shots[@]}"; do
  echo "▸ $shot"
  xcrun simctl io "$udid" recordVideo --codec h264 --force "$out/$shot.mov" &
  recorder=$!
  sleep 2
  status=0
  xcodebuild test-without-building "${container[@]}" -scheme "$scheme" \
    -destination "id=$udid" -derivedDataPath "$derived" \
    -only-testing:"$tests/$shot" -quiet || status=$?
  kill -INT "$recorder"
  wait "$recorder" 2>/dev/null || true
  (( status == 0 )) || echo "  $shot failed (exit $status); its movie may be incomplete" >&2
done

xcrun simctl status_bar "$udid" clear
ls -1 "$out"/*.mov
