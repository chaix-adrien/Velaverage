/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView
} from 'react-native';
import RNFS from 'react-native-fs'
import {LineChart} from 'react-native-mp-android-chart';

const dataPath = "/sdcard/station.data"
const days_name = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
]
const days_color = [
  "red",
  "blue",
  "green",
  "yellow",
  "#042423",
  "#76352534",
  "cyan",
]

const legend = {
  enabled: true,
  fontStyle: 1,
  textColor: '#458DCB',
  textSize: 11,
  position: 'BELOW_CHART_LEFT',
  form: 'CIRCLE',
  formSize: 10,
  xEntrySpace: 5,
  yEntrySpace: 5,
  formToTextSpace: 3,
  wordWrapEnabled: true,
  maxSizePercent: 0.5,
  custom: {
    colors: days_color,
    labels: days_name,
  }
}

const get_minute_diff = (t1, t2) => {
  const act = new Date(t2)
  return (act.getHours() * 60 + act.getMinutes()) - (t1.getHours() * 60 + t1.getMinutes())
}

class Velaverage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      datas: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
    }
    this.reload_data(5)
  }

  //[station]:
    //[jours]
    // [moyenne par interval]

  /*
  dataStations: [
  stationName: ""
  stationNumber: x

  ]
  */

  manage_min_max = (station) => {
    const limitDataset = {...station.data.datasets[0]}
    limitDataset.config = {...station.data.datasets[0].config}
    limitDataset.config.color = "#00000000"
    limitDataset.config.fillColor = "#00000000"
    limitDataset.config.highlightColor = "#00000000"
    limitDataset.config.drawFilled = false
    limitDataset.yValues = [...station.data.datasets[0].yValues]
    limitDataset.yValues[0] = 0
    limitDataset.yValues[1] = station.bike_stands
    station.data.datasets = station.data.datasets.concat(limitDataset)
  }
  
  manage_data = (out, intervalMin) => {
    out.forEach((station) => {
      let refTime = new Date(2016, 1, 1, 0, 0, 0, 0)
      station.data.datasets = station.data.datasets.map((dataDay, id) => {
        let intervalNumber = 0
        const daySorted = []
        while (refTime.getDay() === 1) {
          for (let i = 0; i < dataDay.length; i++) {
            if (dataDay[i]) {
              if (get_minute_diff(refTime, dataDay[i].date) < intervalMin) {
                if (!daySorted[intervalNumber]) {
                  daySorted[intervalNumber] = []
                }
                daySorted[intervalNumber].push(dataDay[i].aviable)
                dataDay[i] = null
              }
            }
          }
          if (!daySorted[intervalNumber]) {
            daySorted[intervalNumber] = null
          }
          intervalNumber++
          refTime = new Date(2016, 1, 1, 0, intervalMin * intervalNumber, 0, 0)
        }

        const dataDaySorted = daySorted.map((dayData) => {
          if (dayData) {
            const size = dayData.length
            return dayData.reduce((v1, v2) => v1 + v2, 0) / size
          } else {
            return null
          }
        })
        return {
          yValues: dataDaySorted,
          label: days_name[id - 1],
          config: {
            color: days_color[id - 1],
            lineWidth: 2,
            drawValues: false,
            drawCircles: false,
            drawCubic: false,
            highlightColor: days_color[id - 1],
            drawFilled: true,
            fillColor: days_color[id - 1],
            fillAlpha: 0,
          },
        }
      })
      const dataSetsWithNull = station.data.datasets.slice(0)
      station.data.datasets = []
      let j = 0
      for (let i = 0; i < dataSetsWithNull.length; i++) {
        console.log()
        if (dataSetsWithNull[i]) {
          station.data.datasets[j++] = dataSetsWithNull[i]
        }
      }
      this.manage_min_max(station)
    })
    return out
  }

  get_xValues = (interval) => {
    let date = new Date(2016, 1, 1, 0, 0, 0, 0)
    const out = []
    let i = 0
    while (date.getDay() === 1) {
      out.push(date.getHours() + ":" + date.getMinutes())
      date = new Date(2016, 1, 1, 0, ++i * interval, 0, 0)
    }
    return out
  }

  parse_data = (intervalMin, brutData) => {
    const out = []
    brutData.forEach((data) => {
      if (!out[data.number]) {
        out[data.number] = {
          title: data.name.split(' - ')[1],
          name: data.name,
          address: data.address,
          position: data.position,
          bike_stands: data.bike_stands,
          status: 'UNKNOWN',
          data: {
            xValues: this.get_xValues(intervalMin),
            datasets: [],
          },
        }
      }
      const data_date = new Date(data.last_update)
      if (!out[data.number].data.datasets[data_date.getDay()]) {
        out[data.number].data.datasets[data_date.getDay()] = []
      }
      out[data.number].data.datasets[data_date.getDay()].push(
        {aviable: data.available_bikes, date: data.last_update}
      )
    })
    return this.manage_data(out, intervalMin)
  }

  reload_data = (intervalMin) => {
    RNFS.readFile(dataPath).then((content) => {
      jsonContent = content.slice(0, -2) + "]}"
      const parsed = JSON.parse(jsonContent)
      this.setState({datas: this.state.datas.cloneWithRows(this.parse_data(intervalMin, parsed.data))})
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          dataSource={this.state.datas}
          enableEmptySections={true}
          renderRow={(station) => {
            console.log(station.title)
            return (
              <View>
                <Text>{station.title}</Text>
                <LineChart
                  style={{height:300, width: 400}}
                  legend={legend}
                  data={station.data}
                  drawGridBackground={true}
                  borderColor={'teal'}
                  borderWidth={1}
                  drawBorders={true}
                  touchEnabled={true}
                  dragEnabled={true}
                  scaleEnabled={true}
                  scaleXEnabled={true}
                  scaleYEnabled={true}
                  pinchZoom={true}
                  doubleTapToZoomEnabled={true}
                  dragDecelerationEnabled={true}
                  dragDecelerationFrictionCoef={0.99}
                  keepPositionOnRotation={false}
                  description={{text: ''}}
                />
              </View>
            )
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('Velaverage', () => Velaverage);


//TODO: Add limit
