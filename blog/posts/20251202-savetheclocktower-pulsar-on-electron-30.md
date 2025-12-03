---
title: "Pulsar on Electron 30: what it means for you"
author: savetheclocktower
date: 2025-12-02
category:
  - dev
---

If you’re reading this, Pulsar’s long-planned upgrade to Electron 30 is finally upon us. This applies to rolling releases on or after December 2 _and_ to regular release versions 1.131.0 and later.

We expect that lots of users will experience no downside to this upgrade whatsoever. But some community packages might need updates to work with Electron 30, so please read on to find out how this release could affect you!

<!-- more -->

[A few months ago](/posts/20250630-savetheclocktower-pulsar-next-testing/), I laid out what it means whenever we upgrade Electron to a newer version:

* code runs in a newer Chromium environment and can take advantage of newer web features;
* code runs in a newer Node environment (in this case, version 20 instead of version 14!) and can take advantage of newer Node features; and
* perhaps most importantly, you may notice substantial improvements in performance.

But this upgrade brings us from Electron 12 to Electron 30, so it’s a bigger change than usual. If you want, you can go back through old blog posts to learn why this was a challenging upgrade from our perspective. But here’s how it may affect you as a user:

## (Optionally) back up your home folder

We’ve tested this upgrade both with a clean home folder (the folder named `.pulsar` that holds your settings and packages, among other things) and with a pre-existing home folder, and both have worked just fine in our tests.

That said, if you’re still nervous about this upgrade, do one thing before you proceed with anything else: **back up your home folder**. It’s dead-simple to do and acts as the ultimate “abort” button: in the unlikely event of something going haywire, restoring the previous state is as simple as replacing your Pulsar home folder with the backup.

By default, your home folder lives at `~/.pulsar` on macOS/Linux and `%USERPROFILE%\.pulsar` on Windows. You can also open a file explorer window at the root of your home folder by opening the settings and clicking the <kbd>Open Config Folder</kbd> button at the bottom of the sidebar; that should identify your home folder correctly even if it’s different from the default.

If you don’t already have a more comprehensive backup strategy for all your system data, consider at least creating a compressed backup of your home folder once in a while just so you can preserve the exact state of things — temporary/unsaved files, the module compilation cache, and so on.

## Handle possible package incompatibilities

![incompatible-packages status bar](https://docs.pulsar-edit.dev/img/atom/incompatible-packages-indicator.png)

After you upgrade, you might see the icon above in your status bar. It’s put there by [the core `incompatible-packages` package](https://docs.pulsar-edit.dev/troubleshooting-pulsar/checking-for-incompatible-packages/), whose job is exactly what it sounds like: detecting packages that are incompatible with the current version of Pulsar.

The only packages that _may_ be flagged after this upgrade are packages that use Node libraries with _native module_ bindings. It’s not worth doing a deep dive into what that means… but if you had to consult [this documentation page](https://docs.pulsar-edit.dev/getting-started/dependencies-for-some-community-packages/) when installing a community package, it’s likely to be affected by this upgrade.

If you see the icon above, click on it to read details about the incompatibility. You can expect one of several messages to be shown, but most commonly:

* The message may suggest that a library needs to be recompiled for the newer version of Electron. If the <kbd>Rebuild Packages</kbd> button is enabled, click it; when it’s done rebuilding, you can reload your window (or relaunch Pulsar) to see if that fixed the incompatibility. If you no longer see the “bug” icon in your status bar, you’re probably good to go.
* If it says something about “use of non-context-aware module in renderer,” that’s a bigger problem that requires a bigger fix. If this happens to you, please report it in [this megathread](https://github.com/pulsar-edit/pulsar/issues/1383) and we’ll figure out what we can do about it. Odds are good we’ll be able to fork the package and deliver a working version, or else point you to a similar package that does the same thing.

### Known packages with issues

Of the packages that are known to be affected, the most common are `hydrogen` and `x-terminal-reloaded`:

* [`hydrogen`](https://packages.pulsar-edit.dev/packages/hydrogen) depends on an old version of `zeromq` that does not work in newer Electron.

  The bad news is that the `hydrogen` package is no longer maintained by its original authors; the good news is that @asiloisad, our prolific community package contributor, has built a fork called [`hydrogen-next`](https://packages.pulsar-edit.dev/packages/hydrogen-next) that ought to be a drop-in replacement.

* [`x-terminal-reloaded`](https://packages.pulsar-edit.dev/packages/x-terminal-reloaded) is the only actively maintained terminal package (for now!) and is relied on by many to provide a built-in terminal. It once relied on a very old version of the `node-pty` package that was incompatible with newer Electron.

  The good news is that we anticipated this a while back and worked with @Spiker985 (maintainer of `x-terminal-reloaded`) to update to a newer `node-pty` version; macOS and Linux users should experience no issues with this package as long as it’s up to date.

  The bad news is that Windows users will likely run into [another issue](https://github.com/Spiker985/x-terminal-reloaded/issues/173). We’ve got [a potential fix for this issue](https://github.com/Spiker985/x-terminal-reloaded/pull/175) in the works, and if you know your way around the Node ecosystem and are a Windows user, we could use your help testing it!

  The better news is that Pulsar users will soon have a much simpler option for a cross-platform terminal package, but you’ll have to wait just a bit longer for that announcement.

## Other issues

I’ve been running some version of Pulsar on Electron 30 for more than a year, and at least a dozen other users have been beta-testing it for months. That said, if you run into problems that aren’t covered above, please [report them in the megathread](https://github.com/pulsar-edit/pulsar/issues/1383) and we’ll get to the bottom of it.

Remember that you can always revert to earlier versions of Pulsar via the [GitHub releases](https://github.com/pulsar-edit/pulsar/releases) page.

## What’s next?

Finally delivering this upgrade is a big load off our backs, but the job’s not done. We picked Electron 30 last year just to have a target to fixate on, but Electron’s already up to version 39! So you can expect us to gradually play catch-up over the next few releases.

Luckily, future Electron upgrades should be nowhere near as disruptive as this one. The worst thing about it is that catching up to Electron 39 will drop official support for some older operating systems:

* Electron 33 drops support for macOS 10.15 (Catalina).
* Electron 38 drops support for macOS 11 (Big Sur).

We regret this, but Electron apps are beholden to Chromium’s support matrix. If Chromium drops support for an operating system, it’s _dropped_. If this will affect you, you’ll at least be able to use older versions of Pulsar indefinitely. If it affects enough people, we might explore a custom release channel of Pulsar that tries to deliver new features while maintaining a broadly compatible Electron version.

But that’ll all come into focus in the future. For now, happy coding, and see you amongst the stars!
