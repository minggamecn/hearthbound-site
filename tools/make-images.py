"""Make the Hearthbound site's images from the game's own art and smoke screenshots."""
import sys
from pathlib import Path
from PIL import Image

SITE = Path(__file__).resolve().parent.parent
# The game repository, checked out next to this one (override with the first argument).
SIMS = Path(sys.argv[1]) if len(sys.argv) > 1 else SITE.parent / "sims"
OUT = SITE / "assets"
ART = SIMS / "assets/resources/art"
SMOKE = SIMS / "build/smoke"
(OUT / "shots").mkdir(parents=True, exist_ok=True)
(OUT / "settlers").mkdir(exist_ok=True)
(OUT / "art").mkdir(exist_ok=True)


def find(name: str) -> Path:
    hits = list(ART.rglob(name))
    if not hits:
        sys.exit(f"missing {name}")
    return hits[0]


def save_webp(img: Image.Image, path: Path, quality: int = 82) -> None:
    img.save(path, "WEBP", quality=quality, method=6)
    print(f"{path.relative_to(OUT)}  {img.size[0]}x{img.size[1]}  {path.stat().st_size // 1024} KB")


# Hero: the store feature graphic, at its full size.
feature = Image.open(SIMS / "store/art/store_feature_graphic.png").convert("RGB")
print("feature source", feature.size)
hero = feature if feature.width <= 2048 else feature.resize((2048, round(feature.height * 2048 / feature.width)), Image.LANCZOS)
save_webp(hero, OUT / "hero.webp", 80)
og = feature.resize((1200, round(feature.height * 1200 / feature.width)), Image.LANCZOS)
og.save(OUT / "og-image.jpg", "JPEG", quality=85, optimize=True)
print("og-image.jpg", og.size)

# Icon: header mark, favicon and touch icon.
icon = Image.open(SIMS / "store/art/app_icon.png").convert("RGBA")
print("icon source", icon.size)
for size, name in ((512, "icon-512.png"), (180, "apple-touch-icon.png"), (96, "icon-96.png"), (32, "favicon-32.png")):
    icon.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
save_webp(icon.resize((256, 256), Image.LANCZOS), OUT / "icon-256.webp", 88)

# Screenshots (1170 x 2532 smoke shots), 600 px wide.
SHOTS = {
    "colony": "homestead-iphone-390x844-1-rooms.png",
    "night": "homestead-iphone-390x844-1n-night.png",
    "settler": "en-iphone-390x844-3-settler.png",
    "lesson": "en-iphone-390x844-0-card.png",
    "raid": "defences-iphone-390x844-2-raid.png",
    "region": "en-iphone-390x844-8-region.png",
    "chronicle": "en-iphone-390x844-13-chronicle.png",
    "settler-zh": "zh-iphone-390x844-3-settler.png",
    "lesson-zh": "zh-iphone-390x844-0-card.png",
    "region-zh": "zh-iphone-390x844-8-region.png",
    "chronicle-zh": "zh-iphone-390x844-13-chronicle.png",
}
# The seasons, from tools/season-shots.mjs (same size).
for key in ("autumn", "winter", "autumn-zh", "winter-zh"):
    SHOTS[key] = SIMS / "build/site" / f"{key}.png"
for key, file in SHOTS.items():
    img = Image.open(SMOKE / file).convert("RGB")
    w = 600
    save_webp(img.resize((w, round(img.height * w / img.width)), Image.LANCZOS), OUT / "shots" / f"{key}.webp", 80)

# Portraits: the first (content) frame of each sheet.
for n in ("01", "03", "04", "05", "08", "09", "11", "16"):
    sheet = Image.open(find(f"por_settler_{n}.png")).convert("RGBA")
    side = sheet.height
    frame = sheet.crop((0, 0, side, side)).resize((192, 192), Image.LANCZOS)
    save_webp(frame, OUT / "settlers" / f"settler-{n}.webp", 86)

# Banners: valleys and a few event cards.
for name in ("ill_biome_green_vale", "ill_biome_pine_highlands", "ill_biome_saltreach_flats", "ill_biome_mirefen",
             "ill_event_wolves", "ill_event_wedding", "ill_event_blizzard", "ill_event_lanternfloat",
             "ill_event_refugees", "ill_event_harvesthome", "ill_chronicle_landing"):
    img = Image.open(find(f"{name}.png")).convert("RGB")
    save_webp(img, OUT / "art" / f"{name.replace('ill_', '').replace('_', '-')}.webp", 82)
