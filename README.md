# temporal-os

A single-file retro desktop experiment that slowly falls apart over time.

It starts clean, then the UI decays: text mangles, logs get noisy, windows drift, overlays kick in, random app errors pop, and it ends in a fake bsod.

## what this is
This project is a fake 90s desktop simulation with a slow corruption mechanic.

It behaves like a tiny operating system mockup:
- draggable windows
- minimize, maximize, close
- taskbar buttons for open apps
- start menu launcher
- desktop icons
- retro menus and status bars

Then it starts to break itself on a timer.

## apps included
### my computer
- explorer-style icon grid
- view menu with icon size changes

### notepad
- editable journal text
- file/edit/format menus
- word wrap toggle

### system log
- boot log output and warning entries
- extra bad entries appear as decay gets worse

### recycle bin
- classic empty-bin window shell

### pong.exe
- single-player pong in its own app window
- full window behavior (drag/min/max/close)
- game menu with `New Game`
- score in status bar
- game over overlay with `Start Again`

## pong controls
- mouse: move paddle directly
- keyboard: left/right arrows
- objective: keep returning the ball
- lose condition: miss once and game over appears

## decay system
Global decay is time-based and ramps from 0 to 100.

As decay increases, the desktop gets worse in stages:
- labels using `data-orig` get progressively mangled
- notepad text corrupts when not actively edited
- scanlines and vignette fade in
- pixel noise overlay appears
- hue/saturation drift kicks in
- body flicker speeds up over time
- random error dialogs can pop
- open windows start drifting
- log output gets corrupted
- final state triggers a fake bsod screen

### pong-specific decay
Pong is connected to both visual and gameplay decay.

Visual/text decay on pong window:
- title bar text corrupts
- bottom status text corrupts
- game-over text corrupts
- global overlays/filters/flicker also affect the pong window

Gameplay decay on pong:
- paddle width shrinks after mid decay
- controls become unreliable late decay (dropped input + wobble)
- ball movement gains jitter at higher decay
- collisions use the decayed paddle width, so difficulty increases naturally

## run
Just open `index.html` in a browser.

## stack
Plain HTML, CSS, and JS.

## files
- `index.html`: desktop and window markup
- `style.css`: retro ui styling and overlays
- `script.js`: window manager, menus, decay logic, and pong game loop
