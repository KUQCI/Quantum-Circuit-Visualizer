from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BACKGROUND = (217, 232, 255)
COMPONENT_ALPHA_THRESHOLD = 9
MIN_COMPONENT_AREA = 200
SIZES = (32, 64)
SPRITE_ORDER = ("default", "pointer", "grab", "grabbing", "progress")


@dataclass(frozen=True)
class Component:
    bounds: tuple[int, int, int, int]
    area: int


def key_background(
    image: Image.Image, background: tuple[int, int, int]
) -> tuple[Image.Image, bytes]:
    source = image.convert("RGB")
    width, height = source.size
    keyed = bytearray(width * height * 4)
    alpha_values = bytearray(width * height)
    pixels = source.tobytes()

    channel_data = zip(pixels[0::3], pixels[1::3], pixels[2::3])
    for index, pixel in enumerate(channel_data):
        coverage = 0.0
        for channel, matte in zip(pixel, background):
            if channel > matte and matte < 255:
                channel_coverage = (channel - matte) / (255 - matte)
            elif channel < matte and matte > 0:
                channel_coverage = (matte - channel) / matte
            else:
                channel_coverage = 0.0
            coverage = max(coverage, channel_coverage)

        alpha = round(coverage * 255)
        offset = index * 4
        if alpha < COMPONENT_ALPHA_THRESHOLD:
            keyed[offset : offset + 4] = b"\0\0\0\0"
            continue

        alpha_values[index] = alpha
        for channel_index, (channel, matte) in enumerate(zip(pixel, background)):
            foreground = round(
                (channel - matte * (1 - coverage)) / coverage
            )
            keyed[offset + channel_index] = max(0, min(255, foreground))
        keyed[offset + 3] = alpha

    return Image.frombytes("RGBA", source.size, bytes(keyed)), bytes(alpha_values)


def find_components(
    alpha_values: bytes, width: int, height: int
) -> list[Component]:
    visited = bytearray(width * height)
    components: list[Component] = []

    for seed, alpha in enumerate(alpha_values):
        if alpha < COMPONENT_ALPHA_THRESHOLD or visited[seed]:
            continue

        visited[seed] = 1
        stack = [seed]
        area = 0
        min_x = max_x = seed % width
        min_y = max_y = seed // width

        while stack:
            index = stack.pop()
            x, y = index % width, index // width
            area += 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)

            for neighbor_y in range(max(0, y - 1), min(height, y + 2)):
                row_offset = neighbor_y * width
                for neighbor_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row_offset + neighbor_x
                    if (
                        not visited[neighbor]
                        and alpha_values[neighbor] >= COMPONENT_ALPHA_THRESHOLD
                    ):
                        visited[neighbor] = 1
                        stack.append(neighbor)

        if area >= MIN_COMPONENT_AREA:
            components.append(Component((min_x, min_y, max_x + 1, max_y + 1), area))

    return components


def classify_components(
    components: list[Component], image_size: tuple[int, int]
) -> dict[str, Component]:
    width, height = image_size
    sprites: dict[str, Component] = {}

    for component in components:
        left, top, right, bottom = component.bounds
        center_x = (left + right) / 2
        if center_x < width * 0.4 and top > height * 0.4:
            name = "default"
        elif center_x < width * 0.6 and top < height * 0.4:
            name = "progress"
        elif center_x < width * 0.8 and top < height * 0.4:
            name = "grab"
        elif center_x >= width * 0.7 and top >= height * 0.25:
            name = "pointer"
        else:
            raise ValueError(f"Could not map sprite component at {component.bounds}")
        if name in sprites:
            raise ValueError(f"Found more than one {name} sprite")
        sprites[name] = component

    if set(sprites) != {"default", "pointer", "grab", "progress"}:
        raise ValueError(f"Expected four recognizable sprites, found {sorted(sprites)}")
    return sprites


def find_beak_mask(
    source: Image.Image, alpha_values: bytes, bounds: tuple[int, int, int, int]
) -> Image.Image:
    left, top, right, bottom = bounds
    width = right - left
    height = bottom - top
    mask = Image.new("L", source.size)
    mask_pixels = mask.load()
    source_pixels = source.convert("RGB").load()
    image_width = source.width
    for y in range(top, min(bottom, top + round(height * 0.3))):
        for x in range(left, min(right, left + round(width * 0.5))):
            red, green, blue = source_pixels[x, y]
            if (
                alpha_values[y * image_width + x] >= 128
                and red > 150
                and red - green > 35
                and green - blue > 25
            ):
                mask_pixels[x, y] = 255

    if mask.getbbox() is None:
        raise ValueError("Could not find the standing duckling's beak")
    return mask


def fit_to_square(
    image: Image.Image, size: int
) -> tuple[Image.Image, tuple[int, int], tuple[int, int]]:
    scale = min(size / image.width, size / image.height)
    resized_size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    resized = image.resize(resized_size, Image.Resampling.LANCZOS)
    offset = ((size - resized.width) // 2, (size - resized.height) // 2)
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    square.alpha_composite(resized, offset)
    return square, offset, resized.size


def fit_mask_to_square(
    mask: Image.Image, size: int, offset: tuple[int, int], resized_size: tuple[int, int]
) -> Image.Image:
    fitted = Image.new("L", (size, size), 0)
    fitted.paste(
        mask.resize(resized_size, Image.Resampling.NEAREST),
        offset,
    )
    return fitted


def beak_hotspot(mask: Image.Image) -> tuple[int, int]:
    points = [
        (x, y)
        for y in range(mask.height)
        for x in range(mask.width)
        if mask.getpixel((x, y)) > 0
    ]
    if not points:
        raise ValueError("The beak mask is empty after scaling")
    leftmost = min(x for x, _ in points)
    rows = sorted(y for x, y in points if x == leftmost)
    return leftmost, rows[len(rows) // 2]


def rotate_sprite(image: Image.Image, angle: float) -> Image.Image:
    return (
        image.convert("RGBa")
        .rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        .convert("RGBA")
    )


def feather_hotspot_marker(
    image: Image.Image, bounds: tuple[int, int, int, int]
) -> Image.Image:
    left, top, right, bottom = bounds
    high_alpha = image.getchannel("A").crop(bounds).load()
    local_width, local_height = right - left, bottom - top
    bottom_row = max(
        y
        for y in range(local_height)
        for x in range(local_width)
        if high_alpha[x, y] >= 128
    )
    tip_x_values = [
        x
        for x in range(local_width)
        if high_alpha[x, bottom_row] >= 128
    ]
    tip_x = round(sum(tip_x_values) / len(tip_x_values))
    marker = Image.new("L", (local_width, local_height), 0)
    ImageDraw.Draw(marker).ellipse(
        (tip_x - 7, bottom_row - 7, tip_x + 7, bottom_row + 7),
        fill=255,
    )
    return marker


def marker_hotspot(mask: Image.Image) -> tuple[int, int]:
    points = [
        (x, y)
        for y in range(mask.height)
        for x in range(mask.width)
        if mask.getpixel((x, y)) > 0
    ]
    if not points:
        raise ValueError("The rotated feather tip marker is empty")
    return (
        round(sum(x for x, _ in points) / len(points)),
        round(sum(y for _, y in points) / len(points)),
    )


def create_cursor(
    keyed: Image.Image,
    component: Component,
    size: int,
    *,
    mode: str,
    beak_mask: Image.Image | None = None,
) -> tuple[Image.Image, tuple[int, int]]:
    image = keyed.crop(component.bounds)
    marker = None

    if mode == "pointer":
        marker = feather_hotspot_marker(keyed, component.bounds)
        image = rotate_sprite(image, -135)
        marker = marker.rotate(-135, resample=Image.Resampling.NEAREST, expand=True)

    content_bounds = image.getchannel("A").getbbox()
    if content_bounds is None:
        raise ValueError(f"The {mode} sprite has no visible pixels")
    image = image.crop(content_bounds)
    if marker is not None:
        marker = marker.crop(content_bounds)

    sprite, offset, resized_size = fit_to_square(image, size)

    if mode == "default":
        assert beak_mask is not None
        beak = beak_mask.crop(component.bounds).crop(content_bounds)
        fitted_beak = fit_mask_to_square(beak, size, offset, resized_size)
        hotspot = beak_hotspot(fitted_beak)
    elif mode == "pointer":
        assert marker is not None
        fitted_marker = fit_mask_to_square(marker, size, offset, resized_size)
        hotspot = marker_hotspot(fitted_marker)
    else:
        hotspot = (size // 2, size // 2)

    return sprite, hotspot


def shrink_centered(image: Image.Image, scale: float) -> Image.Image:
    size = image.width
    inner_size = max(1, round(size * scale))
    smaller = image.resize(
        (inner_size, inner_size), Image.Resampling.LANCZOS
    )
    result = Image.new("RGBA", image.size, (0, 0, 0, 0))
    offset = ((size - inner_size) // 2, (size - inner_size) // 2)
    result.alpha_composite(smaller, offset)
    return result


def make_contact_sheet(
    images: dict[str, dict[int, Image.Image]],
    hotspots: dict[str, tuple[int, int]],
    path: Path,
) -> None:
    cell_width, cell_height = 142, 154
    display_size = 90
    columns = len(SPRITE_ORDER) * len(SIZES)
    sheet = Image.new("RGB", (columns * cell_width, 2 * cell_height), "#ffffff")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    backgrounds = ("#ffffff", "#0b1220")

    for row, background in enumerate(backgrounds):
        row_top = row * cell_height
        draw.rectangle(
            (0, row_top, sheet.width, row_top + cell_height),
            fill=background,
        )
        text_color = "#111827" if row == 0 else "#f8fafc"
        for sprite_index, name in enumerate(SPRITE_ORDER):
            for scale_index, size in enumerate(SIZES):
                column = sprite_index * len(SIZES) + scale_index
                x = column * cell_width
                label = f"{name} {'1x' if size == 32 else '2x'}"
                draw.text((x + 8, row_top + 7), label, fill=text_color, font=font)
                icon = images[name][size].resize(
                    (display_size, display_size),
                    Image.Resampling.LANCZOS,
                )
                icon_x = x + (cell_width - display_size) // 2
                icon_y = row_top + 36
                sheet.paste(icon, (icon_x, icon_y), icon)

                scale_factor = display_size / size
                hotspot_x, hotspot_y = hotspots[name]
                if size == 64:
                    hotspot_x *= 2
                    hotspot_y *= 2
                dot_x = icon_x + round(hotspot_x * scale_factor)
                dot_y = icon_y + round(hotspot_y * scale_factor)
                draw.ellipse(
                    (dot_x - 4, dot_y - 4, dot_x + 4, dot_y + 4),
                    fill="#ef233c",
                    outline="#ffffff",
                    width=1,
                )

    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "app" / "cursors",
    )
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()

    source = Image.open(args.source).convert("RGB")
    keyed, alpha_values = key_background(source, BACKGROUND)
    components = find_components(alpha_values, *source.size)
    sprites = classify_components(components, source.size)
    print(
        "Components:",
        ", ".join(
            f"{name}={sprite.bounds} ({sprite.area}px)"
            for name, sprite in sorted(sprites.items())
        ),
    )

    beak = find_beak_mask(
        source,
        alpha_values,
        sprites["default"].bounds,
    )
    images: dict[str, dict[int, Image.Image]] = {
        name: {} for name in SPRITE_ORDER
    }
    hotspots: dict[str, tuple[int, int]] = {}

    for size in SIZES:
        for name in ("default", "pointer", "grab", "progress"):
            image, hotspot = create_cursor(
                keyed,
                sprites[name],
                size,
                mode=name,
                beak_mask=beak if name == "default" else None,
            )
            images[name][size] = image
            if size == 32:
                hotspots[name] = hotspot
            elif name in ("default", "pointer"):
                expected = tuple(value * 2 for value in hotspots[name])
                if any(abs(actual - wanted) > 1 for actual, wanted in zip(hotspot, expected)):
                    raise ValueError(
                        f"{name} hotspot differs between 1x and 2x outputs: "
                        f"{hotspots[name]} vs {hotspot}"
                    )

        images["grabbing"][size] = shrink_centered(images["grab"][size], 0.85)
        hotspots["grab"] = hotspots["grabbing"] = (16, 16)
        hotspots["progress"] = (16, 16)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for name in SPRITE_ORDER:
        for size in SIZES:
            suffix = "@2x" if size == 64 else ""
            path = args.output_dir / f"duck-{name}{suffix}.png"
            images[name][size].save(path, optimize=True)
            print(path)

    print(
        "CSS hotspots:",
        ", ".join(f"{name}={hotspots[name]}" for name in SPRITE_ORDER),
    )
    if args.contact_sheet:
        make_contact_sheet(images, hotspots, args.contact_sheet)
        print(f"Contact sheet: {args.contact_sheet}")


if __name__ == "__main__":
    main()
