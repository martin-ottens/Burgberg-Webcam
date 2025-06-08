#!/usr/bin/python3

import sys
import json
import subprocess
import time
import requests

from PIL import Image
from pathlib import Path
from datetime import datetime, timedelta


def save_image_to_storage(imagepath, targetpath) -> bool:
    dt = datetime.now()
    seconds = ((dt.second // 10) + 1) * 10
    if seconds >= 60:
        dt = dt + timedelta(minutes=1)
        seconds = 0
    dt = dt.replace(second=seconds, microsecond=0)

    target = Path(targetpath) / f"{dt.year}" / f"{dt.month:02d}" / f"{dt.day:02d}" / f"{dt.hour:02d}"
    target.mkdir(parents=True, exist_ok=True)

    filename = f"{dt.strftime('%Y_%m_%d-%H_%M_%S')}.webp"
    fullpath = target / filename

    if fullpath.exists():
        print(f"Image '{fullpath}' already exist",
              file=sys.stderr, flush=True)
        return True

    print(f"Saving image to local storage: '{fullpath}'",
          file=sys.stderr, flush=True)
    
    image = Image.open(imagepath)
    image.save(fullpath, "WEBP")
    return True

def run_capture(command) -> bool:
    proc = subprocess.run(command, capture_output=False, shell=False)
    if proc.returncode != 0:
        print(f"Capture command failed with rc {proc.returncode}.", 
              file=sys.stderr, flush=True)
        return False
    else:
        return True


def ingest_image(filepath, ingest_url, encoding, timeout) -> bool:
    with open(filepath, "rb") as handle:
        files = {"file": (f"capture.{encoding}", handle, f"image/{encoding}")}
        response = requests.post(ingest_url, files=files, timeout=timeout)

    if response.status_code != 200:
        print(f"Unable to upload: Status was {response.status_code}: {response.text}")
        return False
    else:
        return True


def main(config) -> None:
    tmpfile_path = f'{config["tmpfile"]}.{config["encoding"]}'

    command = ["/usr/bin/rpicam-still", "--immediate", "--nopreview"]
    command.extend(["--width", str(config["width"])])
    command.extend(["--height", str(config["height"])])
    command.extend(["--encoding", config["encoding"]])
    command.extend(["--awb", config["white_balance"]])
    command.extend(["--output", tmpfile_path])

    for flag in config["additional_capture_flags"].split(" "):
        command.append(flag)

    while True:
        started = time.time()
        try:
            if run_capture(command):
                if not ingest_image(tmpfile_path, config["ingest_url"], 
                             config["encoding"], config["ingest_timeout"]):
                    save_image_to_storage(tmpfile_path, config["storage_base"])

        except Exception as ex:
            print(f"Unable to capture or upload: {ex}",
                  file=sys.stderr, flush=True)

        took = time.time() - started
        print(f"Capture done and uploaded, tool {took:2f}s.")
        time.sleep(max(0, config["interval_seconds"] - took))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <config>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1], "r") as handle:
        config = json.load(handle)

    main(config)
