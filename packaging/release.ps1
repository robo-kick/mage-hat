# Tags the committed version and pushes the tag, which starts the release
# workflow. The only way a release is cut:
#
#   pwsh packaging\release.ps1
#
# The version is read from Cargo.toml as committed at HEAD, not from the
# working copy, so a bump that is edited but not committed cannot be tagged
# onto the old commit (0.21.1 was first tagged that way and its release run
# failed). HEAD must already be on origin, and an existing tag is never moved:
# a version that needs another try gets a new number.

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
try {
    $cargo = (git show HEAD:Cargo.toml) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw "Cannot read Cargo.toml at HEAD" }
    if ($cargo -notmatch '(?ms)^\[package\].*?^version\s*=\s*"([^"]+)"') {
        throw "No version in Cargo.toml [package] at HEAD"
    }
    $tag = "v$($Matches[1])"

    git diff --quiet HEAD -- Cargo.toml Cargo.lock
    if ($LASTEXITCODE -ne 0) {
        throw "Cargo.toml or Cargo.lock has uncommitted changes; commit the bump first"
    }

    git fetch --quiet --tags origin
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }
    if (git tag --list $tag) {
        throw "$tag already exists; bump the version in Cargo.toml instead of moving the tag"
    }
    if (-not (git branch -r --contains HEAD)) {
        throw "HEAD is not on origin yet; push the commit first"
    }

    git tag $tag HEAD
    if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
    git push origin $tag
    if ($LASTEXITCODE -ne 0) {
        git tag -d $tag | Out-Null
        throw "Pushing $tag failed; the local tag was removed"
    }
    Write-Host "Pushed $tag at $(git rev-parse --short HEAD); the release workflow builds it"
} finally {
    Pop-Location
}
