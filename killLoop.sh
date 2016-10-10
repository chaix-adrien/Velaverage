list=`ps | grep u0_a310 | grep sh`
count=$((0))
for word in $list; do
  count=$((count+1))
  if (($count % 9 == 2)); then
    kill $word
    log -p v -t "Velaverage" "kill process: $word"
  fi
done
