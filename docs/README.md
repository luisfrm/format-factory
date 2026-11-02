# Docs

This folder explains how Format Factory is built, tested, released and kept
secure. Everything here is written in plain English, because these notes are
also meant for contributors who do not speak Spanish.

The app itself is in Spanish. These documents are not.

## Index

| Document | Read it when… |
|---|---|
| [architecture.md](./architecture.md) | You need to know where code goes, or how the UI talks to Rust. |
| [development.md](./development.md) | You just cloned the repo and want to run the app. |
| [release.md](./release.md) | You want to publish a version. |
| [auto-updates.md](./auto-updates.md) | You touch the updater, the signing keys or `latest.json`. |
| [testing.md](./testing.md) | You add a test, or you need test media. |
| [security.md](./security.md) | You change CI, permissions or anything that ships to users. |
| [pull-requests.md](./pull-requests.md) | You are reviewing or sending a pull request. |
| [history-rewrite.md](./history-rewrite.md) | Something sensitive was committed and must be removed. |

## Also useful

- [`INSTALL.md`](./INSTALL.md) — end-user install instructions per platform.
- [`../README.md`](../README.md) — project overview and commands.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution rules (Spanish).

## A note on language

The UI, the commit messages and `README.md` are in Spanish. The code comments
mix both. These docs are English so the project can be read by more people.

If a doc and the code disagree, the code wins. Fix the doc.
