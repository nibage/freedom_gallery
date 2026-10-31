# Local Media Gallery

A lightweight **offline photo and video gallery** that runs from a single `index.html`. No server, cloud account, package manager, or media database is required. Albums, favorites, tags, and the file index remain in readable text files beside the app. Could function as independent a replacement for Shotwell, Digikam or any other destkop image viewer.

> **Browser support:** Use a recent Chrome or Edge (Chromium-based browser) with the File System Access API. Firefox does not currently offer the folder-writing functionality this app needs.

## Quick start

1. Place `__gallery/` inside the root of your photo/video collection.
2. Open `__gallery/index.html` in Chrome or Edge.
3. Click **Open library** and choose the **media collection root** (the folder *containing* `__gallery`, not `__gallery` itself).
4. Allow folder access when the browser requests it. The first scan builds `__gallery/data/files.txt`; later visits can reuse the saved index.

The app works locally. Your original photos and videos aren't uploaded anywhere.

## Features

- Recursive gallery for pictures and videos, including parent folders that contain media only in subfolders.
- Filename, path, and tag search; folder and media-type filters.
- **Classic** cards or **Instagram** edge-to-edge square thumbnails with a remembered layout preference.
- High-quality WebP thumbnail cache, stored on disk and regenerated on demand.
- Favorites, editable tags, and text-file albums; album/tag selection starts across **all folders**, while normal search can combine with a selected folder.
- Full-screen viewer with keyboard shortcuts and click-outside-to-close.
- **Show all in folder** and **Copy full path** (the latter requires entering the library's absolute path once; browsers cannot provide it automatically).
- An **in-gallery Trash** to temporarily hide media, with Restore and separately confirmed **permanent deletion**.
- Optional move/rename matching when refreshing the index; metadata transfers require your approval.

## Project layout

```text
Pictures/
├── 2024/
│   └── example.jpg
├── 2025/
│   └── video.mp4
└── __gallery/
    ├── index.html
    └── data/
        ├── files.txt           # indexed relative media paths
        ├── favorites.txt       # one relative media path per line
        ├── tags.tsv            # path<TAB>comma-separated tags
        ├── trash.txt           # items hidden from normal gallery views
        ├── media-info.tsv      # signatures for possible moves/renames
        ├── thumbs.tsv          # WebP thumbnail manifest
        ├── path-config.json    # optional manually configured absolute path
        ├── albums/             # each album is its own .txt file
        └── thumbs/             # generated WebP preview images
```

`index.html` is the only app source file. `data/` is created/filled as needed. Media paths inside the text files are relative to the selected collection root, making the metadata portable with the library.

### Starting clean or updating

**New installation:** Extract the complete release so that your collection has `__gallery/index.html`. Open it and select the collection root; indexing will happen once.

**Update from v6.9.1:** Replace **only `__gallery/index.html`**. Keep `__gallery/data/` untouched; the existing index, favorites, albums, tags, and thumbnail cache remain valid. No rescan or thumbnail rebuild is needed for this UI-only update.

**If you delete `__gallery/`:** You will also delete favorites, tags, albums, the Trash list, and thumbnails. Preserve any files you want to keep (for example `data/favorites.txt`) before deleting it, and restore them to the same paths before reindexing. This release does **not** migrate data from old folder layouts.

## Version 6.9.2

- Reduced the vertical whitespace between the search/filter controls, results count, and photo grid in both Classic and Instagram modes.
- Made the **Delete all** button narrower and shorter.
- Kept a reserved action slot, so showing the button in Trash doesn't move the results count.
- No changes to indexing, thumbnails, deletion behavior, or metadata formats.

## Trash and permanent deletion

**Move to Trash** adds a path to `data/trash.txt` and hides the media from normal gallery views. It **does not** move or delete the original file.

**Delete permanently** and **Delete all** remove the actual media file(s) from disk after confirmation. The confirmation can be dismissed with **Cancel**, **×**, **Esc**, or by clicking outside. These actions **bypass the operating system Recycle Bin/Trash and cannot be undone** by this app. No automatic media or metadata backups are made. Please test deletion on disposable files first.

**Delete all** operates on all indexed items in the gallery's Trash, not only the items currently visible after search or folder filtering.

## Keyboard shortcuts

- `←` / `→`: previous / next media item (when not controlling a video)
- `F`: toggle favorite in viewer
- `Esc`: close the viewer or dialog
- `/`: focus search

## GitHub / privacy

Publish `README.md`, `.gitignore`, and `__gallery/index.html` (optional `.gitkeep` placeholders keep empty `data/albums/` and `data/thumbs/` in the repository). **Do not publish your personal media or generated `__gallery/data/` contents.** The bundled `.gitignore` excludes these data files.

This project is intended to run entirely on your own device. No external services are required.
