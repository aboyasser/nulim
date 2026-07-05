#!/usr/bin/env bash
# record_mobile.sh
# Records the website on a mobile viewport (375x667) using ffmpeg.
# Prerequisite: ffmpeg must be installed and the site must be running locally.

URL="http://localhost:3000"
OUTPUT="site_mobile.mp4"

# Open the URL in the default browser (optional)
# xdg-open "$URL" &

# Give the user time to focus the browser window on the site (mobile emulation may be done manually)
sleep 5

# Capture a region of the screen that corresponds to mobile size.
# Adjust the offset (e.g., +0,0) to match the window position.
ffmpeg -y -video_size 375x667 -framerate 30 -f x11grab -i :0.0+0,0 -c:v libx264 -preset veryfast -crf 23 -t 60 "$OUTPUT"

echo "Mobile recording saved to $OUTPUT"
