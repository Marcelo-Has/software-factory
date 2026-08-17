# app/

## Contract

`app/` holds the product's actual code. Together with [`project/`](../project/README.md),
it is the **only** place the factory writes to when operating on a product — the
factory core itself (`factory/`, `.claude/`, `.github/`) stays immutable per project.

This directory starts empty. Its subfolders (`web/`, `api/`, `worker/`) are born when
a profile is chosen for the product; there is no fixed stack assumed at this level.
