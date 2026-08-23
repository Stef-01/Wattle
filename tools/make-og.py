"""Render the Wattle Technologies social card (1200x630) with Pillow."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
GOLD = (255, 195, 0)
GOLD_PALE = (255, 229, 138)
GOLD_DEEP = (224, 148, 0)
VIOLET = (43, 26, 107)
INK = (10, 9, 18)

BLACK_TTF = r"C:\Windows\Fonts\ariblk.ttf"
BOLD_TTF = r"C:\Windows\Fonts\arialbd.ttf"


def gradient(w, h, c0, c1, angle_mix=0.35):
    """Diagonal-ish linear gradient."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(0, w, 2):
            t = (x / w) * (1 - angle_mix) + (y / h) * angle_mix
            t = min(1.0, max(0.0, t))
            col = tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))
            px[x, y] = col
            if x + 1 < w:
                px[x + 1, y] = col
    return img


def wide_text(text, font_size, width_scale, colour, alpha=255):
    """Arial Black rendered then horizontally stretched -> wide grotesk feel."""
    font = ImageFont.truetype(BLACK_TTF, font_size)
    tmp = Image.new("RGBA", (font_size * len(text), int(font_size * 1.6)), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    d.text((0, 0), text, font=font, fill=colour + (alpha,))
    bbox = tmp.getbbox()
    tmp = tmp.crop(bbox)
    return tmp.resize((int(tmp.width * width_scale), tmp.height), Image.LANCZOS)


def bloom(draw, cx, cy, s, colour=GOLD, pale=GOLD_PALE):
    def circ(dx, dy, r, col):
        draw.ellipse([cx + dx * s - r * s, cy + dy * s - r * s,
                      cx + dx * s + r * s, cy + dy * s + r * s], fill=col)
    circ(0, 0, 19, colour)
    circ(-24, -14, 13, colour)
    circ(24, -14, 13, colour)
    circ(-24, 14, 12, colour)
    circ(24, 14, 12, colour)
    circ(0, -27, 11, colour)
    circ(0, 27, 11, colour)
    circ(-14, -26, 8, pale)
    circ(15, 24, 8, pale)
    circ(-6, -5, 6, GOLD_DEEP)


def phyllode(layer, cx, cy, rot_deg, s, colour=VIOLET):
    """Leaf shape drawn as a rotated lens."""
    L, T = 146 * s, 24 * s
    pts = []
    steps = 26
    for i in range(steps + 1):
        t = i / steps
        pts.append((t * L, -math.sin(t * math.pi) * T))
    for i in range(steps, -1, -1):
        t = i / steps
        pts.append((t * L, math.sin(t * math.pi) * T))
    a = math.radians(rot_deg)
    ca, sa = math.cos(a), math.sin(a)
    rot = [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]
    ImageDraw.Draw(layer).polygon(rot, fill=colour + (255,))


def curve(draw, p0, p1, p2, p3, width, colour):
    pts = []
    for i in range(41):
        t = i / 40
        u = 1 - t
        x = (u ** 3) * p0[0] + 3 * (u ** 2) * t * p1[0] + 3 * u * (t ** 2) * p2[0] + (t ** 3) * p3[0]
        y = (u ** 3) * p0[1] + 3 * (u ** 2) * t * p1[1] + 3 * u * (t ** 2) * p2[1] + (t ** 3) * p3[1]
        pts.append((x, y))
    draw.line(pts, fill=colour, width=width, joint="curve")


def build():
    img = gradient(W, H, (255, 59, 24), (255, 157, 187)).convert("RGBA")

    # --- stacked wordmark texture -------------------------------------
    rows = 4
    row_h = H / rows
    for i in range(rows):
        t = wide_text("WATTLE", 150, 1.26, GOLD, alpha=245 if i % 2 == 0 else 205)
        scale = (W * 0.98) / t.width
        t = t.resize((int(t.width * scale), int(t.height * scale)), Image.LANCZOS)
        x = int((W - t.width) / 2)
        y = int(i * row_h + (row_h - t.height) / 2)
        img.alpha_composite(t, (x, y))

    # --- wattle sprig -------------------------------------------------
    sprig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sprig)
    stem = VIOLET + (255,)
    curve(sd, (520, 700), (700, 610), (760, 470), (860, 330), 16, stem)
    curve(sd, (860, 330), (960, 240), (1080, 210), (1210, 170), 14, stem)
    curve(sd, (860, 330), (890, 250), (880, 180), (860, 110), 10, stem)
    curve(sd, (960, 250), (1010, 232), (1060, 250), (1100, 300), 9, stem)
    curve(sd, (760, 470), (800, 510), (850, 540), (910, 552), 9, stem)

    for cx, cy, rot, s in [(880, 120, -104, .74), (760, 470, -150, .68), (866, 330, 152, .8),
                           (1104, 302, 44, .7), (912, 552, 26, .74), (1206, 172, -10, .6),
                           (1010, 236, -26, .62)]:
        phyllode(sprig, cx, cy, rot, s)

    for cx, cy, s in [(860, 108, 1.3), (1100, 300, 1.15), (910, 552, 1.2), (1206, 168, 1.0),
                      (930, 196, .78), (1020, 430, .8), (770, 590, .9)]:
        bloom(sd, cx, cy, s)

    sprig.putalpha(sprig.getchannel("A").point(lambda a: int(a * 0.97)))
    img.alpha_composite(sprig)

    # --- label plate --------------------------------------------------
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 108, W, H], fill=INK + (255,))
    watl = wide_text("WATL", 58, 1.25, GOLD)
    img.alpha_composite(watl, (56, H - 108 + int((108 - watl.height) / 2) - 4))

    small = ImageFont.truetype(BOLD_TTF, 21)
    d = ImageDraw.Draw(img)
    d.text((312, H - 76), "WATTLE TECHNOLOGIES", font=small, fill=(247, 244, 236))
    d.text((312, H - 48), "MODERN FUTURISM  ·  SIGNALS BEFORE SEASONS",
           font=ImageFont.truetype(BOLD_TTF, 17), fill=(255, 195, 0))

    img.convert("RGB").save("assets/og.png", "PNG", optimize=True)

    # --- apple touch icon --------------------------------------------
    ic = Image.new("RGBA", (180, 180), INK + (255,))
    idr = ImageDraw.Draw(ic)
    for dx, dy, r in [(0, -14, 26), (-40, -32, 17), (40, -32, 17), (-40, 6, 15), (40, 6, 15)]:
        idr.ellipse([90 + dx - r, 90 + dy - r, 90 + dx + r, 90 + dy + r], fill=GOLD)
    idr.line([(48, 22 + 68), (72, 152), (90, 74 + 20), (108, 152), (132, 90)],
             fill=GOLD, width=15, joint="curve")
    ic.convert("RGB").save("assets/apple-touch-icon.png", "PNG", optimize=True)
    print("wrote assets/og.png and assets/apple-touch-icon.png")


build()
