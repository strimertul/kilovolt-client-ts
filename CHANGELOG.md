# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.0.1] - 2023-01-27

### Fixed

- Removed unneded reference to `window` that prevented this from working inside web workers

## [7.0.0] - 2023-01-26

### Changed

- **BREAKING CHANGE**: Replaced EventEmitter with the builtin EventTarget. A thin wrapper should make transition more seamless but don't expect code to work out of the box 

## [6.5.0] - 2022-11-18

### Added

- Added support for internal command "_uid" (Kilovolt protocol v9)

### Fixed

- Version command was incorrectly specified as "kversion" instead of "version"

## [6.4.0] - 2022-02-23

### Added

- Added a third option to the constructor for options such as reconnection. Example:
  ```ts
  new Kilovolt("address", "password", { reconnect: true })
  ```

### Changed

- Failing authentication will now close the connection and print to console

## [6.3.2] - 2021-11-26

Added a `dist` folder with a precompiled versions for browsers/CDNs like jsdelivr

## [6.3.1] - 2021-11-26

Rewrote the entire package to be Deno-compatible and Deno-first.

## [6.0.0] - 2021-11-21

### Changed

- Added v6 compatibility, changed constructor to accept a password parameter for authentication

[6.5.0]: https://github.com/strimertul/kilovolt-client-ts/compare/v6.4.0...v6.5.0
[6.4.0]: https://github.com/strimertul/kilovolt-client-ts/compare/v6.3.2...v6.4.0
[6.3.2]: https://github.com/strimertul/kilovolt-client-ts/compare/v6.3.1...v6.3.2
[6.3.1]: https://github.com/strimertul/kilovolt-client-ts/compare/v6.0.0...v6.3.1
[6.0.0]: https://github.com/strimertul/kilovolt-client-ts/compare/v5.0.1...v6.0.0