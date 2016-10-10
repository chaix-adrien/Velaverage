cd /sdcard/
while true
  do
  echo "launch"
  if sh ./ping_api.sh; then
    log -p v -t "Velaverage" "start Get Station"
    while read line; do
     curl -k "https://api.jcdecaux.com/vls/v1/stations/$line?contract=Toulouse&apiKey=0c707a2d7a2e439fca48906a35c3f8c45efb5bc9" >> station.data && echo "," >> station.data;
    done < stationList.data
    time=`date +"%T"`
    log -p v -t "Velaverage" "GetStationInfo end: $time"
  fi
  sleep $1
done
