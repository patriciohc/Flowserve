@ECHO ON
call forever stopall 
call forever -a -l C:\forever_logs\forever.log -o C:\forever_logs\app.log -e C:\forever_logs\app-err.log start server\index.js
