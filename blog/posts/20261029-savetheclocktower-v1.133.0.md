---
title: "Pulsar 1.133.0: El Niño edition"
author: savetheclocktower
date: 2026-10-29
category:
  - dev
tag:
  - release
---

You waited all summer for it… Pulsar 1.133.0 is available now!

<!-- more -->

## Pulsar v1.133.0: El Niño edition

Greetings from the west coast of the US, where I’m writing this in the middle of a sudden rainstorm! Much like this year’s El Niño, the 1.133.0 release of Pulsar is unusually strong; unlike this year’s El Niño, it probably won’t have any effect on agricultural yields or mountain snowpack.

Since you’ve had to wait longer than usual for this release, you’re rewarded with a larger-than-usual list of new features, many of which we’re quite excited about:

### Terminal features: directory tracking, hyperlinks, clickable file paths

We were pround to deliver a built-in `terminal` package for the first time as part of 1.132.0 back at the end of spring. Now we’ve enhanced it with some killer features:

* **Terminal “hyperlinks”** (as described in [OSC 8](https://terminfo.dev/extensions/osc-8-hyperlinks)) allow for arbitrary terminal text to act as a hyperlink to an arbitrary destination. The `terminal` package already supported clickable text that matched URL patterns, but this is different. Hovering over the hyperlinked text will reveal the linked URL (Rickroll protection!) and by default you must hold a modifier key while clicking, just as when you click on bare URLs.
* **Your terminals now track their working directories!** Previously, they knew the directory they started in, but lacked the shell integrations needed to keep track of changes to `cwd`. Now that shell integration is present (for `bash`, `zsh`, `fish`, and PowerShell, at least), we can do things we couldn’t before. The title of your terminal tab will change when `cwd` changes, and when you duplicate terminals (via split right, split left, etc.) new terminal’s `cwd` will match the current `cwd` of the original terminal.
* Tracking of `cwd` was needed in order to deliver a much more exciting feature: **clickable file paths**! Anything that looks like a path to a directory or a file — whether absolute or relative — can now be clicked in the same manner as hyperlinks and URLs. (Without `cwd` tracking, we wouldn’t be able to interpret relative file paths properly.) For instance, you can now run a linter against your code and click on any of the file paths it prints out in order to address the things it flags.

Some other terminal-related bug fixes:

* Ensured terminal commands like **Terminal: Open Bottom Dock** were opening in the correct places.
* Implemented alternative clipboard keybindings for Windows and Linux users, since the default <kbd>Ctrl-C</kbd> and <kbd>Ctrl-V</kbd> bindings have other meanings in terminal contexts. Copy and paste within a terminal are now bound to <kbd>Ctrl-Shift-C</kbd> and <kbd>Ctrl-Shift-V</kbd>, respectively, as is standard in most terminal emulators on Windows and Linux. (Since macOS uses <kbd>Cmd</kbd> as its primary modifier, it is unaffected.)

### Electron bump: 32.3.3

Until we’re caught up to Electron’s releases, every release of Pulsar will be jumping ahead as much as we can get away with. This won’t feel like a new feature necessarily, but it certainly will once we make larger leaps: each Electron bump delivers newer versions of Node and Chromium with more and better APIs and web features.

This release takes us to **Electron 32.3.3** and is **the last release that will support macOS 10.15 (Catalina)**. If you’re still on Catalina, it’s likely because your machine is too old to upgrade further… and that means that the next release of Pulsar likely won’t work on your machine. We don’t like ending support for older OSes, but since we’re tethered to Electron (and its functionality/security updates), it’s out of our hands.

Pulsar 1.134.0 will jump ahead to **Electron 37** and will itself be **the last release that supports macOS 11 (Big Sur)**. It will also be the first Linux release of Pulsar that runs natively on Wayland without requiring an `--ozone-platform` flag.

We don’t want to rug-pull on anyone, so these bumps are done deliberately and with plenty of warning. After 1.134.0, we should be able to go a bit faster with Electron version bumps, since (to date) no versions of Electron newer than 37 have the effect of ending support for any OS version.

### File-watching: new adapters and new architecture

Pulsar has many use cases for attaching a watcher to a certain directory so it can find out about any filesystem events that happen anywhere beneath it. We have two watchers:

1. a basic watcher that listens to specific files and directories non-recursively; and
2. a more feature-filled watcher that listens to all filesystem changes within a directory (no matter how deep).

The first watcher is used for crucial tasks like detecting when your open buffer have their contents changed on disk. The second watcher is available for packages to use however they like — an improvement over the distant past in which many Atom packages that needed file-watching had to handle it themselves, meaning lots of library redundancies and duplicated work. For instance, I maintained an ESLint package that would change some internal settings whenever it detected the project’s `.eslintrc` config file changed.

Ever since Pulsar split off from Atom, we’ve been using a library called `nsfw` (Node Sentinel File Watcher) to implement this file-watcher. But the infrastructure is in place to allow for **swappable file-watching implementations**; the Atom folks added it back when they were working on their own file-watcher library.

We don’t have many gripes with `nsfw`, but it’s good to take advantage of this modularity! Some users in our testing have had better experience with a different library named `@parcel/watcher`; this is the same library that VS Code uses. It’s got better support for ignored files (specifying via glob instead of via an exact list) and seems to perform a bit better in some unusual scenarios (like symlinks that create loops).

We’ve added `@parcel/watcher` as an option, though `nsfw` is still the default. But we’ve also taken this opportunity to overhaul the existing file-watching implementation so that it (like `@parcel/watcher`) **runs in a separate process**. Each window will have a single parallel process in charge of file-watching and will report back to the window via message passing.

This worker-process architecture mirrors VS Code’s approach to file-watching. We’ll be leaning on this approach in other areas, too, in order to reduce the number of libraries that need to run in Electron’s renderer process. (We [talked about this approach](https://blog.pulsar-edit.dev/posts/20260510-savetheclocktower-terminal-package/#durability) when we unveiled the `terminal` package in the last release; it reduces complexity and decreases the likelihood of application crashes.)

If you want to switch to the new file-watching implementation, check out the **Core: File System Watcher** setting. This setting existed before, but had only a single vestigial option in a drop-down menu. Now there are three: **Node Sentinel File Watcher**, **@parcel/watcher**, and **Default (let Pulsar decide)**. This last option is the default, and for now that means `nsfw` — but we may change this in the future. You can change the implementation whenever you want without even needing to reload the window.

### New “deleted” file state

In 1.132 we introduced a new “conflicted” state for pane items and editors especially. A file enters such a state if you (a) open it, (b) make changes (without saving), and then (c) have the file’s contents on disk change (usually from another program) in a way that clashes with the uncommitted modifications you’ve made.

Pulsar 1.133 adds a companion state: **“deleted**.” An editor can enter the deleted state if the user has opened a file for editing and that file later gets deleted by some other program. This is most likely to happen if you switch branches in version control — a file that exists in one branch may not exist in another. (Another long-present setting — `core.closeDeletedFileTabs` — will close such tabs altogether upon deletion, but it’s not enabled by default.)

We’ve always been able to detect such deletions, but until this release they also flipped the buffer into the “modified” state, since technically this is similar to a new file that has never been committed to disk. But a buffer whose contents were not changed by the user since the file deletion should be safe to close without an “Are you sure?” prompt! (If the buffer _has_ been modified, deletion of the backing file on disk will trigger the existing conflicted state; this will happen whether the modification occurs _before_ or _after_ the deletion.)

But in order to ease users into this new behavior, we’ve introduced a new setting to govern it; if you want _not_ to be prompted when abandoning a deleted file, **you must opt out of the existing behavior**. The setting is `editor.promptWhenAbandoningDeletedFile`; it defaults to `true`, but you can flip it to `false` if you want fewer prompts. (You can also find it by opening the settings pane, selecting the Editor tab, and finding **Experimental: Prompt When Abandoning Deleted File**.) Uncheck it and you’ll no longer be prompted to save deleted files _unless_ you made uncommitted changes.

For the built-in UI themes, deleted items have their own appearance in tabs to make them easy to spot:

<figure>
<img src="/assets/deleted-file-tab-example.png" alt="Screenshot of a text editor in a deleted state" height="126" />
</figure>

If you like this, enjoy! If you hate it, you can disable it by opening the settings for the `tabs` package and unchecking **Enable Item Status Coloring** (or set `tabs.enableItemStatusColoring` to `false` in your `config.cson`).

If you maintain a custom UI theme, you can style deleted tabs by targeting the `deleted` class name. Or, if you’re using a custom UI theme that isn’t actively maintained, you can add styles to your user stylesheet:

```less
@import "ui-variables";

.tab.deleted {
  color: @text-color-error;
  text-decoration: line-through;
}
```

As in the screenshot above, this example CSS styles the text of a deleted item’s tab to be red and adds a strike-through decoration. (Always a good idea to indicate status in ways other than color alone!)

### Other fixes and improvements

* There are new methods defined on the `atom` namespace for package authors and init-file hackers: `atom.showItemInFolder`, `atom.trashItem`, `atom.openExternal`, and `atom.openPath`. These do exactly what you think they do. Previously, packages (even built-in packages) had to use the deprecated `@electron/remote` package to perform these very common OS-integration tasks, but we’re trying to reduce reliance on `@electron/remote` to guard against future breakages.

* As usual, there are a handful of improvements to syntax highlighting and language integration overall. You’ll notice better highlighting of template strings in Python, better support for Perl’s class syntax, and much-improved support for C# in general.

* We fixed a regression in syntax highlighting performance on large files that had existed since 1.127.0. Since then, disruptive changes to big files resulted in a pause while the syntax highlighting caught up. That’s not how it used to work! We’ve now restored the proper behavior: the editing itself now stays smooth even if the highlighting lags a bit behind.

* We’ve updated some of the libraries we depend on for file-watching and Git integration in order to fix some rare crashes, especially on window reload and application exit.

* We’ve updated `ppm` to use the same Node version as Pulsar (20.18.1) and to fix some minor bugs and security issues.

* The Windows installer is now a bit prettier — with a branded sidebar image and a higher-resolution icon. It’s also better at cleaning up after itself during uninstallation, including removing any Pulsar-related context menu items in Windows Explorer.

### Call for new contributors

Pulsar is more than three years old as a project! But time means change, especially where our core team is concerned. Our long-time team member **@DeeDeeG** has stepped back from the project after several years of heroic devops work — setting up our CI matrix and our release build pipeline across three operating systems and two processor architectures. They will be missed!

It’s a perfect time to remind our userbase that, **if you’re interested in contributing, we’d love to have you!** We want to release more frequently than we have lately, but for that to happen we need more active participants. **The main bottleneck these days is code reviewers** — if we had more folks willing to look at pull requests, it’d allow us to move much faster and return to something like our previous monthly release cadence.

That’s why we’re eager to groom new contributors. I spend nearly all of my Pulsar-related free time on feature work… but I’d love to spend much more of it on mentoring and advice.

If you’ve written a community package, you have enough expertise to peruse the codebase and look over any open pull requests. If you want to enhance Pulsar with a new feature, but don’t quite feel qualified for the task, [jump into our Discord](https://discord.com/invite/7aEbB9dGRT) — we’re more than happy to talk it over with you and give advice on how to approach the challenge.

Even if you don’t think you can understand the code, you can help out by testing the _effects_ of pull requests: retrieve a CI build of Pulsar produced on a pull request branch and verify that it fixes something. It’s much easier to get that confirmation from a user of Windows or Linux than it is for me to fire up my Linux VM or try to test a build on my ancient Windows PC.



Happy coding, and see you amongst the stars!

— The Pulsar Team

---

### Pulsar

- Dispose more thoroughly when a `WASMTreeSitterLanguageMode` is destroyed [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1676)
- Update dependency dompurify to v3.4.17 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1651)
- Update dependency joi to v17.13.8 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1657)
- [language-gfm] Add inline injection for table cells [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1674)
- [language-clojure] Inject `cpp/raw` in Clojure dialect Jank [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/1670)
- Remove context menu and shell entries for Pulsar during uninstallation [@VeryUsual](https://github.com/pulsar-edit/pulsar/pull/1403)
- [welcome] Add macOS-specific guidance for installing shell commands [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1671)
- Skip downloading Chromium on test-and-upload CI jobs [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1672)
- Fix Invalid Point error when opening files without position [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/1412)
- Fix behavior of `atom.openPath` [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1667)
- [background-tips] Add `package.json` convention for tip registration and redistribute tips [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/1417)
- Fix Windows context menu options not persisting across restarts [redux] [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1666)
- Implement `editor:paste-without-reindenting` [@icecream17](https://github.com/pulsar-edit/pulsar/pull/1229)
- Ensure clicks on overlay scrollbars are not forwarded to the editor [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1665)
- [autocomplete-html] Update completion data [@catscarlet](https://github.com/pulsar-edit/pulsar/pull/1660)
- Fix `Cannot read properties of undefined (reading 'languageScopeId')` [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/1640)
- Bump the `terminal` package to v0.4.0 [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1663)
- Add new behaviors and appearance around deleted files [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1588)
- Fix markdown image `src` transformation in some usages [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1375)
- Tree-sitter fixes, 1.133.0 edition [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1577)
- Add missing `shell` methods on `atom` global [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1564)
- Bump `ppm` to latest version [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1659)
- Restore configurability to filesystem watchers… and add `@parcel/watcher` as an option [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1572)
- Ensure uniqueness of window state keys [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1509)
- Bump `@pulsar-edit/keyboard-layout` [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1653)
- fix: add new and old class syntax to perl grammar [@rawleyfowler](https://github.com/pulsar-edit/pulsar/pull/1648)
- Add back Windows editor tests [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1645)
- Bump Electron to 32.3.3 [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1600)
- Fix some outdated links to atom api and old pulsar docs [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/1548)
- Update notification issue template [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/1550)
- Fix the `--target`/`-t` option of `yarn dist`… and eliminate the positional `[platform]` argument [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1593)
- Update dependency postcss to v8.5.23 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1631)
- Update dependency minimatch to v5.1.8 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1642)
- Update dependency @babel/core to v7.29.6 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1628)
- Update dependency dompurify to v3.4.13 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1629)
- Update dependency markdown-it to v14 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1633)
- Update dependency joi to v17.13.6 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1641)
- [autocomplete-plus] Resolve an automatically-inserted suggestion… before insertion so that all its metadata is known (like `additionalTextEdits`) [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1638)
- Update dependency minimatch to v5 [SECURITY] [renovate (bot)](https://github.com/pulsar-edit/pulsar/pull/1634)
- Change `Pane::saveItems` to return a promise… that resolves when all items have been saved [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1596)
- Grab Linux binaries from artifacts rather than putting them in the cache [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1637)
- Add a branded sidebar image to the Windows installer and improve icon [@hovancik](https://github.com/pulsar-edit/pulsar/pull/1617)
- [autocomplete-plus] Ensure editor is re-focused… after the user selects a suggestion via the mouse [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1552)
- [settings-view] Fix rendering of setting descriptions with line breaks… so that each section is wrapped in a P tag when appropriate [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1620)
- Fix Markdown table-of-contents links [@hovancik](https://github.com/pulsar-edit/pulsar/pull/1613)
- settings-view: Improve search accuracy with native fuzzyMatcher [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/1416)
- 📝 Update docs: replace Atom references with Pulsar [ci skip] [@hovancik](https://github.com/pulsar-edit/pulsar/pull/1607)
- Pin to specific `node-gyp` [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1608)
- Pin to `windows-2022` when building binaries [@savetheclocktower](https://github.com/pulsar-edit/pulsar/pull/1599)
- Fixed opening up diffs for a worktree [@mauricioszabo](https://github.com/pulsar-edit/pulsar/pull/1556)
- Remove deprecated keyword from atom-ui styles [@Daeraxa](https://github.com/pulsar-edit/pulsar/pull/1549)
- Add `editor:select-subword` command [@asiloisad](https://github.com/pulsar-edit/pulsar/pull/1547)
- Set up ARM64 bin building in GitHub Actions [@DeeDeeG](https://github.com/pulsar-edit/pulsar/pull/1589)

### document-register-element

- Remove broken symlink [@DeeDeeG](https://github.com/pulsar-edit/document-register-element/pull/3)

### @pulsar-edit/fuzzy-native

- Rewrite in N-API [@savetheclocktower](https://github.com/pulsar-edit/fuzzy-native/pull/14)
- CI: Update Node, and use matrix with org var to set Node version for `tests` workflow [@DeeDeeG](https://github.com/pulsar-edit/fuzzy-native/pull/12)
- CI: Update `checkout` and `setup-node` actions to v6 [@DeeDeeG](https://github.com/pulsar-edit/fuzzy-native/pull/11)
- Use C++20 [@savetheclocktower](https://github.com/pulsar-edit/fuzzy-native/pull/13)

### @pulsar-edit/git-utils

- Add a `.d.ts` file… and some tests to ensure the `.d.ts` document everything in the `Repository` interface (and nothing that isn't there) [@savetheclocktower](https://github.com/pulsar-edit/git-utils/pull/9)
- Fix case sensitivity and realpath issues on Windows [@savetheclocktower](https://github.com/pulsar-edit/git-utils/pull/8)
- Add `Repository::getSymbolicRefTarget` and `Repository::getRemoteHead` [@savetheclocktower](https://github.com/pulsar-edit/git-utils/pull/7)
- Rewrite in N-API and update `libgit2` [@savetheclocktower](https://github.com/pulsar-edit/git-utils/pull/6)

### @pulsar-edit/keyboard-layout

- Fix crash on quit under X11 from uninitialized `waylandPoll` [@savetheclocktower](https://github.com/pulsar-edit/keyboard-layout/pull/8)

### @pulsar-edit/pathwatcher

- Introduce an alternative Linux implementation using `inotify`… _and_ an alternative Windows implementation! Both fit our feature set better than EFSW’s does and don't have the complexity of recursive watching [@savetheclocktower](https://github.com/pulsar-edit/node-pathwatcher/pull/7)
- Fix the atomic-save bug [@savetheclocktower](https://github.com/pulsar-edit/node-pathwatcher/pull/6)

### @pulsar-edit/spellchecker

- Add NPM publishing workflow [@savetheclocktower](https://github.com/pulsar-edit/node-spellchecker/pull/5)
- Decaf specs [@savetheclocktower](https://github.com/pulsar-edit/node-spellchecker/pull/4)
- Rewrite in N-API [@savetheclocktower](https://github.com/pulsar-edit/node-spellchecker/pull/3)

### @pulsar-edit/superstring

- Add ASan in CI and fix some bugs [@savetheclocktower](https://github.com/pulsar-edit/superstring/pull/23)
- Fix some bugs that cause minor annoyances… during the build process [@savetheclocktower](https://github.com/pulsar-edit/superstring/pull/22)

### terminal

- Define alternative `core:(copy|paste)` bindings on Windows/Linux… and notify the user about them the first time they use a keybinding that would ordinarily trigger one of those commands (so they know about the alternative keybindings!) [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/46)
- Run Playwright tests in CI for shell integration [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/45)
- Implement local path detection… including jumping to line/column when appropriate and interpreting relative paths in the context of `cwd` [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/42)
- Integrate with common shells in order to track `cwd`… and support some other future features [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/41)
- Support OSC 8 hyperlinks (and add tooltips) [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/25)
- Ensure `open-*-dock` commands open in the correct locations [@savetheclocktower](https://github.com/pulsar-edit/terminal/pull/39)

### @pulsar-edit/text-buffer

- Make `resurrect` idempotent in more scenarios… so that it's safer to call when you don't know much about the buffer [@savetheclocktower](https://github.com/pulsar-edit/text-buffer/pull/20)
- Make `resurrect` async… and make it behave more regularly with regard to pre-deletion state and post-deletion state [@savetheclocktower](https://github.com/pulsar-edit/text-buffer/pull/19)
- Add the ability to trigger “resurrection” logic… to make it easier for other tools to tell us when one of our `isDeleted()` buffers has been resurrected [@savetheclocktower](https://github.com/pulsar-edit/text-buffer/pull/17)
- Fix issue where `isDeleted` incorrectly returned `true`… when a buffer is newly created and set to a path that does not yet exist on disk [@savetheclocktower](https://github.com/pulsar-edit/text-buffer/pull/15)
- Enhance deleted state [@savetheclocktower](https://github.com/pulsar-edit/text-buffer/pull/13)
- Remove orphaned dependencies [@confused-Techie](https://github.com/pulsar-edit/text-buffer/pull/14)

### ppm

- Bump `ppm` to Node 20.18.1… and Electron 32.3.3 [@savetheclocktower](https://github.com/pulsar-edit/ppm/pull/182)
- Use `proxy-agent` directly rather than via `superagent-proxy` [@UberNick](https://github.com/pulsar-edit/ppm/pull/181)
- Fix `mv` not being able to move across volumes [@savetheclocktower](https://github.com/pulsar-edit/ppm/pull/180)
- Chore: Update ppm licence file [@Daeraxa](https://github.com/pulsar-edit/ppm/pull/177)
- Report errors from backend when a request fails (attempt 2) [@confused-Techie](https://github.com/pulsar-edit/ppm/pull/148)
- Add “transpiled JavaScript” template [@savetheclocktower](https://github.com/pulsar-edit/ppm/pull/161)
- Support branches other than "master" [@idleberg](https://github.com/pulsar-edit/ppm/pull/175)
- Eliminate mv, ncp, wrench dependencies [@2colours](https://github.com/pulsar-edit/ppm/pull/164)
- refactor: replace node url parser [@idleberg](https://github.com/pulsar-edit/ppm/pull/173)
- Fix specs on Windows [Clean] [@confused-Techie](https://github.com/pulsar-edit/ppm/pull/171)
