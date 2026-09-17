"""Build an integrated, portable review copy; originals and source remain intact.
The original WSS2 iframe still needs internet access. Offline QA deliberately
omits origin-dependent browser-history checks instead of pretending to test them.
"""
from pathlib import Path
import argparse,base64,json,re

def inline_site(root: Path, *, offline: bool=False, open_wss: bool=False) -> str:
    html=(root/'index.html').read_text()
    for path in re.findall(r'<link rel="stylesheet" href="([^"]+)"\s*/?>',html):
        html=re.sub(r'<link rel="stylesheet" href="'+re.escape(path)+r'"\s*/?>',lambda _: '<style>'+(root/path).read_text()+'</style>',html)
    files={}
    for path in (root/'wss/media').iterdir():
        if path.suffix in ('.webp','.mp4'):
            mime='video/mp4' if path.suffix=='.mp4' else 'image/webp'
            files[path.name]='data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
    html=html.replace('<script src="data.js"></script>','<script>window.WSS_ASSET_MAP='+json.dumps(files)+'</script><script src="data.js"></script>')
    # The production index intentionally gates desktop navigation away from mobile.
    dynamic=re.compile(r'<script>\s*if\(!window\.matchMedia\("\(max-width:699px\)"\)\.matches\)\{.*?navigationScript\.src="navigation\.js";.*?</script>',re.S)
    nav='' if offline else '<script>if(!window.matchMedia("(max-width:699px)").matches){'+(root/'navigation.js').read_text()+'}</script>'
    html=dynamic.sub(lambda _:nav,html)
    for path in re.findall(r'<script src="([^"]+)"></script>',html):
        code=(root/path).read_text()
        html=html.replace(f'<script src="{path}"></script>','<script data-media-base="https://offline.invalid/wss/media/">'+code.replace('</script>','<\\/script>')+'</script>')
    if open_wss:
        html=html.replace('</body>','<script>requestAnimationFrame(()=>{if(state==="index"){active=0;if(matchMedia("(max-width:699px)").matches){document.getElementById("mobileScanHit").click()}else{openProject()}}})</script></body>')
    return html

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);args=parser.parse_args()
    root=Path(__file__).resolve().parents[2]
    args.output.write_text(inline_site(root,open_wss=True));print(args.output,args.output.stat().st_size,'bytes')
