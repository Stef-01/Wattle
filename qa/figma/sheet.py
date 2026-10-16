"""Contact sheet of a walk's screenshots with PIL (the walk itself uses sharp when installed).

    python qa/figma/sheet.py [walk-dir] [out.png]      default: qa/figma/walk → walk/sheet.png

Six frames per row, each 215x466 on #1b1b1b, in walk.json order.
"""
import json
import sys
from pathlib import Path

from PIL import Image

walk_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "qa/figma/walk")
out = Path(sys.argv[2]) if len(sys.argv) > 2 else walk_dir / "sheet.png"
shots = json.loads((walk_dir / "walk.json").read_text(encoding="utf-8"))
W, H, COLS, GAP = 215, 466, 6, 10
rows = -(-len(shots) // COLS)
sheet = Image.new("RGB", (COLS * (W + GAP) + GAP, rows * (H + GAP) + GAP), "#1b1b1b")
for i, shot in enumerate(shots):
    file = Path(shot["file"])
    if not file.is_absolute():
        file = walk_dir / file.name
    frame = Image.open(file).convert("RGB").resize((W, H), Image.LANCZOS)
    sheet.paste(frame, ((i % COLS) * (W + GAP) + GAP, (i // COLS) * (H + GAP) + GAP))
sheet.save(out)
print(f"{out}: {len(shots)} frames")
