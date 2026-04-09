Design target:
- Use 1080x1920 as a virtual/reference resolution, not as a fixed output resolution.
- Real devices may have different resolutions/aspect ratios.
- Render/UI should scale from this reference space.

Core rules:

1) Absolute coordinates
- Do not place major UI using hard-coded screen pixels only.
- Absolute values are allowed only as small offsets/tweaks.
- Prefer: anchor + offset
- Avoid: fixed x/y tied to one exact screen shape

2) Anchors
- Define each UI element by attachment point first:
  - top-left: HP/MP, player info
  - top-right: minimap, currency, settings
  - bottom-left: movement controls
  - bottom-right: skill/action buttons
  - top-center: stage title, boss HP
  - center: popup, dialog, reticle
  - bottom-center: main menu / navigation
- Position = anchor reference + margin/offset

3) Size and scale ratio
- UI sizes should not be purely fixed-pixel logic.
- Use scalable rules:
  - base scale = 1.0
  - optional HUD scale presets = 0.9 / 1.0 / 1.1 / 1.2
- Prefer relative scaling for:
  - button size
  - icon size
  - spacing
  - panel size
  - font size (with limits)
- Do not uniformly scale every element blindly; some parts need different scaling behavior.

4) Min/max constraints
- Every important UI element should have min/max size limits.
- Example concept:
  - button: min / base / max
  - minimap: min / max
  - popup width: min / max
- Reason:
  - prevent tiny UI on small screens
  - prevent oversized UI on tablets/large displays

5) Safe area
- Treat safe area as a separate layout boundary.
- UI near edges must respect:
  - notch
  - punch-hole
  - rounded corners
  - gesture/navigation bar
  - status bar
- Place edge UI against safe-area bounds, not raw screen bounds.

6) Spacing system
- Use a spacing scale instead of arbitrary numbers.
- Example spacing steps:
  - 8 / 12 / 16 / 24 / 32 / 48 / 64
- Apply consistently to:
  - outer margins
  - panel padding
  - gaps between buttons
  - icon-text spacing

7) Asset/layout separation
- Do not build the entire HUD as one full-screen image.
- Use modular elements:
  - panels
  - buttons
  - icons
  - bars
  - text
- Layout should be system-driven, not image-driven.

8) Aspect ratio policy
- 1080x1920 is a 9:16 reference only.
- Wider/taller devices must be handled by policy:
  - keep gameplay/core content stable
  - adjust HUD margins/spacing/scale
  - add side/top/bottom extra space handling as needed
- Decide in advance:
  - what stays fixed
  - what stretches
  - what repositions

Implementation mindset:
- Reference resolution = design coordinate system
- Real screen = scaled/adapted presentation
- Stable layout comes from:
  - anchors
  - relative scale
  - min/max constraints
  - safe-area handling
  - consistent spacing

Bad practice:
- full reliance on absolute x/y
- full-screen HUD as one bitmap
- no safe-area logic
- no min/max UI constraints
- no extreme aspect-ratio testing

Good practice:
- anchor-based placement
- safe-area-aware edge UI
- scalable HUD with limits
- modular UI assets
- aspect-ratio adaptation rules
