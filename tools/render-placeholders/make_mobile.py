"""Cria as variantes mobile (540 x 675) a partir dos frames desktop renderizados."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / "public" / "sequence"
for seq in ("spin", "bare", "closeup"):
    src_dir, dst_dir = ROOT / seq / "desktop", ROOT / seq / "mobile"
    dst_dir.mkdir(parents=True, exist_ok=True)
    for f in sorted(src_dir.glob("f*.webp")):
        im = Image.open(f).convert("RGBA").resize((540, 675), Image.LANCZOS)
        im.save(dst_dir / f.name, quality=76, method=6)
    print(seq, len(list(dst_dir.glob("f*.webp"))))
