#### Docs

Types of maplibre web and native are not fully compatible, although layer definitions are mostly thesame.

The files in this folder fix sufficient typing so that the common definitions can be used in both environments without TS errors.

Image-specific sources, layers, assets, and hooks live in `images/`; their common tests mirror that path under `test/layer-specification/images/`.

## Image markers

| Element | Rendering |
|---------|-----------|
| Photo | Viewport-projected circle center above its route point. Standalone selection grows from the bottom; expanded thumbnails grow from their centers. |
| Outline | Normal photos bake their outline into the sprite so overlapping thumbnails stack as complete units. Selected and drag-preview photos use a foreground SDF outline/photo pair. |
| Route anchor | Map-aligned hexagon at the original route coordinate, including when a group expands. Approximately 4 px sides and a nominal 4 px gap to the default circle border on a flat, unrotated map; bearing and pitch change its projected bounds. |
| Decoration colors | Photo outline and route hexagon share the UI design system's [map image-marker policy](../../../../../ui/web/src/design-system/Appearance.mdx#map-image-markers). Selection/drag takes priority over hover. |
| Count badge | Fully opaque octagon and number in one symbol. Its offset shares the photo's symbol transform under pitch. |
| Expanded picker | Even-angle viewport ring with a tertiary fill count chip above fill-inverse previous/next buttons at the bottom. Next moves clockwise, entering on the controls' left and leaving on their right; Back reverses this. Control interactions do not navigate the map. |
| Selected stacking | The selected route hexagon, photo, and border use foreground layers above other images, excluded from normal layers to avoid double blending. |
| Expanded connectors | Connect original route coordinates to thumbnail centers; the photo covers the inner segment. |
| Count labels | Preload `1`–`9` and `9+`. Standalone photos do not display a badge; groups above nine share `9+`, retaining their actual count internally. |
| Image lifecycle | Composite badges are rasterized in memory; no temporary files. Replace the fixed ten-image set when resolved theme colors change, removing the old map images. |

Anchors and photos have distinct feature IDs for MapLibre's updateable GeoJSON index, but retain the same `imageId` for interaction. Mirror hover and drag feature state to the corresponding anchor ID. Thumbnail and badge layers exclude anchor features; full-size playback uses the raw-coordinate anchor. Dragging a collapsed group moves only its visible image; a tap expands it. Completed drags clear selection and expansion.

Badges render inside MapLibre, not as DOM/native overlays, so they appear in map recordings.

### Regenerating assets

From the workspace root, run `yarn tsx scripts/app/generate-image-badge.ts <path-to-NotoSans-Bold.ttf>`. Use Noto Sans Bold from [notofonts/noto-fonts](https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSans). The generated assets contain outlined digits and the hexagon SDF; runtime rendering does not need that font file.

Regenerate the circular outline SDF with `yarn tsx scripts/app/generate-image-marker-outline.ts`; no font is required.
