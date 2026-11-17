# Local Media Gallery

A **portable, offline photo and video gallery** in one `__gallery/index.html` file. No backend, cloud account, build process, or media database. Photos and videos remain in their folders; favorites, tags, albums, index, and cached previews stay in readable files under `__gallery/data/`.

> Browser: use **Chrome or Edge** (Chromium File System Access API). Firefox cannot grant the persistent, writable folder access this app requires. The gallery never uploads original media.

## Try the included demo after cloning

This repository includes a **`demo-gallery/`** folder alongside `__gallery/`, containing 16 original SVG sample illustrations, pre-populated favorites, dozens of tags, and 18 virtual albums for testing long lists. No extra downloads needed.

1. Clone or download this repository.
2. Open `__gallery/index.html` in **Chrome or Edge** (double-click it, no server).
3. Click **Open library**, and select the **`demo-gallery` folder** (not its inner `__gallery`). Allow read/write folder access.
4. Experiment with Classic / Instagram, Light / Dark, multi-selection, albums, tags, favorites, and full-screen previews.

The browser requires that **one manual folder selection** before it can read local media. On later launches, the most recent library loads automatically if permission is still granted; otherwise select it from the recent-library dropdown to grant access again.

The demo media are original SVG illustrations (included as plain text files), intended only for demonstration. Do not use permanent deletion on demo files unless you want them removed.

## Install for a personal photo library

Place `__gallery/` in your real media library root:

```text
Pictures/
├── 2024/
│   └── sample.jpg
├── 2025/
│   └── vacation.mp4
└── __gallery/
    ├── index.html
    └── data/              # created automatically
        ├── files.txt      # relative path inventory
        ├── favorites.txt  # one path per line
        ├── tags.tsv       # path<TAB>tag1, tag2
        ├── tag-catalog.txt # reusable tags, including unassigned tags
        ├── trash.txt      # reversible in-gallery trash list
        ├── media-info.tsv # signatures for move/rename suggestions
        ├── thumbs.tsv     # WebP thumbnail manifest
        ├── path-config.json
        ├── albums/        # one .txt per album
        └── thumbs/        # generated WebP previews
```

Open `Pictures/__gallery/index.html`, click **Open library** and select **Pictures**. The first launch indexes its media. Future launches reuse the saved `data/files.txt` index without rescanning.

### Copy full path across Windows, Linux, and macOS

When `index.html` is opened locally (`file://`) inside **the same** library that is selected, the app derives the full filesystem path from the **HTML file's own URL** — *not from the folder picker*, which is forbidden from revealing absolute paths. The detected path is saved in `data/path-config.json`, with separate entries for Windows, macOS and Linux. This keeps **Copy full path** convenient across operating systems.

If you select a **different** library from the one containing the HTML file, or use an HTTP URL, the app cannot infer its real path. The **first Copy full path** will ask you to enter the absolute library path manually. This is a browser security limitation, not a requirement for showing photos.

If a remembered folder is moved, deleted, disconnected, or access is revoked, automatic reopening may fail. The gallery does **not** delete your metadata. Use **Open library** to select the current folder again; if your files moved, use **Rebuild index** to fix stale relative paths.

## Features and controls

| Control | Use case |
| --- | --- |
| **Open library** | Select the media root. Reuse its saved index and metadata, or scan from scratch if no index exists. |
| **Recent libraries** | Shows the **currently selected** library and lets you switch remembered folders. |
| **Remove library** | Remove the selected shortcut from browser history. Does **not** delete anything on disk. |
| **Rebuild index** | Rescan subfolders after adding, moving, renaming, or deleting files. Review proposed move/rename metadata transfers. After a **successful** scan, remove stale file references and outdated cached previews automatically; no backups are made. |
| **Remove thumbs** | Reset the derived WebP cache. Use it if previews look broken or dated; photos, tags, albums, and file index remain unchanged. |
| **Theme: System / Light / Dark** | Follow your OS preference, or override it independently for this HTML gallery. |
| **Classic / Instagram** | Switch between labeled cards and a gapless square-tile grid. The selected layout is remembered. |
| **Folder / type filters** | Search inside a chosen folder and its subfolders, photos only, videos only, or all media. |
| **Albums / Tags** | Switch the sidebar between searchable album names and tag chips. Selected tags have a **green outline**; selecting several tags uses **AND**, matching only files containing all of them. |
| **+ New / − Remove** | Create or delete virtual albums or reusable tags, even before assigning tags to photos. Removing a tag clears its assignments without deleting media. Original files are never deleted by these collection actions. |
| **All media / Favorites / Trash** | Filter favorite files or view media hidden in the reversible in-gallery Trash. |
| **Show folder** | Show all indexed media in the current file's folder and its subfolders **inside the gallery**. It does not launch Explorer or Finder. |
| **Copy path** | Copy the complete path if known/inferred; otherwise enter the library root path once. |

All main controls and viewer actions include mouse-hover `title` tooltips.

### Selecting multiple media files (both Classic and Instagram)

- **Ctrl+click / Cmd+click** toggles one image or video without opening it.
- **Shift+click** selects an inclusive range between the selection anchor and clicked tile (only among currently loaded/visible cards).
- **Mouse drag** creates a selection rectangle over displayed cards, even when started from the empty area above or below the grid; the selection persists after releasing the mouse button.
- **Long-press** a thumbnail (mouse, touch, or stylus) to begin selection. You can then slide across more thumbnails to add them, where supported by the browser.

Selection count appears inline with results (`| N selected`). Hover Favorites, Trash, or an album in the sidebar for its **+** action; hover a tag for **Mark tag**. Click to apply the selected action. Esc or a click outside the selection clears it. No separate Select button or selection toolbar is needed. These bulk actions never physically delete originals.

### Albums and tags

Within a photo viewer, actions are ordered Favorites, Trash, a compact searchable Albums/Tags panel with clickable memberships and + New / − Remove, then Show all in folder and Copy full path. Changes save when clicked; no separate Save tags action.

Albums are text files of relative paths: `data/albums/<album name>.txt`. A file can belong to many albums without being copied. Tags live together in `data/tags.tsv` as tab-separated rows; reusable names (including unused tags) live in `data/tag-catalog.txt`. No database and no per-tag folders are created. The tags sidebar lists at most 500 matching tags at a time; search narrows the list. Long album names are ellipsized, with their complete names in hover help. Both lists are scrollable.

Normal search and folder selection combine with **AND**. Choosing an album or any tag resets the folder filter to **All folders**, so the collection first shows media across the library. You can then select a folder to narrow that collection.

### Index cleanup and moving between computers

`Rebuild index` examines the actual folder tree, optionally transfers metadata for recognized moves/renames after approval, and cleans obsolete references/previews. **No automatic backup is created.** Because automatic cleanup removes references to missing media, ensure you selected the correct library and all expected drives/mounts are available *before rebuilding*. As a safety check, a rebuild with a suspiciously large disappearance of files **skips destructive cleanup**.

If images break after a mass rename or filesystem reorganization: first **Rebuild index**, then **Remove thumbs** only if the paths are correct and previews still fail. Avoid deleting `data/`, since it also contains favorites, albums, and tags.

The file index and album/tag paths are **relative to the selected library root**, making them portable across Windows, macOS, and Linux. Browser-granted folder permissions and absolute paths are different on each machine.

## Deletion warning

**Move to Trash** adds a path to `data/trash.txt` and hides it from normal views; the original file **stays where it is** and can be restored.

**Delete permanently** and **Delete all** physically remove original files from disk after a confirmation dialog. The dialog closes harmlessly on Cancel, ×, Esc, or click outside. Permanent deletion **bypasses the operating-system Recycle Bin/Trash and cannot be undone**. There is no automatic backup. Test it on disposable files first.

## Keyboard shortcuts

- `←` / `→` — previous / next item in viewer (except when video controls have focus)
- `F` — toggle favorite for the currently open item
- `Esc` — close viewer / confirmation, or clear temporary selection
- `/` — focus media search
- `Ctrl`/`Cmd`+click — toggle item selection
- `Shift`+click — select an inclusive range
- Drag / long-press — select a group of visible cards

## Upgrading and publishing

To upgrade from v6.10 (or an earlier version using `__gallery/data/`), **replace only `__gallery/index.html`**. Existing text files and high-resolution thumbnails are preserved. No legacy metadata migration or separate server is required.

The included `.gitignore` intentionally only tracks the app, README, and **bundled demo** including its reusable tag catalog. Do **not** publish your personal photos or the generated `__gallery/data/` from your real library. This repository is distributed under the license published in the GitHub repository (see `LICENSE`).

## v7.1 interface refresh

The color schemes reflect the Local StackEdit Wiki screenshots: a burgundy-red header in Light and gold accents in Dark, with green outlines for selected tags and Instagram mode. Rebuild index and Rebuild thumbnails share a bottom-left sidebar toolbar, while top navigation is right-aligned. The viewer has inline collection controls instead of Save tags, and multi-selection uses sidebar hover actions instead of a selection bar.

### v7.2 usability update

- Neutral selected button backgrounds in Light mode, retaining green outlines; narrower Albums / Tags switch.
- Counters for All media, Favorites, and Trash.
- Context-sensitive + / ✓ / − actions for bulk adding and removing favorites, Trash items and album members.
- Marquee selection persists after mouse release and starts from empty space above or below media, in Classic and Instagram modes.
- Bottom-left maintenance buttons are equal width: Rebuild index and Remove thumbs.
- Viewer buttons are vertically stacked: Favorites, Trash; then bottom-aligned Show folder and Copy path below five lines of collection space.


## v7.3 — UI and Trash improvements

- In **Trash**, **Delete selected** sits immediately left of **Delete all**. It is disabled until one or more Trash items are selected; it permanently deletes **only those selected Trash files**, after explicit confirmation. Both actions bypass the operating system Trash and cannot be undone.
- The maintenance toolbar stays at a stable bottom-left sidebar location when switching Classic/Instagram mode; hovering over Favorites, Trash or albums overlays the `+`/`−` controls instead of shifting the counts.
- Choosing **Select library…** from Recent libraries launches the folder picker again, just like Open library.
- Tags now show a green `+` on hover for assigning the tag to the current selection.
- **+ New** and **− Remove** use a consistent in-app modal for album/tag creation and removal. Cancel, ×, Esc, or clicking outside dismiss the dialog without applying changes.
- The photo viewer has a fixed-height collection area: five or fifty tags/albums will not resize it on desktop. Additional items scroll inside the collection panel, with an 8px gap below the search field.

### Safety

`Delete selected` is only available inside the in-gallery Trash. **Move to Trash** merely hides originals, but **Delete selected**, **Delete all**, and **Delete permanently** remove actual files from disk. Test permanent deletion with disposable media before using it on your archive.

## v7.3.1 — Embedded favicon & steady sidebar controls

- A vector photo-gallery favicon is embedded in `__gallery/index.html` as a `data:image/svg+xml` link. It works offline via `file://` without adding asset dependencies.
- The sidebar contents now scroll independently of the maintenance row. **Rebuild index** and **Remove thumbs** stay anchored at the bottom and do not jump when switching Classic / Instagram, including when there are more than 12 photos.
- The top-bar height is measured to keep sidebar alignment correct at different desktop widths and zoom settings; narrow/mobile layouts retain the side-by-side maintenance buttons.

This is a UI-only change. Existing indexes, thumbnail caches, favorites, albums, and tags are untouched.
