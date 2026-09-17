"""Validate actual publication assets, never synthetic CI fixtures."""
from pathlib import Path
import hashlib
import json
import sys

media = Path(__file__).resolve().parents[1] / 'media'
manifest = json.loads((media / 'manifest.json').read_text())
errors = []
for name, expected in manifest['files'].items():
    path = media / name
    if not path.is_file():
        errors.append(f'Missing: {name}')
    elif path.stat().st_size != expected['bytes'] or hashlib.sha256(path.read_bytes()).hexdigest() != expected['sha256']:
        errors.append(f'Checksum mismatch: {name}')
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(manifest["files"])} real publication files match their checksums.')
