"""Build self-hosted reading fonts from pinned upstream files (fontTools + Brotli).

Usage: python scripts/build-reading-fonts.py SANS_VF.otf SERIF_REGULAR.otf
The common shard covers app/components source text; all remaining cmap entries are
also shipped, so dynamic input is not restricted to the sample vocabulary.
"""
import hashlib
import json
import re
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.unicodedata import mirrored

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/fonts/reading"
SPECS = [
    ("sans", "Prism Reading Sans SC", "100 900", "2745e9681cb9d8a5c8901b62c9e1bd98c9c774365fc3b84dd467621013b51cd3"),
    ("serif", "Prism Reading Serif SC", "400", "2a2eae2628df83556c54018c41e20fa532c1b862c5256ae8b3f23feb918d12ca"),
]


def ranges(points):
    groups = []
    for cp in sorted(points):
        if groups and cp == groups[-1][1] + 1:
            groups[-1][1] = cp
        else:
            groups.append([cp, cp])
    return ",".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in groups)


def variation_sequences(font):
    return sorted(
        f"{base:04X} {selector:04X}"
        for table in font["cmap"].tables if table.format == 14
        for selector, entries in table.uvsDict.items()
        for base, _ in entries
    )


def build(job):
    source, stem, family, weight, suffix, points = job
    font = TTFont(source, recalcTimestamp=False)
    expected_variations = [sequence for sequence in variation_sequences(font) if int(sequence.split()[0], 16) in points]
    selectors = {int(sequence.split()[1], 16) for sequence in expected_variations}
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_glyph = True
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=set(points) | selectors)
    sub.subset(font)
    for record in font["name"].names:
        if record.nameID in (1, 3, 4, 6, 16):
            value = family.replace(" ", "") if record.nameID == 6 else family
            record.string = value.encode(record.getEncoding())
    assert set(font.getBestCmap()) == set(points)
    assert variation_sequences(font) == expected_variations
    if stem == "sans":
        axis = font["fvar"].axes[0]
        assert (axis.axisTag, axis.minValue, axis.maxValue) == ("wght", 100, 900)
    else:
        assert font["OS/2"].usWeightClass == 400
    font.flavor = "woff2"
    temporary = OUT / f"{stem}-{suffix}.woff2"
    font.save(temporary)
    digest = hashlib.sha256(temporary.read_bytes()).hexdigest()
    path = temporary.with_name(f"{stem}-{suffix}-{digest[:12]}.woff2")
    temporary.rename(path)
    result = {"file": path.name, "family": family, "weight": weight, "characters": len(points), "variationSequences": expected_variations, "bytes": path.stat().st_size, "sha256": digest, "unicodeRange": ranges(points)}
    print(f"{path.name}: {result['bytes']} bytes / {len(points)} characters", flush=True)
    return result


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    previous = json.loads(manifest_path.read_text())["files"] if manifest_path.exists() else []
    text_sources = sorted(p for directory in ("app", "components") for p in (ROOT / directory).rglob("*") if p.suffix in (".tsx", ".ts"))
    text = "\n".join(p.read_text() for p in text_sources)
    common = set(range(0x20, 0x100)) | set(range(0x2000, 0x2070)) | set(range(0x3000, 0x3040)) | set(range(0xFF01, 0xFF61))
    # Cover shared navigation, docs and candidates, including prose symbols.
    # A single visible character
    # outside the common shard can otherwise request a multi-megabyte shard.
    common |= {ord(c) for c in text if c.isprintable()}
    # fontTools retains bidi mirrors (for example >= / <=). Keep them in
    # the same shard so its actual cmap stays disjoint from the remainder.
    common |= {mirrored(cp) for cp in common} - {None}
    jobs, sources = [], []
    for source, (stem, family, weight, checksum) in zip(sys.argv[1:], SPECS, strict=True):
        assert hashlib.sha256(Path(source).read_bytes()).hexdigest() == checksum, "Unexpected source version"
        font = TTFont(source)
        cmap = set(font.getBestCmap())
        groups = [sorted(cmap & common)]
        rest = sorted(cmap - common)
        groups += [rest[i:i + 4096] for i in range(0, len(rest), 4096)]
        assert set().union(*map(set, groups)) == cmap
        assert sum(map(len, groups)) == len(cmap)
        sources.append({"family": family, "sourceSha256": checksum, "characters": len(cmap), "variationSequences": variation_sequences(font), "weight": weight})
        jobs += [(source, stem, family, weight, "common" if i == 0 else f"{i:02}", group) for i, group in enumerate(groups)]
    with ProcessPoolExecutor(max_workers=2) as pool:
        files = list(pool.map(build, jobs))
    for source in sources:
        assert sorted(sequence for file in files if file["family"] == source["family"] for sequence in file["variationSequences"]) == source["variationSequences"]
    css = "/* Generated by scripts/build-reading-fonts.py. */\n" + "\n".join(
        f"@font-face {{ font-family: '{f['family']}'; src: url('/fonts/reading/{f['file']}') format('woff2'); font-style: normal; font-weight: {f['weight']}; font-display: swap; unicode-range: {f['unicodeRange']}; }}" for f in files)
    css += '\n@font-face { font-family: "Prism Review STIX Two Math"; src: url(\'/fonts/typography-review/stix-two-math.woff2\') format(\'woff2\'); font-style: normal; font-weight: 400; font-display: swap; }'
    (ROOT / "app/fonts.css").write_text(css + "\n")
    manifest_path.write_text(json.dumps({"textSources": [p.relative_to(ROOT).as_posix() for p in text_sources], "sources": sources, "files": files}, ensure_ascii=False, indent=2) + "\n")
    current_names = {file["file"] for file in files}
    for old in previous:
        name = old["file"]
        if name not in current_names and re.fullmatch(r"(?:sans|serif)-(?:common|\d+)-[0-9a-f]{12}\.woff2", name):
            (OUT / name).unlink(missing_ok=True)
