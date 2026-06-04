@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%LocalAppData%\GitHubDesktop\bin"
git add .
git commit -m "feat: enable web push notifications and check delayed tickets"
git push
