#!/usr/bin/env bash
# record_desktop.sh
# Records the website on a desktop viewport (1920x1080) using ffmpeg.
# Prerequisite: ffmpeg must be installed and the site must be running locally.

URL="http://localhost:3000"
OUTPUT="site_desktop.mp4"

# Open the URL in the default browser (optional)
# xdg-open "$URL" &

# Give the user time to focus the browser window on the site
sleep 5

# Capture the entire screen (adjust "-i :0.0" if needed for your display)
ffmpeg -y -video_size 1920x1080 -framerate 30 -f x11grab -i :0.0+0,0 -c:v libx264 -preset veryfast -crf 23 -t 60 "$OUTPUT"

echo "Desktop recording saved to $OUTPUT"
