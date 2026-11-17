# Local Media Gallery

A **portable, offline photo and video gallery** in one `__gallery/index.html` file. No backend, cloud account, build process, or media database. Photos and videos remain in their folders; favorites, tags, albums, index, and cached previews stay in readable files under `__gallery/data/`.

> Browser: use **Chrome or Edge** (Chromium File System Access API). Firefox cannot grant the persistent, writable folder access this app requires. The gallery never uploads original media.

## Try the included demo after cloning

This repository includes a **`demo-gallery/`** folder alongside `__gallery/`, containing 16 original SVG sample illustrations, pre-populated favorites, dozens of tags, and 18 virtual albums to exercise scrolling and long names. No extra downloads needed.

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
        ├── tag-catalog.txt # reusable tag names, including unused tags
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
| **Folder / type filters** | Select a folder and subfolders, media type, and normal filename/tag search. |
| **Folder lock** (checkbox → lock → folder icons) | Checked **by default**. When checked, OFF/OR/AND album/tag results are constrained to the chosen folder. When unchecked, selecting album/tag filters searches the whole library; clearing selections or choosing All media returns to the root. |
| **OFF / OR / AND** | **OFF** (default) allows one album **or** one tag. **OR** allows multiple albums and tags and shows their union. **AND** allows multiple albums and tags and shows their intersection. In all modes a checked folder lock limits results to the current folder; unchecked makes active collection filters global. |
| **Albums / Tags** | Choose an album and one or more tags together (switch tabs to access each type). Green outlines show selected tags; click a selected album/tag again to unselect it and return toward All media. |
| **+ New / − Remove** | Create or delete a virtual album; in Tags mode, create reusable tags (including unassigned tags) or remove selected tags from all media. Original files are never deleted by these collection actions. |
| **All media / Favorites / Trash** | Filter all available media, favorites, or reversible Trash; each sidebar item displays its indexed file count. |
| **Show folder** | Show all indexed media in the current file's folder and its subfolders **inside the gallery**. It does not launch Explorer or Finder. |
| **Copy path** | Copy the complete path if known/inferred; otherwise enter the library root path once. |

All main controls and viewer actions include mouse-hover `title` tooltips.

### Selecting multiple media files (both Classic and Instagram)

- **Ctrl+click / Cmd+click** toggles one image or video without opening it.
- **Shift+click** selects an inclusive range between the selection anchor and clicked tile (only among currently loaded/visible cards).
- **Mouse drag** creates a selection rectangle over displayed cards, including when it starts in blank gallery space above or below the photo grid (even outside the rendered grid element). The selection persists after releasing the mouse button.
- **Long-press** a thumbnail (mouse, touch, or stylus) to begin selection. You can then slide across more thumbnails to add them, where supported by the browser.

In **Classic mode**, click the filename bar to select a file (Shift+click for a range); clicking the picture itself always opens it. In **Instagram mode**, Ctrl/Cmd-click, Shift-click, long press, or dragging select files.

The results count sits next to the **freedom_gallery** title in the top bar, freeing space above the photos. When items are selected it also shows `| N selected`. Hover over Favorites, Trash, or an album in the sidebar to reveal **+** for adding the selection. A successful operation displays **✓**. If **every selected item already belongs to that category**, its hover action becomes **−** to remove membership (or restore from Trash), even when another category is currently viewed. Hover over a tag to see a green **+** to assign it, or **−** if all selected files already have that tag; clicking adds/removes the tag **only for the selected files**. These actions work in Classic **and** Instagram mode. **Right-click any image (or empty gallery area) while items are selected** to keep the + / − controls visible on every Favorites, Trash, album, or tag item in the current sidebar tab. Switch between Albums and Tags without losing these actions. The selection is temporary, clears with **Esc** or by clicking outside, and never physically deletes originals.

### Albums and tags

Inside the full-screen viewer, buttons appear vertically as **Favorites** and **Trash**, followed by a compact **Albums / Tags** switch with **+ New**, **− Remove**, search, and clickable memberships. Changes are saved on click; no separate Save tags button is needed. The bottom-aligned **Show folder** and **Copy path** buttons stay fixed; the album/tag list expands to use all available space between search and those controls, scrolling as needed. The photo viewer dimensions remain fixed across different media sizes and collection counts. The viewer is now shorter on desktop, reducing unused dark space below landscape photos without cropping; images are centered vertically in their dark stage, with matching top and bottom bars, and albums/tags scroll internally.


**Trash counts:** moving a photo into the gallery Trash does not remove its album memberships or tag assignments. Album and tag counters exclude trashed items, so they decrease while the file is hidden and return to their previous values when restored. Permanent deletion, in contrast, removes that file's saved associations.

Albums are text files of relative paths: `data/albums/<album name>.txt`. A file can belong to many albums without being copied. Tags live together in `data/tags.tsv` as tab-separated rows; reusable tag names, even when not assigned to photos, are stored in `data/tag-catalog.txt`. No database and no per-tag folders are created. The tags sidebar lists at most 500 matching tags at a time; search narrows the list. Long album names are ellipsized, with their complete names in hover help. Both lists are scrollable.

Normal filename search and media type continue to narrow the results. Album and tag filters now coexist rather than clearing one another when switching the Albums/Tags tab.

**Example:** select `Landscapes`, keep **Fix folder** checked, then choose the album `Best of demo` and tags `landscape` + `demo`. With **AND**, only Landscapes photos matching the album *and both tags* appear. Switch to **OR** and the gallery shows every photo in the album *or with either tag*, globally, without modifying the remembered `Landscapes` dropdown selection. Switching back to **AND** restores the folder restriction. If **Fix folder** is unchecked, album/tag combinations operate globally in either mode; normal All media uses the selected folder again. Clicking the active album unselects it, returning to All media when no tags remain selected.

### Index cleanup and moving between computers

`Rebuild index` examines the actual folder tree, optionally transfers metadata for recognized moves/renames after approval, and cleans obsolete references/previews. **No automatic backup is created.** Because automatic cleanup removes references to missing media, ensure you selected the correct library and all expected drives/mounts are available *before rebuilding*. As a safety check, a rebuild with a suspiciously large disappearance of files **skips destructive cleanup**.

If images break after a mass rename or filesystem reorganization: first **Rebuild index**, then **Remove thumbs** only if the paths are correct and previews still fail. Avoid deleting `data/`, since it also contains favorites, albums, and tags.

The file index and album/tag paths are **relative to the selected library root**, making them portable across Windows, macOS, and Linux. Browser-granted folder permissions and absolute paths are different on each machine.

## Deletion warning

**Move to Trash** (including the keyboard `Delete` shortcut) adds a path to `data/trash.txt` and hides it from normal views; the original file **stays where it is** and can be restored. No confirmation is required because this is reversible.

**Delete permanently** and **Delete all** physically remove original files from disk after a confirmation dialog. The dialog closes harmlessly on Cancel, ×, Esc, or click outside. Permanent deletion **bypasses the operating-system Recycle Bin/Trash and cannot be undone**. There is no automatic backup. Test it on disposable files first.

## Keyboard shortcuts

- `←` / `→` — previous / next item in viewer (except when video controls have focus)
- `F` — add all selected images/videos to Favorites, or toggle Favorite for the currently open viewer item
- `Ctrl+Z` / `Cmd+Z` — undo the last reversible metadata edit (favorites, tags, album changes, or in-gallery Trash moves/restores); no cross-restart history, no undo of permanent file deletion. Native text-field undo still works while editing input.
- `Esc` — close viewer / confirmation, or clear multi-selection
- `/` — focus media search
- `Delete` — move the open image or selected images to the **in-gallery Trash** without confirmation. **It never permanently deletes**; when viewing Trash, use the explicit, confirmed Delete selected / Delete all buttons.
- Classic view: click filename bar — select media; click image — open the viewer
- `Ctrl`/`Cmd`+click — toggle item selection
- `Shift`+click — select an inclusive range
- Drag / long-press — select a group of visible cards

## Upgrading and publishing

To upgrade from v6.10 (or an earlier version using `__gallery/data/`), **replace only `__gallery/index.html`**. Existing text files and high-resolution thumbnails are preserved. No legacy metadata migration or separate server is required.

The included `.gitignore` intentionally only tracks the app, README, and **bundled demo** including its tag catalog. Do **not** publish your personal photos or the generated `__gallery/data/` from your real library. This repository is distributed under the license published in the GitHub repository (see `LICENSE`).

### v7.1 UI changes

Light uses a burgundy/red header and Dark uses a gold accent, similar to the Local StackEdit Wiki reference. Rebuild index and Remove thumbs appear side-by-side at the bottom of the sidebar. The Instagram layout and selected tags use green outlines. Top-level controls align to the right. The viewer has a compact Albums/Tags panel, and selection actions live in the sidebar rather than in a separate selection toolbar.

### v7.2 usability improvements

- Neutral gray selected tab backgrounds in Light mode, keeping the green selection border. The Albums / Tags switch is narrower.
- All media and Favorites now show counts like Trash.
- Sidebar bulk actions show **+** to add, **✓** after success, or **−** to remove items from the active collection (including restoring selected Trash items).
- Desktop drag selection works from blank areas above and below the grid and **stays selected on mouse-button release**; selection actions remain available in Instagram mode.
- Sidebar maintenance buttons have equal compact sizing: **Rebuild index** and **Remove thumbs**.
- The viewer has vertically stacked **Favorites**, **Trash**, **Show folder**, and **Copy path** buttons. The last two are kept below a reserved height for albums and tags.


## v7.3 — UI and Trash improvements

- In **Trash**, **Delete selected** sits immediately left of **Delete all**. It is disabled until one or more Trash items are selected; it permanently deletes **only those selected Trash files**, after the same explicit confirmation used by Delete all. Both actions bypass the operating system Trash and cannot be undone.
- The maintenance toolbar stays at a stable bottom-left sidebar location when switching Classic/Instagram mode; hovering over Favorites, Trash or albums overlays the `+`/`−` controls instead of shifting the counts.
- Choosing **Select library…** from Recent libraries launches the folder picker again, just like Open library.
- Tags now show a green `+` on hover for assigning the tag to the current selection.
- **+ New** and **− Remove** use a consistent in-app modal for album/tag creation and removal. Cancel, ×, Esc, or clicking outside dismiss the dialog without applying changes.
- The photo viewer has a fixed-height collection area: five or fifty tags/albums will not resize it on desktop. Additional items scroll inside the collection panel, with an 8px gap below the search field.

### Safety

`Delete selected` is only available inside the in-gallery Trash. **Move to Trash** merely hides originals, but **Delete selected**, **Delete all**, and **Delete permanently** remove the actual files from disk. Test permanent deletion with disposable media before using it on your archive.


## v7.3.1 — Standalone favicon and steady maintenance toolbar

- A self-contained SVG favicon is embedded directly in `__gallery/index.html` as a `data:` URI, so it works when opening the gallery directly via `file://` and requires no additional asset files.
- The left sidebar now has an independently scrollable content region; **Rebuild index** and **Remove thumbs** remain anchored in their own fixed-height row at the bottom of the sidebar. Changes between Classic and Instagram mode, or galleries containing more than 12 images, no longer reposition the buttons.
- The sidebar also measures the actual top-bar height when the header wraps or the browser zoom changes. At narrow responsive widths the controls remain a two-button row.

These are purely presentation changes: no reindexing, thumbnail regeneration or metadata migration is necessary.

## v7.3.2 — Selection and viewer refinements

- `Delete` now means **Move to Trash** for the current viewer item or the selected files. No popup is shown for reversible trash moves; permanent deletion still requires its separate confirmation.
- Album counts are right-aligned, independent of album-name length.
- When media is selected, a tag already assigned to the selection shows **−** on hover to remove it from those selected files. A missing tag shows **+** to assign it. The tag filter itself remains available without a media selection.
- In Classic view, the filename row selects an image; clicking its image opens it even when other images are selected. Ctrl/Cmd-click, Shift-click and marquee selection remain available.
- Drag selection can begin above or below the displayed photo grid, including empty space outside the main gallery element.
- The photo viewer keeps a constant size across different files. Its album/tag area now expands to fill available vertical space and scrolls internally. The media is positioned near the top of its dark stage, minimizing black space **above** wide images while retaining their full aspect ratio.

No index or cache migration is needed; replacing `__gallery/index.html` preserves existing metadata and thumbnails.


## v7.3.3 — StackEdit-inspired colors

- **Dark:** matched to the Local StackEdit Wiki screenshot — charcoal backgrounds
  (`#1b1e24` main, `#171a20` sidebar) and warm orange (`#f6a622`) for
  the primary Open library button, focus accents, and hover highlights.
- **Light:** the former bright-red banner is now a muted burgundy (`#6b2638`)
  with a soft, legible Open library button.
- **Favicon:** dark charcoal photo-gallery tile with an orange border and sun,
  embedded as an SVG data URL in `__gallery/index.html`. No external file or
  server is required.
- Green outlines on chosen tags, navigation categories, and Instagram mode
  remain intact. No changes to the index, thumbnails, albums, tags or favorites.

## v7.4 — Combined collections and folder lock

- New **Fix folder** checkbox with folder/lock icon between All folders and Photos & videos. It is checked on fresh installations.
- New **AND / OR** switch alongside Albums / Tags. Combine an album and multiple tags while keeping selection across the tabs.
- OR temporarily ignores the folder for a global union of selected collections, but never overwrites the folder dropdown.
- Albums and tags show counts excluding hidden Trash items; restoring the photo brings its count and membership back.
- Hover actions show **−** when all selected files already have the label, including tags, albums and Favorites.
- The results counter moved into the top banner next to the gallery title.
- Narrow-screen sidebar toolbar overflow fixed; no metadata migration or cache regeneration is required.


## v7.5 — Quick organization and one-step Undo

- The photo viewer is consistently shorter on desktop (up to 690px) to reduce the unused dark strip beneath wide images. It still does not crop the source and stays the same size between photographs.
- **Right-click while photos are selected:** the sidebar displays `+` or `−` controls for all displayed Favorites, Trash, album, or tag rows (including when you switch Albums/Tags); each reflects whether the entire selection already belongs to that category. Esc or clearing the selection removes this pinned state.
- **`F` with photos selected:** add the selected photos/videos to Favorites without opening them. In the viewer, `F` still toggles only the open photo.
- **`Ctrl+Z` (Windows/Linux) / `Cmd+Z` (macOS):** undo the **last reversible metadata edit**, including bulk actions, tag membership, album membership/creation/removal, favorites and in-gallery Trash moves/restores. Undo writes restored text metadata back to disk. The history is **one step per open page** and is reset when changing libraries or reloading; it does **not** recover permanently deleted files or undo index rebuilding/cleanup. Native undo in text inputs remains available.
- The AND/OR button moves next to the smaller **Search albums / Search tags** field, leaving the collection tabs more compact.
- On desktop, the current album/tag list expands all the way to the stationary **Rebuild index / Remove thumbs** buttons, scrolling internally when needed.

**Upgrade:** Replace only `__gallery/index.html`. No server, database, metadata migration or thumbnail regeneration is needed.


## v7.6 — OFF/OR/AND filters, wheel navigation and balanced letterboxing

- **OFF → OR → AND → OFF** is a three-state switch placed beside the collection search. OFF is neutral; OR and AND use a green outline. The choice persists for this gallery.
- **OFF:** one album **or** one tag can be selected; choosing a different item replaces it. Clicking the selected item again clears the filter.
- **OR:** select multiple albums and tags; show photos belonging to **any selected album or tag**.
- **AND:** select multiple albums and tags; show photos belonging to **all selected albums and carrying all selected tags**.
- **Lock folder:** checkbox, lock icon, folder icon (no text); enabled by default. When checked, folder scope applies to all three modes. When unchecked, selecting album/tag filters uses the entire library, but clearing all selections or clicking All media resets the folder dropdown to All folders.
- **Folder combobox:** hovering and scrolling the mouse wheel cycles folders and refreshes results.
- **Viewer:** uncropped images are centered vertically to make upper/lower dark bands equal; viewer dimensions remain fixed between images.

Upgrade by replacing only `__gallery/index.html`. Existing metadata, indexes and thumbnails need no migration or regeneration.
