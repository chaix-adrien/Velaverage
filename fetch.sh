cd /sdcard/
if sh ./ping_api.sh; then
    log -p v -t "testshell" "testshell 1"
    while read line; do
	curl -k "https://api.jcdecaux.com/vls/v1/stations/$line?contract=Toulouse&apiKey=0c707a2d7a2e439fca48906a35c3f8c45efb5bc9" >> station.data && echo "," >> station.data;
    done < stationList.data
    log -p v -t "testshell Cat" `cat station.data`
fi
