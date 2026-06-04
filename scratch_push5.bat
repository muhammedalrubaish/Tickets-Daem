@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%LocalAppData%\GitHubDesktop\bin"
git add .
git commit -m "fix: move hooks after state declarations to resolve typescript scoping issue"
git push
