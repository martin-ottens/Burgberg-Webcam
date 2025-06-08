#!/usr/bin/python3

import uvicorn
import argparse
import logging
import json

from os.path import relpath
from PIL import Image, ImageFont, ImageDraw
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()
output_dir: Path = None
archive_dir: Path = None
logo = None
font = None
logger = logging.getLogger(__name__)

@app.post("/ingest")
async def ingest_image(file: UploadFile = File(...)):
    global output_dir, logo, font, archive_dir

    if file is None:
        raise HTTPException(status_code=400, detail="Ingestor needs file post value")

    if file.content_type != "image/png":
        raise HTTPException(status_code=400, detail="Ingestor expects PNG images")
    
    try:
        dt = datetime.now()
        seconds = ((dt.second // 10) + 1) * 10
        if seconds >= 60:
            dt = dt + timedelta(minutes=1)
            seconds = 0
        dt = dt.replace(second=seconds, microsecond=0)

        target = output_dir / f"{dt.year}" / f"{dt.month:02d}" / f"{dt.day:02d}" / f"{dt.hour:02d}"
        target.mkdir(parents=True, exist_ok=True)

        filename = f"{dt.strftime('%Y_%m_%d-%H_%M_%S')}.webp"
        fullpath = target / filename

        image = Image.open(file.file).convert("RGBA")

        if archive_dir is not None:
            archive_target = archive_dir / f"{dt.year}" / f"{dt.month:02d}" / f"{dt.day:02d}" / f"{dt.hour:02d}"
            archive_target.mkdir(parents=True, exist_ok=True)
            archive_fullpath = archive_target / filename

            if not archive_fullpath.exists():
                image.save(archive_fullpath, "WEBP")

        if fullpath.exists():
            logger.warning(f"Image '{fullpath}' already exist")
            return {"status": "skipped", "old_path": str(fullpath)}

        image.paste(logo, (10, 10), mask=logo)

        draw = ImageDraw.Draw(image)
        datestr = dt.strftime("bergcam.de   %d.%m.%Y %H:%M:%S")
        textwidth = draw.textlength(datestr, font=font)

        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle(((image.width - textwidth - 20, 0), (image.width, 40 + 10)), fill=(0, 0, 0, 128))
        overlay_draw.text((image.width - textwidth - 10, 0), datestr, (255, 255, 255), font=font)

        image = Image.alpha_composite(image, overlay)
        image = image.convert("RGB")
        image.save(fullpath, "WEBP")

        with open(output_dir / "latest.json", "w") as handle:
            json.dump({"latest": str(relpath(fullpath, output_dir))}, handle)

        oldest_dir = output_dir / "oldest.json"
        if not oldest_dir.exists():
            with open (oldest_dir, "w") as handle:
                json.dump({"oldest": str(relpath(fullpath, output_dir))}, handle)

        logger.info(f"new Image saved to '{fullpath}'")
        return {"status": "success", "saved_to": str(fullpath)}
    except Exception as ex:
        logger.error(f"Unable to save image:", ex)
        raise HTTPException(status_code=500, detail=str(ex))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--port", help="Listen port", required=True, type=int)
    parser.add_argument("-l", "--host", help="Listen host", default="0.0.0.0", type=str)
    parser.add_argument("-o", "--out", help="Output base directory", required=True, type=str)
    parser.add_argument("-a", "--archive", help="Archive output path", 
                        required=False, type=str, default=None)
    args = parser.parse_args()

    output_dir = Path(args.out)
    if not output_dir.exists():
        raise Exception(f"Output directory '{output_dir}' does not exist!")
    
    if args.archive is not None:
        archive_dir = Path(args.archive)
        if not archive_dir.exists():
            raise Exception(f"Archive directory '{archive_dir}' does not exist!")
    
    logo = Image.open("./assets/logo.png")
    (width, height) = (logo.width // 4, logo.height // 4)
    logo = logo.resize((width, height))

    font = ImageFont.truetype("./assets/font.ttf", 40)

    uvicorn.run(app, host=args.host, port=args.port)

