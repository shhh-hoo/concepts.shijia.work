"""Create isolated synthetic media for functional CI, never for publication."""
from pathlib import Path
import argparse
import shutil
import subprocess
from PIL import Image, ImageDraw
parser=argparse.ArgumentParser();parser.add_argument('destination',type=Path);args=parser.parse_args()
source=Path(__file__).resolve().parents[2]
if args.destination.exists():raise SystemExit('Use an empty temporary directory; never overwrite publication assets.')
shutil.copytree(source,args.destination,ignore=shutil.ignore_patterns('.git','.github','__pycache__'))
media=args.destination/'wss/media';media.mkdir(parents=True,exist_ok=True)
images={
 'wss-stage':([1000,2400],6405/2666),'wss-signup':([800,1514],1514/750),
 'wss2-artwork':([800,1376],1376/768),'wss2-stage':([900,2000],4032/3024),
 'wss2-entrance':([600,1200],3665/4886),'wss2-game':([900,2000],3433/2289),
 'wss-intro-poster':([800,1600],16/9),'wss2-teaser-poster':([800,1600],16/9),
 'wss2-invitation-poster':([800,1600],3/2),'wss2-live':([900,1600],1200/810)
}
for stem,(widths,ratio) in images.items():
 for width in widths:
  image=Image.new('RGB',(width,round(width/ratio)),'#777777')
  ImageDraw.Draw(image).text((20,20),'SYNTHETIC TEST FIXTURE / NOT PROJECT ARTWORK',fill='white')
  image.save(media/f'{stem}-{width}.webp')
for stem,duration in [('wss-intro',8.6),('wss2-teaser',13.034),('wss2-invitation',49.216)]:
 subprocess.run(['ffmpeg','-y','-loglevel','error','-f','lavfi','-i','color=c=gray:s=320x180:r=30','-f','lavfi','-i','anullsrc=r=44100:cl=stereo','-t',str(duration),'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',str(media/f'{stem}.mp4')],check=True)
(args.destination/'CI-FIXTURES-NOT-FOR-PUBLICATION.txt').write_text('Synthetic functional-test assets. Do not deploy this directory.\n')
