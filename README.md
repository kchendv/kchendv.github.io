# kchendv.github.io

Personal portfolio site, served by GitHub Pages at [kchendv.github.io](https://kchendv.github.io).

It is a single hand-written static page — `index.html` plus CSS and JS in `static/` — with no
framework, no build step and no Liquid templating. Jekyll is used only to reproduce the GitHub Pages
build locally so you can preview changes with live reload before pushing.

## Prerequisites

- **Ruby 3.1+** with the DevKit (development headers). The site is developed against Ruby 3.2.
- **Bundler 2.3+**, which ships with modern Ruby installs.

### Windows

Install Ruby+Devkit from [RubyInstaller](https://rubyinstaller.org/downloads/) — pick the latest
`Ruby+Devkit x64` package. When the installer finishes and prompts to run `ridk install`, accept it
and choose option `3` (MSYS2 and MINGW development toolchain) so native gems can compile.

### macOS

Homebrew's Ruby avoids the permission problems of the system Ruby:

```bash
brew install ruby
echo 'export PATH="$(brew --prefix ruby)/bin:$PATH"' >> ~/.zshrc
```

### Linux (Debian/Ubuntu)

```bash
sudo apt install ruby-full build-essential zlib1g-dev
```

Confirm the toolchain is on your `PATH` before continuing:

```bash
ruby -v
bundle -v
```

## Setup

Install the gems pinned in `Gemfile.lock`:

```bash
bundle install
```

`Gemfile.lock` records platform-specific native gems (`ffi`, `sass-embedded`, `google-protobuf`).
If Bundler complains that your platform is missing from the lockfile, add it and retry:

```bash
bundle lock --add-platform x86_64-linux   # or arm64-darwin, x64-mingw-ucrt, etc.
bundle install
```

## Running locally

```bash
bundle exec jekyll serve --livereload
```

The site is then available at **http://127.0.0.1:4000**. Live reload watches the source files and
refreshes the browser whenever you edit `index.html` or the CSS.

Useful variations:

| Command | Purpose |
| --- | --- |
| `bundle exec jekyll serve --port 4001` | Serve on a different port if 4000 is taken |
| `bundle exec jekyll serve --host 0.0.0.0` | Expose the server to other devices on your network |
| `bundle exec jekyll build` | Write the site to `_site/` without starting a server |
| `bundle exec jekyll clean` | Delete `_site/` and `.jekyll-cache/` |

Stop the server with `Ctrl+C`.

## Project layout

```
index.html              The entire page: hero, about, experience, work, skills, contact
static/css/theme.css    Colour palettes and design tokens — the only place colours live
static/css/style.css    Layout, components, animation, responsive rules
static/js/main.js       Theme toggle, scroll reveals, mobile nav, counters, typewriter
                        (the DEFAULT_THEME and MOTION settings live in index.html)
static/                 Favicon, profile photo, resume PDF, local font
static/projects/        Project card thumbnails
Gemfile / Gemfile.lock  Jekyll toolchain used for local previews
_site/                  Generated output (gitignored)
```

There is intentionally no `_config.yml`. Jekyll reports `Configuration file: none` on startup and
copies every file through untouched, which matches how GitHub Pages serves the repository.

## Changing the colour scheme

All colours are CSS custom properties defined in **`static/css/theme.css`**. `style.css` never
hard-codes a colour, so that one file controls the entire look.

The file has three parts:

| Block | Contains |
| --- | --- |
| `[data-theme="light"]` | The light palette |
| `[data-theme="dark"]` | The dark palette |
| `:root` | Type scale, spacing, radii and motion — shared by both palettes |

To change the accent colour, edit `--accent` and `--accent-2` in both palette blocks; gradients,
glows, chips and focus rings all derive from them. To swap the whole palette, copy one of the
`PRESETS` at the bottom of the file (Ember, Moss, Mono) over the matching block.

## Boot settings: theme and motion

Two constants sit in the small inline `<script>` at the top of `index.html`. They run before first
paint, so neither the palette nor the motion mode flashes on load.

| Constant | Values | Meaning |
| --- | --- | --- |
| `DEFAULT_THEME` | `"dark"`, `"light"`, `"system"` | What a first-time visitor sees. `"system"` follows their OS colour scheme. After that the header toggle wins and the choice is stored in `localStorage`. |
| `MOTION` | `"always"`, `"auto"`, `"reduced"` | `"always"` runs animations for everyone. `"auto"` switches them off for visitors whose OS has "reduce motion" enabled. `"reduced"` disables them for everyone. |

`MOTION` currently ships as `"always"`. Set it to `"auto"` if you would rather respect the
visitor's operating-system reduce-motion preference — note that this also means **you** will see a
static page if your own machine has that setting on, which is easy to forget when the animations
suddenly stop working.

The resolved value is written to `<html data-motion="full|reduced">`, and `style.css` keys its
reduced-motion rules off that attribute rather than the media query directly. Under `reduced`,
continuous animations stop and movement transitions are dropped, while colour and opacity
transitions stay so hover and focus still respond.

## Making changes

Content lives directly in `index.html`:

- The name, tagline and rotating phrases are in the `.hero` section. The phrases come from the
  `data-typewriter` attribute, which holds a JSON array of strings.
- Each job is an `<article class="entry">` inside `.timeline` under "Experience".
- Each project is an `<article class="work-card">` under "Featured Work". Duplicate one to add a
  project and drop its thumbnail into `static/projects/`. Add `work-card--featured` to make a card
  span the full row with a side-by-side layout, and `work-card__media--contain` when the image is a
  device mockup or logo that should sit inside the frame instead of filling it.
- The count-up numbers in "About" use `data-count`, with optional `data-prefix`, `data-suffix` and
  `data-decimals`.
- Add `data-reveal` to any element to fade it in on scroll; `data-reveal="left"`, `"right"` or
  `"scale"` change the direction, and `style="--reveal-delay:2"` staggers it.
- Replace `static/resume.pdf` to update the linked resume.

Icons are inline `<symbol>` definitions in the SVG sprite at the top of `<body>`, referenced with
`<use href="#i-name">`.

## Deploying

GitHub Pages builds from the default branch, so pushing is the deploy step:

```bash
git add .
git commit -m "Describe your change"
git push
```

Do not commit `_site/` or `.jekyll-cache/`; both are listed in `.gitignore`.

## Troubleshooting

**`bundle: command not found`** — Ruby is not on your `PATH`. Reopen your terminal after installing,
or on Windows use the "Start Command Prompt with Ruby" shortcut.

**Native gem fails to build on Windows** — run `ridk install` and choose option `3` to install the
MSYS2 toolchain, then `bundle install` again.

**`Address already in use`** — another process holds port 4000. Serve on a different port with
`--port 4001`, or stop the existing server.

**Polling warning on Windows** (`Please add the following to your Gemfile to avoid polling for
changes: gem 'wdm'`) — harmless. Auto-regeneration still works; it just falls back to polling the
filesystem instead of using native change notifications.

**Edits do not appear** — the browser is likely caching the old CSS. Hard refresh with
`Ctrl+Shift+R` (`Cmd+Shift+R` on macOS).
