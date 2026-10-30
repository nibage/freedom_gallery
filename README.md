# Local Media Gallery

A portable, offline-first photo and video gallery. **Your media stays in normal folders**; favorites, tags, albums, file index and thumbnail manifest remain readable text files. No cloud, no media database, no accounts and no build step.

> Version 6.2. The gallery is a standalone `__gallery/index.html`: **no Python, local server, scripts, or additional installation required**.

## Features

- Recursive photo and video discovery, folder filter (including parent folders with media only in descendants), search by path/name/tag.
- Favorites (`favorites.txt`), editable tags (`tags.tsv`), albums (one `.txt` file per album).
- Video playback and preview frames in supported browsers.
- Thumbnail cache in `__gallery/thumbs/` with a human-readable `thumbs.tsv` manifest.
- `files.txt` index retained between sessions. **Refresh index** only after adding/removing/renaming files.
- Suggested migration of favorites/tags/albums on detected file moves/renames; backups before migrations or cleanup.
- Recent library handles remembered **separately for each `index.html` file location**; browser may ask to reauthorize access. A warning appears if you pick a folder whose name differs from the HTML file’s parent library.
- Tooltips on **Refresh index** and **Clean up metadata & thumbnails** instead of persistent help paragraphs.

## Install / quick start

1. Put the entire `__gallery/` directory inside your existing media library.
2. Open `__gallery/index.html` in current **Chrome or Microsoft Edge**.
3. Click **Open library** and select the **parent media directory**, not `__gallery/`.
4. Grant access when asked. The gallery scans your photos/videos and creates the text metadata and thumbnail cache inside `__gallery/` as needed.

Example layout:

```text
MyMedia/
├── 2024/
│   ├── Holiday/photo.jpg
│   └── Holiday/clip.mp4
├── 2025/
│   └── Family/photo.png
└── __gallery/
    ├── index.html
    ├── files.txt                  # generated
    ├── favorites.txt              # generated
    ├── tags.tsv                   # generated
    ├── media-info.tsv             # generated
    ├── thumbs.tsv                 # generated
    ├── albums/                    # generated TXT files
    ├── thumbs/                    # generated WebP thumbnails
    └── backups/                   # generated safety backups
```

`favorites.txt` and album `.txt` files contain relative paths, one per line. `tags.tsv` contains a relative path, one **tab**, then comma-separated tags. Paths are relative to the media library root.

## Updating to v6.2

**Do not delete `__gallery/` if it contains your own tags/favorites/albums.** Back it up before updating. Replace only `__gallery/index.html`. No helper files are needed. **After this update, choose each gallery’s folder once again** because browser shortcuts are now isolated by the HTML file’s location. Existing metadata and indexes are unchanged. If upgrading from v6, you can remove the old `external_helper.py`, `start-windows.cmd`, `start-linux.sh`, and `start-macos.command`; they are no longer used. Existing `files.txt`, `favorites.txt`, `tags.tsv`, `media-info.tsv`, `thumbs.tsv`, albums, backups and thumbnails remain compatible; there is **no need to rescan** simply for this upgrade.

A complete fresh-install archive is also provided. **Do not overwrite your existing metadata or thumbnails with empty files.** Removing `__gallery/` deletes your personal favorites, tags, albums and the cache.

**If you previously configured an external editor in v6:** `external-app.json` is unused in v6.1; you can delete it if desired. This does not affect your media metadata.

## Independent galleries (important fix in v6.2)

Each copy of `__gallery/index.html` keeps its **own** recently opened libraries in Chrome or Edge, identified by the full location of that HTML file. For example:

- `Pictures/__gallery/index.html` remembers `Pictures`.
- `Pictures-special/__gallery/index.html` remembers `Pictures-special`.

v6.1 and earlier used a shared browser database name, so their remembered libraries could appear in both copies. **v6.2 does not import old shared shortcuts**; choose the correct root folder once in each copy. You do not need to delete any metadata or regenerate thumbnails. When the HTML is moved to a different path, its recent-library history resets (the library files do not).

The browser cannot prove which physical folder contains the currently opened HTML file, so the app also warns if the name you pick doesn't match its inferred parent folder. You must still select the correct root: the selected folder controls what can be read and written. The **Forget libraries** button now affects only that HTML file's remembered shortcuts. It never deletes media.

## Browser support and limitations

- **Chrome / Edge:** recommended; relies on `showDirectoryPicker()` / File System Access API for reading and writing in the chosen library.
- **Firefox:** does not implement the directory picker needed by this design. The gallery requires a Chromium-based browser for direct local folder access.
- Videos with unsupported codecs get a placeholder thumbnail or fail playback; this does not modify the originals. MP4/H.264 and WebM generally work best.
- The index is a list of file paths and needs a manual refresh after external filesystem changes.
- Thumbnail generation is lazy and persists WebP previews as you browse.
- Recognition of moved/renamed media is based on recorded metadata and sampled signatures; verify suggested matches before transfer.
- The app is intended for personal/trusted local libraries; test and back up your metadata before using it on a large photo archive.

## Publishing on GitHub

The project has no build step. Put the contents of this ZIP into a GitHub repository and commit `README.md`, `.gitignore` and `__gallery/index.html` (plus `.gitkeep` placeholders). User-generated media indexes, favorites, tags, thumbnails are ignored by `.gitignore`; do not accidentally commit personal photos or metadata. For a source repository, keep sample screenshots (if any) anonymized and outside personal libraries. Choose and add an appropriate license before you publish.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `←` / `→` | Previous / next media (when video controls aren't focused) |
| `F` | Toggle favorite in viewer |
| `Esc` | Close viewer |

## No lock-in

A future gallery can read and edit `favorites.txt`, album `.txt` files and `tags.tsv` without using this UI. `files.txt`, `thumbs.tsv` and `media-info.tsv` are derived indexes and can be recreated. Your original photo/video folder structure never changes.
