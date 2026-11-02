# Removing something from history

Sometimes a file should never have been committed: a secret, a licensed song, a
photo of a real person. Deleting it in a new commit is not enough — it stays in
the history and in every clone.

This document records the procedure used in this repository and, importantly,
its limits.

## Before you start

A history rewrite is destructive. Every commit after the change gets a new SHA,
and every clone breaks.

- Tell everyone who has a clone. They will have to reset (see the end).
- Make a backup: `git clone --mirror . ../format-factory.backup.git`
- Check what is tracked and where it appeared:

  ```bash
  git log --oneline --all -- path/to/file
  ```

## Procedure

### 1. Disable the things that block a rewrite

Branch protection blocks force pushes, and the tag ruleset blocks moving tags.

```bash
# Save the ruleset JSON first so you can recreate it
gh api repos/OWNER/REPO/rulesets/<id> > ruleset.json
gh api -X DELETE repos/OWNER/REPO/rulesets/<id>

# Immutable releases also lock their tags
gh api -X DELETE repos/OWNER/REPO/immutable-releases
```

Later, restore both. The exact JSON used in this repo is in the release
workflow history.

### 2. Rewrite

`git filter-branch` ships with git; `git-filter-repo` is faster but has to be
installed.

```bash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
  --index-filter 'git rm --cached --ignore-unmatch path/one path/two' \
  --prune-empty \
  --tag-name-filter cat \
  -- --all
```

- `--index-filter` runs on every commit and removes the paths from the index.
- `--prune-empty` drops commits that become empty.
- `--tag-name-filter cat` rewrites tags to the new commits.

### 3. Put the clean files back

If the files should exist (for example, replacement test media), the filter also
removed them from the latest commit. Copy them back and commit again.

```bash
git add path/
git commit -m "fix(test): replace fixtures with synthetic media"
```

### 4. Delete the backup refs and prune

```bash
rm -rf .git/refs/original
git reflog expire --expire=now --all
git gc --prune=now
```

### 5. Force push

```bash
# temporarily, in branch protection
allow_force_pushes: true

git push --force origin master
git push --force origin --tags
```

If a tag has a published release, GitHub may refuse to move it. That is what
happened here: releases created after immutability was enabled had locked tags.
The fix was to delete those releases (`gh release delete <tag> --yes
--cleanup-tag`) and let a new version create a fresh tag.

### 6. Restore the protections

Put back branch protection (`allow_force_pushes: false`), recreate the tag
ruleset, re-enable immutable releases.

### 7. Publish a new version

Old tags and releases are gone, so `releases/latest` is broken and the updater
has no target. Bump the patch version and publish.

## The limit: pull request refs

GitHub keeps the head of every pull request forever:

```
refs/pull/1/head
refs/pull/2/head
```

Those refs keep the old commits reachable. Anyone who knows the SHA can still
download the file from them, even after the rewrite.

**Only GitHub Support can remove them.** Open a ticket at
<https://support.github.com/contact> and ask them to purge unreachable objects
and pull request refs, explaining why (copyright, personal data, leaked secret).

So a rewrite removes the file from the branches and from what people see, but it
does not fully remove it. Plan accordingly: rotate the secret anyway, and contact
support when the content is sensitive.

## What everyone else must do

Their branches point to commits that no longer exist on the server. `git pull`
would merge two unrelated histories, which is worse than starting over.

```bash
git stash push -u -m "work in progress"   # if needed
git fetch --prune --tags --force
git reset --hard origin/master
git stash pop
git tag -d v0.1.0 v0.1.1 v0.1.2           # remove old local tags
```

If they had unpushed commits, make a backup branch before the reset:

```bash
git branch backup-before-rewrite
```

## Checklist

- [ ] Backup mirror created
- [ ] Ruleset and immutability disabled
- [ ] Paths removed from every commit
- [ ] Clean files re-added and committed
- [ ] `git log --all -- path` shows only the new commit
- [ ] Force push done for branches and tags
- [ ] Old releases deleted, new version published
- [ ] Protection, ruleset and immutability restored
- [ ] Team told to reset
- [ ] GitHub Support contacted (if the content was sensitive)

## Prevention

- Never commit media you did not create. See [testing.md](./testing.md).
- Keep secrets in CI secrets, never in `.env` files that are tracked.
- Enable push protection so a token is rejected before it reaches the server.
- Review the diff of the first commit of any new fixture folder.
