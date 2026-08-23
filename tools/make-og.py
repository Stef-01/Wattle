"""Render the Wattle Technologies brand assets with Pillow.

Outputs assets/og.png (1200x630 social card) and assets/apple-touch-icon.png.
The card is the brand panel: a soft violet ground, the WATL wordmark set in a
Garamond and cropped by the lower edge, and a small underlined label.
"""
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630

GOLD = (233, 180, 76)
WHITE = (255, 255, 255)

# Serif for the wordmark. Garamond is the closest Windows face to Cormorant
# Garamond, which the site loads from Google Fonts.
SERIF = r"C:\Windows\Fonts\GARA.TTF"
SANS = r"C:\Windows\Fonts\segoeui.ttf"


def soft_ground(w, h):
    """Blobs painted small, scaled up and blurred — a mesh gradient."""
    sw, sh = w // 12, h // 12
    base = Image.new("RGB", (sw, sh), (196, 182, 224))
    d = ImageDraw.Draw(base)

    blobs = [
        (0.14, 0.16, 0.44, (226, 217, 245)),
        (0.86, 0.06, 0.36, (236, 229, 249)),
        (0.62, 1.00, 0.58, (104, 86, 152)),
        (0.02, 0.92, 0.42, (122, 104, 168)),
        (0.46, 0.44, 0.26, (183, 168, 217)),
        (1.04, 0.58, 0.36, (86, 71, 130)),
        (0.30, 0.70, 0.24, (150, 133, 194)),
    ]
    for fx, fy, fr, col in blobs:
        cx, cy, r = fx * sw, fy * sh, fr * sw
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

    img = base.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(38))
    return img


def add_grain(img, amount=4):
    """Low-amplitude luminance noise — keeps wide gradients from banding."""
    rnd = random.Random(11)
    px = img.load()
    for y in range(0, img.height, 2):
        for x in range(0, img.width, 2):
            n = rnd.randint(-amount, amount)
            r, g, b = px[x, y]
            v = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
            px[x, y] = v
            if x + 1 < img.width:
                px[x + 1, y] = v
            if y + 1 < img.height:
                px[x, y + 1] = v
                if x + 1 < img.width:
                    px[x + 1, y + 1] = v
    return img


def fit_serif(text, target_w, probe):
    """Largest size at which the inked width of `text` is target_w.

    Measured iteratively — glyph bounds do not scale quite linearly with
    point size, and a single linear estimate overshoots enough to clip.
    """
    size = 100
    for _ in range(6):
        font = ImageFont.truetype(SERIF, size)
        box = probe.textbbox((0, 0), text, font=font)
        w = box[2] - box[0]
        if abs(w - target_w) <= 2:
            break
        size = max(8, int(size * target_w / w))
    return ImageFont.truetype(SERIF, size)


def build_card():
    img = soft_ground(W, H)

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    word = "WATL"
    font = fit_serif(word, int(W * 0.82), d)

    # Measure the inked box, then place it: centred, and running past the
    # lower edge so the bottom fifth of the letterforms is cropped away.
    box = d.textbbox((0, 0), word, font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    x = int((W - tw) / 2 - box[0])
    y = int(H - th * 0.80 - box[1])
    d.text((x, y), word, font=font, fill=GOLD + (255,))

    img = Image.alpha_composite(img.convert("RGBA"), layer)

    # Small underlined label, bottom left.
    d = ImageDraw.Draw(img)
    label = "Wattle Technologies"
    lf = ImageFont.truetype(SANS, 23)
    lx, ly = 44, H - 52
    d.text((lx, ly), label, font=lf, fill=WHITE + (235,))
    lw = lf.getbbox(label)[2]
    d.line([(lx, ly + 30), (lx + lw, ly + 30)], fill=WHITE + (150,), width=1)

    img = add_grain(img.convert("RGB"))
    img.save("assets/og.png", "PNG", optimize=True)


def build_icon():
    S = 180
    ic = Image.new("RGB", (S, S), (46, 37, 69))
    d = ImageDraw.Draw(ic)
    f = ImageFont.truetype(SERIF, 138)
    box = f.getbbox("W")
    d.text(((S - (box[2] - box[0])) / 2 - box[0], (S - (box[3] - box[1])) / 2 - box[1] - 4),
           "W", font=f, fill=GOLD)
    ic.save("assets/apple-touch-icon.png", "PNG", optimize=True)


build_card()
build_icon()
print("wrote assets/og.png and assets/apple-touch-icon.png")
