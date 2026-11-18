<div align="center">

![Freedom Gallery — offline photo and video organizer](docs/media/hero.svg)

# freedom_gallery

**Your pictures. Your folders. Your freedom.**

A portable, private photo and video gallery that runs directly from one local HTML file.
Browse thousands of files, build albums and tags, and keep ownership of your original media.

[**Download a clean ZIP**](https://github.com/nibage/freedom_gallery/actions/workflows/build.yml) · [Tagged releases](https://github.com/nibage/freedom_gallery/releases) · [Explore the demo](#try-the-demo) · [Technical documentation](#technical-documentation)

</div>

## Made for the library you already have

| 📁 No lock-in | 📴 Works offline | 🏷️ Organize at scale | 🌗 Yours to customize |
| :-- | :-- | :-- | :-- |
| Leave photos and videos in their existing directories. | No server, cloud account, database, or upload. | Favorites, reusable tags, virtual albums, and fast filters. | Light/dark themes, Classic and Instagram layouts, keyboard shortcuts. |

### A tour of the interface

These **application screenshots** are captured automatically in GitHub Actions from the included, fictional 16-image demo library. They contain no personal media.

| Classic gallery (Dark) | Instagram-style grid (Dark) |
| :--: | :--: |
| ![Freedom Gallery Classic view, dark theme](docs/screenshots/classic-dark.png) | ![Freedom Gallery Instagram-style square grid, dark theme](docs/screenshots/instagram-dark.png) |
| Search and organize without leaving your folders. | Browse a spacious, edge-to-edge image grid. |

| Full-size viewer | Light theme |
| :--: | :--: |
| ![Photo viewer with album and tag management](docs/screenshots/viewer-dark.png) | ![Freedom Gallery Classic view, light theme](docs/screenshots/classic-light.png) |
| Mark favorites, tag a photo, or place it in an album using the green **+ / −** controls. | A calmer, burgundy-accented alternative. |

### See how it works

![Your media stays in place; metadata is stored as readable files](docs/media/storage.svg)

**1. Open a folder.** Point the gallery at your Pictures directory. Its index is saved locally, so subsequent visits reuse it.

**2. Find what matters.** Search by filename/path/tag, select folders, choose photos or videos, and combine album/tag filters with **OFF / OR / AND** and the **Fix folder** lock.

**3. Curate without copying.** Mark favorites, assign multiple tags, and collect files into albums. Undo one recent metadata action with **Ctrl+Z / Cmd+Z**.

**4. Take everything with you.** Move the library to a different computer or disk; your relative-path metadata stays beside your media.

### Try the demo

The [source repository](https://github.com/nibage/freedom_gallery) and the separately packaged **demo ZIP** include 16 original SVG sample pictures, preset tags, favorites, and albums. Open `__gallery/index.html` in **Chrome or Edge** and select the `demo-gallery` folder. You can test the UI without exposing your real collection.

---

# Technical documentation

## Install and download

For your actual photo library, download the **clean application ZIP** from a [GitHub Actions build](https://github.com/nibage/freedom_gallery/actions/workflows/build.yml) or a [tagged GitHub release](https://github.com/nibage/freedom_gallery/releases). Extract the `__gallery/` folder into the root of your photo collection:

```text
Pictures/
├── 2024/
│   └── landscape.jpg
├── Trips/
│   └── holiday.mp4
└── __gallery/
    └── index.html
```

Double-click `Pictures/__gallery/index.html` in **Google Chrome or Microsoft Edge**. Choose **Open library** and select `Pictures`, not `__gallery`; grant the browser read/write permission when requested. A first-time scan creates local metadata under `__gallery/data/`. Later openings reuse the saved index when the browser permits access.

**Browser support:** Chrome and Edge use the File System Access API. Firefox does not provide the persistent writable-folder access required by this application. It runs locally on supported versions of Windows, Linux, and macOS; browser permissions are specific to each machine.

**Updating:** Replace only `__gallery/index.html`. Keep `__gallery/data/`, which holds your favorites, tags, albums, and thumbnails. Updating the HTML alone does not require a reindex or thumbnail rebuild.

## Main controls

| Control | Behavior |
| :-- | :-- |
| **Search** | Find items by filename, path, or tag. The header shows only `82 results · showing 80 / 76 034 files` (example); hover for detailed filter matches. |
| **All folders / Fix folder** | Browse one folder and its descendants; lock the folder scope while selecting collections. |
| **Photos & videos** | Show all supported media, only photos, or only videos. |
| **Classic / Instagram mode** | Switch between labeled thumbnails and a compact, gapless square grid. |
| **Albums / Tags · OFF** | Select one album *or* one tag. |
| **Albums / Tags · OR** | Show media matching **any** selected album, tag, Favorites, or Trash category. |
| **Albums / Tags · AND** | Show media matching **all** selected categories. |
| **Favorites / Trash** | Organize favorites; in-gallery Trash is reversible until you explicitly delete permanently. |
| **Rebuild index** | Rescan your actual directory tree after files are added, moved, or renamed. |
| **Remove thumbs** | Recreate cached previews if they are stale or broken. |
| **Theme** | System, Light, or Dark. |

The visible results count remains useful when filters are active. The status beside the library controls says **loaded from index** when existing saved metadata was used. It shows scanning or other activity when appropriate; it does **not** repeat the total number of files.

## Selection, viewer and keyboard controls

- **Classic:** click a thumbnail to view; click its filename to select. **Instagram:** Ctrl/Cmd-click or drag-select; Shift-click selects a range.
- Right-click a selected group to reveal sidebar **+ / −** actions. Click **+** to add to Favorites/album/tag or **−** to remove existing membership.
- In the large photo viewer, **only the green + / − button** changes an album/tag assignment; clicking its name only selects the collection for management.
- **F** adds selected files to Favorites, or toggles the open photo's Favorite state.
- **Delete** moves the open/selected files into the reversible in-gallery Trash; it does not physically delete originals.
- **Ctrl+Z / Cmd+Z** undoes the most recent reversible metadata edit (one step per open page).
- **Esc** closes the viewer or clears selection; **/** focuses search; **← / →** browse the viewer.

## Files and metadata

The app itself is a single `__gallery/index.html`. There is **no server or media database**. The data directory contains ordinary text formats:

```text
__gallery/
├── index.html
└── data/
    ├── files.txt          # relative path inventory
    ├── favorites.txt      # relative paths, one per line
    ├── tags.tsv           # path, tab, tag list
    ├── tag-catalog.txt    # reusable tag names
    ├── trash.txt          # reversible in-gallery Trash entries
    ├── albums/            # one <album-name>.txt file per album
    ├── media-info.tsv     # file signatures used for move suggestions
    ├── thumbs.tsv         # thumbnail manifest
    ├── thumbs/            # derived image previews
    └── path-config.json   # optional absolute-path information
```

Album membership and tag assignments are not removed merely because a photo moves into the in-gallery Trash. Counts exclude those hidden photos and recover when restored.

**Copy full path:** when launched as a local `file://` page from inside the selected library, the gallery can infer the root path from the HTML file's location. Otherwise you can set the absolute library path manually. Folder-picker APIs do not reveal arbitrary absolute paths.

### Deletion safety

**Move to Trash** just marks media as hidden in `trash.txt`. **Delete permanently**, **Delete selected** and **Delete all** actually remove original files from disk after confirmation; these operations bypass the operating-system Recycle Bin/Trash and cannot be undone. There is no automatic backup. Test permanent deletion with disposable photos first.

**Rebuild index** may clean stale references and cached thumbnails after a successful scan. Make sure the correct library and all expected disks are available before running it.

## GitHub builds and release ZIPs

[**GitHub Actions → Build downloadable ZIPs**](https://github.com/nibage/freedom_gallery/actions/workflows/build.yml)

The workflow creates two ZIP files:

- **freedom-gallery-*.zip** — clean application distribution: `__gallery/index.html`, this README, license, and marketing screenshots/illustrations.
- **freedom-gallery-demo-*.zip** — the same application **plus** the self-contained `demo-gallery/` sample library.

Neither archive includes `.github/`, `tests/`, `scripts/`, `.gitignore`, Node dependencies, temporary caches, or other development helpers. Each `main` build provides a downloadable GitHub Actions artifact; a `v*` tag additionally publishes direct ZIP assets to GitHub Releases.

The workflow also captures fresh UI screenshots from the bundled demo (with no personal images). The screenshots in `docs/screenshots/` are updated by the automation when permitted by repository branch settings.

For the exhaustive feature history and older version notes, see [the archived technical reference](docs/REFERENCE.md).

## Privacy and license

Your indexed files and original media remain on your computer; the app does not upload them. Browser read/write permission is needed because the gallery intentionally writes its **human-readable metadata** beside your media. See [LICENSE](LICENSE) for the repository's license.
