"""Build the /f1 intro assets from the source clip.

  public/f1/car/NN.webp + manifest.json   car cut out of frames 49..72 (rembg matte)
  public/f1/footage/{lg,sm}/NN.webp + manifest.json   frames 72..152 (one continuous take), held
      duplicates dropped, 'ASTON MARTIN' removed from the helmet visor strip, with source frame numbers and the
      clip's measured shifts / end velocity

Not part of the app build. Needs a throwaway venv:
  python3 -m venv /tmp/f1venv && /tmp/f1venv/bin/pip install "rembg[cpu]" pillow numpy scipy
  /tmp/f1venv/bin/python scripts/build-f1-assets.py ~/Downloads/red-bull-video.mp4 [--skip-car]
"""
import json, pathlib, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

SRC = sys.argv[1]
SKIP_CAR = "--skip-car" in sys.argv
FIRST, N = 49, 24
PUB = pathlib.Path(__file__).resolve().parent.parent / "public/f1"
OUT = PUB / "car"
# crop boxes around the car at keyframes (x0,y0,x1,y1 in 1920x1080); model fails on the full cluttered frame
KEYS = {1: (380, 400, 1540, 1000), 8: (380, 380, 1540, 1030), 15: (300, 300, 1620, 1080), 16: (0, 200, 1920, 1080), 24: (0, 200, 1920, 1080)}
ks = sorted(KEYS)

def box(n):
    for a, b in zip(ks, ks[1:]):
        if a <= n <= b:
            t = (n - a) / (b - a)
            return tuple(int(round(x + (y - x) * t)) for x, y in zip(KEYS[a], KEYS[b]))

tmp = pathlib.Path(tempfile.mkdtemp())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-vsync", "0", str(tmp / "%03d.png")], check=True)


def frame(n):  # n is the 0-based source frame index
    return Image.open(tmp / f"{n + 1:03d}.png").convert("RGB")


def build_car():
    sess = new_session("isnet-general-use")
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*"): f.unlink()
    manifest = {"srcW": 1920, "srcH": 1080, "frames": []}
    for n in range(1, N + 1):
        im = frame(FIRST + n - 1)
        b = box(n); cr = im.crop(b)
        a = remove(cr.resize((cr.width * 2, cr.height * 2), Image.LANCZOS), session=sess, only_mask=True).resize(cr.size, Image.LANCZOS)
        arr = np.clip((np.asarray(a).astype(np.float32) / 255 - 0.12) / 0.43, 0, 1)
        # drop stray specks: keep components with real area
        lab, k = ndimage.label(arr > 0.3)
        if k:
            areas = ndimage.sum(np.ones_like(lab), lab, range(1, k + 1))
            keep = np.isin(lab, [i + 1 for i, v in enumerate(areas) if v >= 0.004 * areas.max() * 25])
            arr = arr * ndimage.binary_dilation(keep, iterations=3)
        rgba = cr.convert("RGBA"); rgba.putalpha(Image.fromarray((arr * 255).astype(np.uint8)))
        bb = rgba.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
        rgba = rgba.crop(bb)
        s = min(2.0, 2400 / rgba.width)
        rgba = rgba.resize((round(rgba.width * s), round(rgba.height * s)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
        rgba.save(OUT / f"{n:02d}.webp", quality=86, method=6)
        manifest["frames"].append({"x": b[0] + bb[0], "y": b[1] + bb[1], "w": bb[2] - bb[0], "h": bb[3] - bb[1]})
    (OUT / "manifest.json").write_text(json.dumps(manifest))


NAVY = np.array([5, 29, 59], np.float32)  # the helmet visor strip


def remove_visor_text(a, min_letters=5):
    """Remove the white 'ASTON MARTIN' lettering from the helmet's navy visor strip (a: HxWx3 float32).
    Letters = bright blobs that are letter-sized, mostly ringed by navy, and clustered into a line of text.
    Each letter + a 5px rim (anti-aliasing / compression ringing) is repainted with the strip's navy; the strip's
    white outline, rain streaks and the yellow/red ribbon art are protected. Returns (image, letters found)."""
    navy = np.linalg.norm(a - NAVY, axis=2) < 40
    core = a.min(2) > 150
    # rain streaks (thin vertical lines) can cross letters and weld them into one long shape: find them first.
    # Long ones by a tall opening; shorter segments as runs <= 3px wide (letter strokes are wider) that stand 20px+
    tall = ndimage.binary_opening(core, structure=np.ones((61, 1), bool))
    thin = core & ~ndimage.binary_opening(core, structure=np.ones((1, 4), bool))
    tl, tk = ndimage.label(thin)
    if tk:
        th = np.array([o[0].stop - o[0].start for o in ndimage.find_objects(tl)])
        tall |= np.isin(tl, np.nonzero(th >= 20)[0] + 1)
    lab, k = ndimage.label(core & ~ndimage.binary_dilation(tall, iterations=1))
    if not k:
        return a, 0
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(core, lab, range(1, k + 1))
    glyphs, cents, small = [], [], []
    for i in range(k):
        sl = objs[i]
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not (12 <= sizes[i] <= 2500) or h > 90 or w > 90:
            continue
        cc = ((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2)
        small.append((i + 1, cc))
        y0, y1, x0, x1 = max(sl[0].start - 5, 0), sl[0].stop + 5, max(sl[1].start - 5, 0), sl[1].stop + 5
        blob = lab[y0:y1, x0:x1] == i + 1
        ring = ndimage.binary_dilation(blob, iterations=4) & ~ndimage.binary_dilation(blob, iterations=1)
        if ring.any() and navy[y0:y1, x0:x1][ring].mean() >= 0.45:
            glyphs.append(i + 1)
            cents.append(cc)
    if len(glyphs) < min_letters:
        return a, 0
    c = np.array(cents)
    dist = np.linalg.norm(c[:, None] - c[None], axis=2)
    need = 3 if min_letters >= 5 else 2
    keep = [g for g, row in zip(glyphs, dist) if (row < 140).sum() >= need]  # clustered into a line of text
    if len(keep) < min_letters:
        return a, 0
    kc = np.array([cc for g, cc in zip(glyphs, cents) if g in keep])
    for g, cc in small:  # pieces of a letter a streak runs along: letter-sized and in the text line
        if g not in keep and np.linalg.norm(kc - np.array(cc), axis=1).min() < 70:
            keep.append(g)
    letters = np.isin(lab, keep)
    others = core & ~ndimage.binary_dilation(letters, iterations=6)  # outline, streaks, helmet white: protected
    ribbon = (a[..., 0] > 140) & (a[..., 2] < 110)
    area = ndimage.binary_dilation(letters, iterations=5) & ~ndimage.binary_dilation(others, iterations=1) & ~ribbon
    ring = ndimage.binary_dilation(letters, iterations=16) & ~ndimage.binary_dilation(letters, iterations=8)
    ys, xs = np.nonzero(ring & navy)  # strip colour from clear of the darker ringing next to the letters
    col = np.median(a[ys, xs], axis=0) if len(ys) else NAVY
    soft = np.clip(ndimage.gaussian_filter(area.astype(np.float32), 0.7) * 1.4, 0, 1)[..., None]
    soft = np.where(area[..., None], 1.0, soft)
    return a * (1 - soft) + col * soft, len(keep)


def build_footage():
    """Clip frames 72..152: one continuous camera move (over the car, cockpit, helmet, livery morph, up over the
    yellow helmet top). Kept untouched. Held duplicates are dropped, but each kept frame records its source frame
    number so playback keeps the original timing. endShift = how far the image moves down per source frame at the
    very end, so the page's exit can continue the clip's own motion."""
    first, last = 72, 152
    out = PUB / "footage"
    for d in ("lg", "sm"):
        (out / d).mkdir(parents=True, exist_ok=True)
        for f in (out / d).glob("*.webp"):
            f.unlink()
    kept, prev, had_text = [], None, 0
    for n in range(first, last + 1):  # inclusive
        a = np.asarray(frame(n)).astype(np.float32)
        if prev is not None and np.abs(a - prev).mean() <= 1.2:  # held drawing (animated on 2s)
            continue
        prev = a
        kept.append(n)
        # once the lettering has been seen, a smaller cluster still counts (strip leaving frame), so no letter flashes
        a, had_text = remove_visor_text(a, 2 if had_text else 5)
        print(f"  frame {n}: visor letters removed {had_text}")
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        im.save(out / "lg" / f"{len(kept):02d}.webp", quality=80, method=6)
        im.resize((1080, 608), Image.LANCZOS).save(out / "sm" / f"{len(kept):02d}.webp", quality=78, method=6)

    # vertical shift between consecutive kept frames (row profiles of the centre band; b = a moved down by s).
    # The tail is an accelerating camera tilt (shifts climb past 150px), so search wide.
    def rows(n):
        g = np.asarray(frame(n).convert("L")).astype(np.float32)[:, 700:1220].mean(1)
        return g - g.mean()

    def shift(a_n, b_n):
        ra, rb = rows(a_n), rows(b_n)
        return min(range(0, 401), key=lambda s: np.mean((rb[s:] - ra[: len(ra) - s]) ** 2))

    shifts = [shift(x, y) for x, y in zip(kept, kept[1:])]  # shifts[i]: kept[i] -> kept[i + 1]
    pan_from = len(shifts)
    while pan_from > 0 and shifts[pan_from - 1] >= 20:  # the pure tilt: every shift from here to the end is big
        pan_from -= 1
    end_shift = shifts[-1] / (kept[-1] - kept[-2])  # px per source frame at the very end
    (out / "manifest.json").write_text(json.dumps({"srcW": 1920, "srcH": 1080, "first": first, "last": last, "frames": kept, "shifts": shifts, "panFrom": pan_from, "endShift": end_shift}))
    print("footage frames", len(kept), "panFrom", kept[pan_from], "shifts", shifts[pan_from:], "endShift px/frame", end_shift)


if not SKIP_CAR:
    build_car()
build_footage()
