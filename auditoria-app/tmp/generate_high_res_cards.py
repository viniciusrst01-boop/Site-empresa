from pathlib import Path
from math import cos, sin, pi

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets"
W, H = 1600, 1500
SCALE = 3


def font(size, bold=False):
    names = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


F_NUM = font(82, True)
F_BINDER = font(57, True)
F_BINDER_SMALL = font(43, True)
F_TITLE = font(78, True)
F_TITLE_SMALL = font(72, True)
F_SUB = font(72, True)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def hex_to_rgb(value):
    value = value.strip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def gradient(size, stops, horizontal=False):
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    stop_values = [(pos, hex_to_rgb(color)) for pos, color in stops]
    for y in range(h):
        for x in range(w):
            p = x / max(w - 1, 1) if horizontal else y / max(h - 1, 1)
            for idx in range(len(stop_values) - 1):
                a_pos, a_col = stop_values[idx]
                b_pos, b_col = stop_values[idx + 1]
                if a_pos <= p <= b_pos:
                    local = (p - a_pos) / max(b_pos - a_pos, 0.001)
                    px[x, y] = tuple(lerp(a_col[i], b_col[i], local) for i in range(3))
                    break
            else:
                px[x, y] = stop_values[-1][1]
    return img


def rounded_layer(size, radius, fill):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=fill)
    return layer


def paste_shadow(base, box, radius, opacity=85, blur=28, offset=(0, 18)):
    x0, y0, x1, y1 = box
    mask = Image.new("L", (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, x1 - x0 - 1, y1 - y0 - 1), radius, fill=opacity)
    shadow = Image.new("RGBA", mask.size, (0, 0, 0, opacity))
    shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(blur)))
    base.alpha_composite(shadow, (x0 + offset[0], y0 + offset[1]))


def draw_text_center(draw, text, y, fill, fnt, line_gap=8):
    lines = text.split("\n")
    heights = []
    widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        widths.append(bbox[2] - bbox[0])
        heights.append(bbox[3] - bbox[1])
    total = sum(heights) + line_gap * (len(lines) - 1)
    cur_y = y - total / 2
    for line, width, height in zip(lines, widths, heights):
        draw.text(((W - width) / 2, cur_y), line, font=fnt, fill=fill)
        cur_y += height + line_gap


def draw_number(draw, number, accent, dark=False):
    badge = (42, 48, 260, 210)
    fill = accent
    draw.rounded_rectangle(badge, radius=34, fill=fill)
    draw.rounded_rectangle((badge[0], badge[1], badge[2], badge[3]), radius=34, outline=(255, 255, 255, 65), width=3)
    shadow_col = (0, 0, 0, 30 if not dark else 80)
    draw.rounded_rectangle((48, 55, 266, 216), radius=34, outline=shadow_col, width=2)
    draw.text((78, 75), number, font=F_NUM, fill=(255, 255, 255))


def draw_dashboard(draw, x, y, w, h, accent, compact=False, alpha=230):
    draw.rounded_rectangle((x, y, x + w, y + h), 22, fill=(252, 254, 255, alpha), outline=(255, 255, 255, 255), width=4)
    draw.rectangle((x, y, x + w, y + 66), fill=accent + (alpha,))
    for i in range(3):
        cx = x + 36 + i * 36
        draw.ellipse((cx, y + 22, cx + 16, y + 38), fill=(255, 255, 255, 190))
    grid_y = y + 112
    for row in range(6 if not compact else 4):
        yy = grid_y + row * 58
        draw.rounded_rectangle((x + 44, yy, x + w - 44, yy + 24), 7, fill=(227, 236, 246, alpha))
        draw.rounded_rectangle((x + 44, yy + 31, x + w * 0.55, yy + 47), 5, fill=accent + (90,))
    if not compact:
        cx, cy, r = x + w - 130, y + h - 140, 70
        draw.pieslice((cx - r, cy - r, cx + r, cy + r), 0, 130, fill=accent + (200,))
        draw.pieslice((cx - r, cy - r, cx + r, cy + r), 130, 250, fill=(24, 43, 69, 150))
        draw.pieslice((cx - r, cy - r, cx + r, cy + r), 250, 360, fill=(189, 218, 235, 210))
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 230), width=5)


def line_icon_shield(draw, cx, cy, accent):
    pts = [(cx, cy - 100), (cx + 86, cy - 55), (cx + 70, cy + 55), (cx, cy + 115), (cx - 70, cy + 55), (cx - 86, cy - 55)]
    draw.line(pts + [pts[0]], fill=accent, width=12, joint="curve")
    draw.line([(cx - 38, cy + 8), (cx - 8, cy + 40), (cx + 48, cy - 28)], fill=accent, width=15, joint="curve")


def line_icon_warning(draw, cx, cy, accent):
    pts = [(cx, cy - 112), (cx + 116, cy + 98), (cx - 116, cy + 98), (cx, cy - 112)]
    draw.line(pts, fill=accent, width=12, joint="curve")
    draw.line([(cx, cy - 40), (cx, cy + 28)], fill=accent, width=14)
    draw.ellipse((cx - 8, cy + 55, cx + 8, cy + 71), fill=accent)


def line_icon_combo(draw, cx, cy, accent):
    draw.rounded_rectangle((cx - 122, cy - 92, cx - 34, cy + 90), 12, outline=accent, width=10)
    draw.rounded_rectangle((cx - 100, cy - 125, cx - 58, cy - 82), 10, outline=accent, width=10)
    for i in range(3):
        yy = cy - 35 + i * 46
        draw.line((cx - 102, yy, cx - 58, yy), fill=accent, width=8)
    line_icon_warning(draw, cx + 82, cy + 6, accent)


def line_icon_folder(draw, cx, cy, accent):
    draw.rounded_rectangle((cx - 130, cy - 70, cx + 128, cy + 98), 18, outline=accent, width=12)
    draw.line((cx - 112, cy - 70, cx - 58, cy - 122, cx + 24, cy - 122, cx + 62, cy - 70), fill=accent, width=12, joint="curve")
    draw.line((cx - 92, cy + 6, cx + 88, cy + 6), fill=accent, width=10)


def draw_binder(base, cfg):
    draw = ImageDraw.Draw(base, "RGBA")
    accent = hex_to_rgb(cfg["accent"])
    front = hex_to_rgb(cfg["front"])
    spine = hex_to_rgb(cfg["spine"])
    front_poly = [(520, 260), (980, 330), (980, 1000), (520, 930)]
    spine_poly = [(350, 330), (520, 260), (520, 930), (350, 1030)]

    shadow = Image.new("RGBA", (820, 210), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse((30, 30, 790, 180), fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))
    base.alpha_composite(shadow, (285, 930))

    draw.polygon(spine_poly, fill=spine + (255,))
    draw.polygon(front_poly, fill=front + (255,))
    draw.line(spine_poly + [spine_poly[0]], fill=(0, 0, 0, 90), width=5)
    draw.line(front_poly + [front_poly[0]], fill=(255, 255, 255, 55), width=5)
    draw.line((520, 260, 520, 930), fill=(0, 0, 0, 90), width=5)

    for offset in (125, 590):
        draw.ellipse((385, 365 + offset, 423, 405 + offset), fill=(5, 12, 25, 170))
        draw.ellipse((394, 374 + offset, 414, 394 + offset), fill=(255, 255, 255, 85))

    # Subtle highlights on the front cover.
    draw.line((570, 305, 940, 360), fill=(255, 255, 255, 40), width=5)
    draw.line((942, 370, 942, 960), fill=(255, 255, 255, 28), width=5)

    fnt = F_BINDER_SMALL if cfg.get("small_binder_text") else F_BINDER
    y = 395
    for line in cfg["binder"].split("\n"):
        draw.text((610, y), line, font=fnt, fill=(255, 255, 255))
        y += 70 if cfg.get("small_binder_text") else 75
    if cfg.get("binder_sub"):
        draw.text((610, y + 12), cfg["binder_sub"], font=font(50), fill=(255, 255, 255))

    icon = cfg["icon"]
    icon_color = hex_to_rgb(cfg.get("icon_color", cfg["accent"]))
    icon_y = cfg.get("icon_y", 720)
    if icon == "shield":
        line_icon_shield(draw, 745, icon_y, icon_color)
    elif icon == "warning":
        line_icon_warning(draw, 745, icon_y, (255, 255, 255))
    elif icon == "combo":
        line_icon_combo(draw, 735, icon_y, (255, 255, 255))
    elif icon == "folder":
        line_icon_folder(draw, 745, icon_y, icon_color)

    # Spine text.
    spine_text_layer = Image.new("RGBA", (220, 690), (0, 0, 0, 0))
    st = ImageDraw.Draw(spine_text_layer)
    st.text((80, 20), cfg["spine_text"], font=font(26, True), fill=(255, 255, 255, 185))
    spine_text_layer = spine_text_layer.rotate(90, expand=True)
    base.alpha_composite(spine_text_layer, (360, 380))


def draw_bottom(draw, cfg):
    draw.rounded_rectangle((0, 945, W, H), radius=36, fill=(255, 255, 255))
    draw.rectangle((0, 945, W, 1025), fill=(255, 255, 255))
    accent = hex_to_rgb(cfg["accent"])
    title_color = hex_to_rgb(cfg.get("title_color", "#080b18"))
    lines = cfg["bottom"]
    if len(lines) == 2:
        draw_text_center(draw, lines[0], 1192, title_color, F_TITLE)
        draw_text_center(draw, lines[1], 1308, accent, F_SUB)
    else:
        draw_text_center(draw, "\n".join(lines), 1232, title_color, F_TITLE_SMALL)
    underline_w = 280
    draw.rounded_rectangle(((W - underline_w) / 2, 1406, (W + underline_w) / 2, 1424), 9, fill=accent)


def draw_card(cfg, filename):
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    paste_shadow(base, (0, 0, W, H), 38)
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, W - 1, H - 1), 38, fill=255)

    top = gradient((W, 1015), cfg["bg"], horizontal=cfg.get("horizontal", False)).convert("RGBA")
    card = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    card.alpha_composite(top, (0, 0))

    draw = ImageDraw.Draw(card, "RGBA")
    for i in range(18):
        x = 80 + i * 96
        draw.line((x, 0, x - 260, 1015), fill=(255, 255, 255, 16), width=2)

    accent = hex_to_rgb(cfg["accent"])
    draw_dashboard(draw, 88, 360, 480, 560, accent, compact=True, alpha=215)
    draw_dashboard(draw, 900, 260, 560, 640, accent, compact=False, alpha=220)
    draw_dashboard(draw, 1040, 555, 420, 350, accent, compact=True, alpha=205)

    draw_binder(card, cfg)
    draw_number(draw, cfg["num"], accent, cfg.get("dark", False))
    draw_bottom(draw, cfg)
    draw.rounded_rectangle((0, 0, W - 1, H - 1), 38, outline=(10, 16, 32, 255), width=6)
    draw.rounded_rectangle((8, 8, W - 9, H - 9), 32, outline=(255, 255, 255, 225), width=3)

    clipped = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    clipped.paste(card, (0, 0), mask)
    out = OUT_DIR / filename
    clipped.save(out, optimize=True)
    return out


CARDS = [
    {
        "num": "01",
        "accent": "#0a78ff",
        "front": "#062d83",
        "spine": "#041a4e",
        "bg": [(0, "#073d9d"), (0.52, "#096bff"), (1, "#f4fbff")],
        "binder": "KIT\nAUDITORIA",
        "binder_sub": "ISO 9001",
        "spine_text": "KIT AUDITORIA ISO 9001",
        "icon": "shield",
        "bottom": ["Kit Auditoria ISO 9001", "PROFISSIONAL"],
        "title_color": "#050916",
    },
    {
        "num": "02",
        "accent": "#ff5a00",
        "front": "#d84a05",
        "spine": "#8d2d04",
        "bg": [(0, "#ea4c07"), (0.52, "#ff7a1a"), (1, "#fff6ef")],
        "binder": "KIT NÃO\nCONFORMIDADE\nE AÇÃO\nCORRETIVA",
        "spine_text": "NÃO CONFORMIDADE",
        "icon": "warning",
        "icon_y": 780,
        "bottom": ["Kit Não Conformidade", "E Ação Corretiva"],
        "small_binder_text": True,
        "title_color": "#050916",
    },
    {
        "num": "03",
        "accent": "#1d2638",
        "front": "#0d1320",
        "spine": "#050812",
        "bg": [(0, "#101827"), (0.55, "#2a3442"), (1, "#f4f6f8")],
        "binder": "COMBO\nAUDITORIA +\nNÃO\nCONFORMIDADE",
        "spine_text": "COMBO AUDITORIA + NC",
        "icon": "combo",
        "icon_y": 805,
        "bottom": ["Combo Auditoria +", "Não Conformidade"],
        "small_binder_text": True,
        "title_color": "#050916",
        "dark": True,
    },
    {
        "num": "04",
        "accent": "#008f4b",
        "front": "#006c39",
        "spine": "#004b2a",
        "bg": [(0, "#006f3d"), (0.52, "#04a75d"), (1, "#effff8")],
        "binder": "KIT\nCONTROLE DE\nDOCUMENTOS",
        "spine_text": "CONTROLE DE DOCUMENTOS",
        "icon": "folder",
        "icon_color": "#3cffaa",
        "icon_y": 780,
        "bottom": ["Kit Controle de", "Documentos"],
        "small_binder_text": True,
        "title_color": "#00733f",
    },
]


def main():
    OUT_DIR.mkdir(exist_ok=True)
    for idx, cfg in enumerate(CARDS, 1):
        output = draw_card(cfg, f"kit-bloco-{idx:02d}-alta-resolucao.png")
        print(output)


if __name__ == "__main__":
    main()
