# Working in mage-hat

- On Windows run cargo from PowerShell: Git Bash shadows `link.exe` and the link step fails.
- Edit files with the Bash or editor tools, not PowerShell `Set-Content`, which rewrites the encoding.
- Cut a release with `powershell -File packaging\release.ps1` (pwsh is not installed here) after the version bump is committed and pushed; never tag by hand. It tags the version committed at HEAD and refuses a tag that already exists.
