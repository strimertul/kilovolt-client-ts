# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 8.0.0 - 2023-04-18

### Added

- Added support for interactive authentication in kilovolt v10

### Changed

- Breaking API change: `wait()` is now `connect()` (this includes a behavior change, the constructor does not start the connection anymore), the signature for the constructor has changed.

## 7.1.0 - 2023-01-31

### Added

- Added method `deleteKey` for `kdel` commands

## 7.0.1 - 2023-01-27

### Fixed

- Removed unneded reference to `window` that prevented this from working inside web workers

## 7.0.0 - 2023-01-26

### Changed

- **BREAKING CHANGE**: Replaced EventEmitter with the builtin EventTarget. A thin wrapper should make transition more seamless but don't expect code to work out of the box 

## 6.5.0 - 2022-11-18

### Added

- Added support for internal command "_uid" (Kilovolt protocol v9)

### Fixed

- Version command was incorrectly specified as "kversion" instead of "version"

## 6.4.0 - 2022-02-23

### Added

- Added a third option to the constructor for options such as reconnection. Example:
  ```ts
  new Kilovolt("address", "password", { reconnect: true })
  ```

### Changed

- Failing authentication will now close the connection and print to console

## 6.3.2 - 2021-11-26

Added a `dist` folder with a precompiled versions for browsers/CDNs like jsdelivr

## 6.3.1 - 2021-11-26

Rewrote the entire package to be Deno-compatible and Deno-first.

## 6.0.0 - 2021-11-21

### Changed

- Added v6 compatibility, changed constructor to accept a password parameter for authentication
