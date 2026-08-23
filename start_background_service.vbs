' Digital Kaam 2.0 Silent Background Launcher
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "python server.py", 0, False
WScript.Sleep 2000
WshShell.Run "cloudflared.exe tunnel --url http://localhost:3000", 0, False
