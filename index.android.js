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
  RefreshControl,
  ListView,
  TextInput,
  AsyncStorage,
} from 'react-native';
import RNFS from 'react-native-fs'

import {StationAverageGraph} from './StationAverageGraph.js'


export const dataPath = "/sdcard/station.data"
export const days_name = [
  "Dim",
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
]
export const days_color = [
  "#042423",
  "red",
  "blue",
  "#64dd17",
  "#FF00FF",
  "#FF6600",
  "#29b6f6",
]

const split_by_null = (array) => {
  const skip_null = (array_tmp, start) => {
    for (let i = start; i < array_tmp.length; i++) {
      if (array_tmp[i] !== null) {
        return i
      }
    }
    return array_tmp.length
  }

  const find_next_null = (array_tmp, start) => {
    for (let i = start; i < array_tmp.length; i++) {
      if (array_tmp[i] === null) {
        return i
      }
    }
    return array_tmp.length
  }

  const out = []
  let idStart = 0
  let idEnd = -1
  while (idEnd < array.length) {
    idStart = skip_null(array, idEnd + 1)
    idEnd = find_next_null(array, idStart)
    const slice = array.map((value, id) => {
      if (id < idStart || id > idEnd) {return null}
      else {return value}
    })
    if (!slice.some((value) => value !== null)) {
      return out
    }
    out.push(slice)
  }
  return out
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
      refreshing: true,
    }
    this.reload_data(30)
  }


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
      station.data.datasets = station.data.datasets.map((dataDay, id) => {
        let intervalNumber = 0
        let refTime = new Date(2016, 1, 1, 0, 0, 0, 0)
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
          label: days_name[id],
          config: {
            color: days_color[id],
            lineWidth: 2,
            drawValues: false,
            drawCircles: false,
            drawCubic: false,
            highlightColor: days_color[id],
            drawFilled: true,
            fillColor: days_color[id],
            fillAlpha: 0,
          },
        }
      })
      const dataSetsWithNull = station.data.datasets.slice(0)
      station.data.datasets = []
      let j = 0
      for (let i = 0; i < dataSetsWithNull.length; i++) {
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

  get_station_name = (stationNames, number, actualName) => {
    if (stationNames[number.toString()]) {
      return stationNames[number.toString()]
    } else {
      stationNames[number.toString()] = actualName
      return actualName
    }
  }

  add_now_dataset = (out, number) => {
    const today = new Date(Date.now())
    let dayIsEnded = false
    const todayDataSet = {
      yValues: out[number].data.xValues.map((time) => {
        const hour = time.split(":")[0]
        const min = time.split(":")[1]
        if (today.getHours() == hour) {
          dayIsEnded = true
        }
        if ((dayIsEnded && today.getMinutes() < min) || dayIsEnded && today.getHours() != hour) {
          dayIsEnded = false
          return Math.floor(out[number].available_bikes)
        } else {
          return null
        }
      }),
      label: "now",
      config: {
        color: "yellow",
        lineWidth: 2,
        drawValues: false,
        drawCircles: true,
        highlightColor: "yellow",
        circleRadius: 10,
        circleColor: days_color[today.getDay()],
        circleColorHole: "#F8F8F8",
        drawFilled: true,
        fillColor: "yellow",
        fillAlpha: 0,
      },
    }
    out[number].data.datasets = out[number].data.datasets.concat(todayDataSet)
  }

  manage_null_value = (data) => {
    data.datasets = data.datasets.filter((dataset) =>
    dataset.yValues.some((yvalue) => yvalue !== null)) // remove empty datasets
    const tmpDatasets = data.datasets.slice(0)
    for (let id = 0; id < tmpDatasets.length; id++) {
      const dataset = data.datasets[id]
      if (dataset.yValues.some((value) => !value)) {
        const yValuesSplited = split_by_null(dataset.yValues)
        const newDatasets = yValuesSplited.map((yvalues) => {
          const newDataset = {...dataset}
          newDataset.config = {...dataset.config}
          newDataset.yValues = yvalues.slice(0)
          return newDataset
        })
        data.datasets[id].yValues = [null]
        data.datasets = data.datasets.concat(newDatasets)
      }
    }
    data.datasets = data.datasets.filter((dataset) => {
      return dataset.yValues.some((yvalue) => yvalue !== null)}) // remove splited datasets
    return data.datasets
  }

  parse_data = (intervalMin, brutData, stationNames) => { // Tri par STATION
    const out = []
    const notDuplicatedBrutData = brutData.filter((data) => {
      if (!out[data.number]) {
        out[data.number] = {
          title: this.get_station_name(stationNames, data.number, data.name.split(' - ').slice(1).join(" - ")),
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
      const day = out[data.number].data.datasets[data_date.getDay()] 
      if (!day.length || day[day.length - 1].date !== data.last_update) {
        out[data.number].data.datasets[data_date.getDay()].push(
          {aviable: data.available_bikes, date: data.last_update}
        )
        return true
      } else {
        return false
      }
    })
    return Promise.all(out.map((station, id) => {
      return fetch(`https://api.jcdecaux.com/vls/v1/stations/${id}?contract=Toulouse&apiKey=0c707a2d7a2e439fca48906a35c3f8c45efb5bc9`).then((res) => {
        return res.json()
      })
    })).then((values) => {
      const parsedData = this.manage_data(out, intervalMin)
      values.forEach((stationData) => {
        if (stationData) {
          parsedData[stationData.number].available_bikes = stationData.available_bikes
          parsedData[stationData.number].name = stationData.name
          parsedData[stationData.number].number = stationData.number
          parsedData[stationData.number].address = stationData.address
          parsedData[stationData.number].position = stationData.position
          parsedData[stationData.number].status = stationData.status
          parsedData[stationData.number].bike_stands =  stationData.bike_stands
          if (parsedData[stationData.number].data) {
            parsedData[stationData.number].data.datasets = this.manage_null_value(parsedData[stationData.number].data)
          }
          this.add_now_dataset(parsedData, stationData.number)
        }
      })
      return {
        parsedData: parsedData,
        notDuplicatedData: notDuplicatedBrutData,
      }
    })
  }

  save_file = (data, filename) => {
    let jsonData = {
      data: data,
    }
    jsonData = JSON.stringify(jsonData)
    jsonData = jsonData.slice(0, -2)
    jsonData = jsonData.concat(",\n")
    RNFS.writeFile(filename, jsonData)
  }

  reload_data = (intervalMin) => {
      RNFS.readFile(dataPath).then((content) => {
      jsonContent = content.slice(0, -2) + "]}"
      const parsed = JSON.parse(jsonContent)
      this.save_file(parsed, "/sdcard/station.data.backup")
      AsyncStorage.getItem('@Velaverage:stationNamesPerso', (err, stationNamesPerso) => {
          if (!stationNamesPerso) {
            stationNamesPerso = {}
          }
          else {
            stationNamesPerso = JSON.parse(stationNamesPerso)
          }
          this.parse_data(intervalMin, parsed.data, stationNamesPerso).then((outData) => {
            AsyncStorage.setItem('@Velaverage:stationNamesPerso', JSON.stringify(stationNamesPerso))
            this.save_file(outData.notDuplicatedData, dataPath)
            this.setState({refreshing: false, datas: this.state.datas.cloneWithRows(outData.parsedData)})
          })
        })
    })
  }

  onRefresh = () => {
    this.setState({refreshing: true}, () => this.reload_data(30))
  }

  render() {
    const refreshControl = (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={() => this.onRefresh()}
      />
    )
    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          dataSource={this.state.datas}
          enableEmptySections={true}
          refreshControl={refreshControl}
          renderRow={(station) => {
            return (
              <StationAverageGraph station={station}/>
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
  graphTitle: {
    color: "black",
    marginLeft: 5,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    height: 40,
  },
});

AppRegistry.registerComponent('Velaverage', () => Velaverage);


//TODO: view station suivi / add station 
//choix de la precision
//choix du jours (par station ?)
