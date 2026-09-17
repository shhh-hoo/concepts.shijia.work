"""Create publication derivatives without modifying any Drive originals.
Usage: python wss/tools/prepare_media.py /path/to/downloaded/originals
"""
from pathlib import Path
from PIL import Image, ImageOps
import argparse
import concurrent.futures
import hashlib
import json
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / 'media'
out.mkdir(parents=True, exist_ok=True)
images = [
    ('WSS Stage setting.png', 'wss-stage', [1000, 2400]),
    ('WSS Calling for signups.png', 'wss-signup', [800, 1514]),
    ('WSS2 Main Theme Poster.png', 'wss2-artwork', [800, 1376]),
    ('WSS2 Stage Setting.jpeg.jpg', 'wss2-stage', [900, 2000]),
    ('WSS2 Front Gate.JPG', 'wss2-entrance', [600, 1200]),
    ('WSS2 Game View.JPG', 'wss2-game', [900, 2000]),
]
videos = [
    ('WSS intro.mov', 'wss-intro', 8.6, 1280, .5),
    ('WSS2 Preview.MP4', 'wss2-teaser', None, 1280, 5),
    ('WSS2 Calling for signups.MP4', 'wss2-invitation', None, 960, 7),
]
missing = [name for name, *_ in images + videos if not (args.source / name).is_file()]
if missing:
    raise SystemExit('Missing originals: ' + ', '.join(missing))
manifest = {'originals_unchanged': True, 'images': {}, 'videos': {}}
for name, stem, widths in images:
    with Image.open(args.source / name) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
    for width in widths:
        image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS).save(
            out / f'{stem}-{width}.webp', 'WEBP', quality=86, method=6
        )
    manifest['images'][stem] = {'source': name, 'dimensions': list(image.size), 'sizes': widths}

def encode(entry):
    name, stem, limit, width, poster_time = entry
    command = ['ffmpeg', '-v', 'error', '-i', str(args.source / name)]
    if limit:
        command += ['-t', str(limit)]
    command += ['-vf', f'scale={width}:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24',
                '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac', '-b:a', '128k',
                '-movflags', '+faststart', '-y', str(out / f'{stem}.mp4')]
    subprocess.run(command, check=True)
    temporary = out / f'{stem}-poster.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(poster_time), '-i', str(args.source / name),
                    '-frames:v', '1', '-vf', 'scale=1600:-2', '-y', str(temporary)], check=True)
    with Image.open(temporary) as original:
        image = original.convert('RGB')
    for poster_width in [800, 1600]:
        image.resize((poster_width, round(image.height * poster_width / image.width)), Image.Resampling.LANCZOS).save(
            out / f'{stem}-poster-{poster_width}.webp', 'WEBP', quality=86, method=6
        )
    temporary.unlink()
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height',
        '-of', 'json', str(out / f'{stem}.mp4'),
    ]))
    return stem, {'source': name, 'trim_end': limit, 'complete': limit is None, 'poster_time': poster_time, 'probe': probe}

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for stem, data in pool.map(encode, videos):
        manifest['videos'][stem] = data
        print('Encoded', stem, flush=True)
manifest['files'] = {
    path.name: {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    for path in sorted(out.iterdir()) if path.suffix in ['.webp', '.mp4']
}
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print('Publication files:', len(manifest['files']), '; bytes:', sum(item['bytes'] for item in manifest['files'].values()))
