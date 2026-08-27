# Tooth Puller

**Tooth Puller** (originally published to npm as `binary-extractor`) is a small library for reading structured data out of raw binary buffers — originally written for **Creatures 2** "history file" (`.chr`) genealogy records, but generic enough for any length-prefixed or fixed-width binary format.

This repo now also includes **`index.html`** — a standalone, browser-based extraction lab built on top of that same reading logic. Drop in a file, and inspect it completely client-side. Nothing is uploaded anywhere; all parsing happens in your own browser tab.

---

## Running the web lab

Open `index.html` directly, or serve the repo with GitHub Pages (Settings → Pages → deploy from `main` / root). No build step, no dependencies to install — it pulls in [JSZip](https://stuk.github.io/jszip/) from a CDN for zip handling and does everything else in vanilla JS.

> Hashing (SHA-1/SHA-256) requires a secure context (`https://` or `localhost`), since browsers block `crypto.subtle` on plain `http://`. GitHub Pages is HTTPS by default, so this isn't an issue once deployed.

---

## What's in the web lab today

### 0. Profile estimate
Runs automatically the moment a file loads, before any of the detailed sections below. Synthesizes everything the other tabs can see — file signature, embedded strings, PE compile timestamp, zip entry dates — into a **Who / What / When / Where / Why / How** summary card grid:

- **Who** — email addresses found in strings; Windows usernames pulled from `C:\Users\NAME\` paths
- **What** — detected file signature, size, and content-type signals (installer, config, save data, game asset, etc.)
- **When** — PE header compile timestamp (parsed directly from the COFF header), zip entry date range, and any date-like strings in the content
- **Where** — URLs, IP addresses, and Windows/Unix file paths found in embedded strings
- **Why** — the same content-purpose signals as "What," framed as inferred intent
- **How** — authoring/compiler tool fingerprints detected in strings (MSVC, .NET, Python, Node.js, Unity, GameMaker, Adobe, FFmpeg, common archivers, GIMP, Photoshop, Delphi)

Every card is explicitly labeled with a signal count and falls back to "no signal found" rather than guessing. A permanent disclaimer sits under the grid: **this is a heuristic estimate from static strings/timestamps/signature only — not a verified fact and not a security verdict.**
- *Use for:* a fast first-look summary before diving into hex/strings manually; surfacing the "interesting" signals (a stray email, a build timestamp, a suspicious URL) without having to scroll strings by hand.

### Download full report (.txt)
A button in the Profile section compiles everything the lab currently knows about the loaded file into a single downloadable plain-text report — including:
- Generation timestamp and a link back to this repo (`https://github.com/SauerNinja/Tooth-Puller`)
- File name, size, and detected signature
- SHA-1 / SHA-256 hashes
- The full Who/What/When/Where/Why/How profile
- Overall entropy score, extension-match result, and (for PE files) the parsed section table with per-section entropy and overlay-data check
- Current extraction chart field values
- Up to the first 50 extracted strings (with offsets), plus a total count
- A note clarifying the report is a static, read-only inspection summary — not a malware verdict or provenance proof

Everything is generated client-side via `Blob` + a synthetic download link; nothing is transmitted anywhere. Filename format: `tooth-puller-report_<original-filename>.txt`.
- *Use for:* keeping a portable record of what a file contained without keeping the file itself; sharing findings with someone else without re-uploading the binary; a paper trail before deciding what to do with a file.

### 1. Source — file & zip loading
Drop or browse to any file.
- **Zip archives** are unpacked in-browser (via JSZip) into a navigable folder tree — click into subfolders, click any entry to load it for inspection.
- **Any other file type** loads directly as a raw buffer.
- *Use for:* pulling one file out of a larger archive without extracting the whole thing to disk; browsing the contents of a `.zip`, `.docx`, `.xlsx`, `.pptx`, `.jar`, or `.apk` (all are zip containers under the hood) without unzipping.

### 2. Hex viewer
Classic offset / hex / ASCII columns, chunk-loaded (4096 bytes at a time) so large files stay responsive.
- *Use for:* manually spotting headers, padding, repeated structures, or text embedded in a binary; verifying byte-level file layout; sanity-checking output from the extraction chart below.

### 3. Extraction chart
A sequential field reader modeled directly on the original library's methods:

| Type | Reads | Matches |
|---|---|---|
| `Byte` | 1 byte | `readByte()` |
| `Word` | 2 bytes, uint16 little-endian | `readWord()` |
| `Long` | 4 bytes, uint32 little-endian | `readLong()` |
| `Bytes` | N raw bytes → shown as hex | `readBytes(size)` |
| `LString` | length-prefixed string (Creatures-style; 0xFF flag byte means "read next word as real length") | `readLString()` |

Fields read in order, each consuming from wherever the previous field left off — exactly like the Node.js library. Includes a **one-click "Load Creatures 2 preset"** that reproduces the exact field list from the original README example (moniker, name, parentage, birth/death timestamps, genus, chemicals at death, etc.), and a **"Copy result as JSON"** button.
- *Use for:* reverse-engineering the layout of any binary/save-file format you know or suspect the structure of; reading Creatures 2 history files directly; prototyping a parser before writing it as real code.

### 4. Strings & signatures
Three sub-tabs, all read-only, all doing what standard forensic utilities (`file`, `strings`, `exiftool`) do:

- **File signature** — checks the buffer's leading bytes ("magic bytes") against ~25 known formats: PNG, JPEG, GIF, BMP, ICO, WebP/WAV/AVI (RIFF), PDF, ZIP (and zip-based Office/Java/Android formats), Windows PE (.exe/.dll), ELF (Linux), Mach-O (macOS, 32/64-bit and universal), GZIP, BZIP2, 7-Zip, RAR, TAR, MP3 (ID3), OGG, FLAC, MP4/MOV, WebAssembly, XML, SQLite.
  - *Use for:* identifying a file's true type when the extension is missing, wrong, or deliberately misleading; confirming a downloaded file is what it claims to be before you open it in another program.
- **Extracted strings** — scans for printable-character runs (ASCII or UTF-16LE), configurable minimum length, offsets shown, capped at 5000 results, with a "copy all" button.
  - *Use for:* finding readable text buried in a binary — version numbers, URLs, file paths, config keys, debug strings, license text, embedded credentials left in by mistake (useful for *your own* binaries during a security review), or just recovering human-readable content from a proprietary save format.
- **Hash digest** — SHA-1 and SHA-256 via the browser's native Web Crypto API.
  - *Use for:* verifying a file hasn't been altered or corrupted; confirming two files are byte-identical; matching a file against a known-good checksum published by its author.

### 5. Structure
Four sub-tabs — the closest thing here to an actual x-ray of the file's internals:

- **Byte histogram** — canvas bar chart of how often each of the 256 possible byte values occurs across the whole file. Printable-ASCII bytes (32–126) draw in teal, everything else in amber, so text-heavy vs. binary-heavy content is visually obvious at a glance.
  - *Use for:* a fast eyeball check of what kind of data you're holding before digging into hex or strings.
- **Entropy map** — the file is split into ~400 sample windows, each scored with Shannon entropy (0–8 bits/byte), drawn as a horizontal strip: teal = low entropy, amber = moderate, rust = high (roughly >7.5 bits/byte, consistent with compression/encryption/packing). An overall entropy score and plain-language read-out sits underneath.
  - *Use for:* spotting a compressed or encrypted region hiding inside an otherwise plain file — a packed executable, an encrypted payload appended after legitimate data, an embedded compressed resource.
- **PE sections** — for Windows PE files (`.exe`/`.dll`) only: parses the actual COFF section table straight from the header (`.text`, `.data`, `.rsrc`, etc.), listing each section's raw size, file offset, and per-section entropy, flagging any section above the high-entropy threshold. Also detects **overlay data** — extra bytes appended after the last section the header declares, a common place to hide a second-stage payload (also used legitimately for code-signing and installer resources, so it's a flag, not a verdict).
  - *Use for:* understanding a Windows binary's internal layout; a first-pass check for packing or appended data before deciding whether to investigate further with a real disassembler.
- **Extension check** — compares the file's actual detected signature against what its filename extension claims, across roughly 30 known extension/signature pairings, and clearly flags a mismatch (e.g. a `.jpg` that's actually a PE executable — a classic disguise trick used in phishing attachments).
  - *Use for:* a quick sanity check before opening a file whose extension you don't fully trust.

---

## What else this approach can do (not yet built)

These are natural extensions of the same "look inside without modifying anything" idea — listed here so the direction is documented even before the code exists:

- **Byte-position scatter plot** — plot each byte's value against its offset. Headers, padding (flat runs), text, and compressed blobs all have visually distinct signatures. (The byte histogram and entropy map above cover related ground; this would be a third, complementary view.)
- **ELF / Mach-O section table parser** — the PE section parser above is Windows-only; ELF (Linux) and Mach-O (macOS) use different but analogous section/program-header structures and would need their own parser.
- **Embedded file carving** — scan the *entire* buffer (not just the start) for other known file signatures appearing mid-stream, to catch a file hidden inside another file (an image inside a Word doc's internals, a payload appended after a legitimate file's end-of-data marker). Partially related to the overlay-detection already built into PE sections, but general-purpose across any file type.
- **Two-file byte diff** — load a second file and highlight byte-level differences side by side. Useful for comparing two versions of a save file, patch, or binary to see exactly what changed.
- **EXIF / PNG chunk reader** — for JPEG/PNG specifically, parse and display metadata chunks in a readable table (camera make/model, GPS coordinates, capture timestamp, embedded color profile, software tag) instead of raw hex.
- **Bigger integer types** — 64-bit and signed integer reads, and big-endian variants, extending the current `Word`/`Long` (uint16/uint32 little-endian only) coverage.
- **String classification** — auto-tag extracted strings as URL / email / IP / path / base64 rather than a flat list (the Profile estimate above does a version of this already; a dedicated tagged view in the Strings tab is the natural next step).
- **Null-byte density map** — quick visual for sparse vs. dense binary regions (padding, alignment, empty resource slots).
- **Multi-file batch mode** — drop several files at once and get a summary table (type, size, hash, entropy) instead of inspecting one at a time.
- **PE import table listing** — list which Windows API functions an `.exe`/`.dll` references (separate from the section table already built — this would parse the import directory specifically). Purely informational (e.g. seeing `VirtualAlloc` + `WriteProcessMemory` + `CreateRemoteThread` together is a commonly-cited pattern) — a flag for the viewer to research further, never a verdict.
- **Double-extension / RTLO filename check** — flag classic phishing-attachment filename tricks (`invoice.pdf.exe`, right-to-left-override unicode tricks) — complementary to the signature/extension mismatch check already built.

Anything in the "sus-sniffing" category above stays limited to **static indicator flagging** — it should never execute, decrypt, unpack, or deobfuscate anything, and it should never produce a "malicious/clean" verdict. That's the job of dedicated engines with signature databases and sandboxing. This tool is meant as a first-look triage aid, not a scanner.

All of the above are passive, read-only inspection of files you already legally possess — the same category of tool as `file`, `exiftool`, `strings`, or a hex editor. The legal line to be mindful of is reverse-engineering specifically to **bypass copy protection/DRM** or to reconstruct proprietary source from decompiled code for a competing product — that's governed by license terms and varies by jurisdiction. Structural/metadata inspection, as implemented here, is standard, widely-used practice.

---

## Original library usage (Node.js)

```js
var file = new BinaryExtractor();

// Read in the creatures history file example
file.setBuffer(fs.readFileSync('./cr_0KVG'));

var result = {
	moniker             : file.readBytes(4),
	name                : file.readLString(),
	mother              : file.readBytes(4),
	mother_name         : file.readLString(),
	father              : file.readBytes(4),
	father_name         : file.readLString(),
	birthday            : file.readLString(),
	birthplace          : file.readLString(),
	owner_name          : file.readLString(),
	owner_url           : file.readLString(),
	owner_notes         : file.readLString(),
	owner_email         : file.readLString(),
	state               : file.readLong(),
	gender              : file.readLong(),
	age                 : file.readLong(),
	epitapth            : file.readLString(),
	grave_picture       : file.readLong(),
	time_of_death       : file.readLong(),
	time_of_birth       : file.readLong(),
	time_of_adolescence : file.readLong(),
	is_death_registered : file.readLong(),
	genus               : file.readLong(),
	long_stage          : file.readLong(),
	chemicals_at_death  : file.readBytes(256)
};
```

### Installation

    $ npm install binary-extractor

---

## License

MIT. Original library © 2016 Jelle De Loecker. Web extraction lab based on thoughts by Setvin Noether ([@SauerNinja](https://github.com/SauerNinja)).
