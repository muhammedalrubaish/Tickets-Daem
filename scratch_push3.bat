@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%LocalAppData%\GitHubDesktop\bin"
git add .
git commit -m "feat: add PWA manifest to support iOS Web Push notifications"
git push
