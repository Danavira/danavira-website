"""Build the font used only for Open Graph image generation.

Never served to browsers: astro-og-canvas renders with CanvasKit, which has no
system fonts, so Japanese titles need a CJK font at build time. This pins Noto
Sans JP to a Bold instance and subsets it to Latin, punctuation, kana and the
JIS X 0208 kanji set (levels 1 and 2), which covers everyday Japanese text.

Usage (writes src/assets/fonts/og-noto-sans-jp-bold.ttf):
    uv run --with fonttools python -I scripts/build-og-font.py /path/to/NotoSansJP[wght].ttf
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer


def jis_x_0208_chars() -> set[str]:
    chars = set()
    for hi in range(0xA1, 0xFF):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("euc_jp"))
            except UnicodeDecodeError:
                pass
    return chars


def main(src: str) -> None:
    out = Path(__file__).resolve().parent.parent / "src/assets/fonts/og-noto-sans-jp-bold.ttf"
    font = TTFont(src)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": 700})

    codepoints = {ord(c) for c in jis_x_0208_chars()}
    codepoints |= set(range(0x20, 0x7F))  # Basic Latin
    codepoints |= set(range(0xA0, 0x180))  # Latin-1 and Latin Extended-A
    codepoints |= set(range(0x2010, 0x2070))  # General punctuation
    codepoints |= set(range(0x3000, 0x3100))  # CJK punctuation, hiragana, katakana
    codepoints |= set(range(0xFF00, 0xFFF0))  # Full-width forms

    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    font.save(out)
    print(f"wrote {out} ({out.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main(sys.argv[1])
