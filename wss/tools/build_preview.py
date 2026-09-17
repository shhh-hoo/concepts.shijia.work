"""Export the integrated site and real media as a portable HTML review copy."""
from pathlib import Path
import argparse
import importlib.util

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('checks', root / 'wss/tests/browser_checks.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
html = module.inline_site(root)
html = html.replace('</body>', '<script>if (!location.hash) { active=0; openProject(); }</script></body>')
args.output.write_text(html)
print(args.output, args.output.stat().st_size, 'bytes')
