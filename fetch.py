import subprocess

def writeLog(str):
  subprocess.Popen(["log", "-p", "v", "-t", "Velaverage", str])

writeLog("TestPython")
