/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  RefreshControl,
  ListView,
  AsyncStorage,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import PubSub from 'pubsub-js'

import {StationAverageGraph} from './StationAverageGraph.js'
import {getFollowedStation} from '../index.android.js'
import colors from '../colors.json'
import config from '../config.json'

export const apiKey = "0c707a2d7a2e439fca48906a35c3f8c45efb5bc9"

export const dataPath = "/sdcard/station.data"


class GraphicsView extends Component {
  constructor(props) {
    super(props)
    let today = new Date(Date.now())
    today = (today.getDay() + 6) % 7
    this.state = {
      datas: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
      refreshing: true,
      activeDay: config.days_name.map((n, id) => (id === today || id === today + 1) ? true : false),
      datasRef: null,
      dragRefresh: false,
    }
    this.closeAllEditCallback = []
  }

  componentWillMount() {
    this.onRefresh()
  }

  shouldComponentUpdate(nProps, nState) {
    if (nProps.followedStations !== this.props.followedStations && nProps) {
      this.state.refreshing = true
      this.onRefresh()
    }
    return true
  }

  get_now_dataset = (sample, avialables_bikes) => {
    const today = new Date(Date.now())
    let dayIsEnded = false
    return {
      yValues: sample.xValues.map((time) => {
        const hour = time.split("h")[0]
        const min = time.split("h")[1]
        if (today.getHours() == hour) {
          dayIsEnded = true
        }
        if ((dayIsEnded && today.getMinutes() < min) || dayIsEnded && today.getHours() != hour) {
          dayIsEnded = false
          return Math.floor(avialables_bikes)
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
        circleColor: colors.days_color[(today.getDay() + 6) % 7],
        circleColorHole: "#F8F8F8",
        drawFilled: true,
        fillColor: "yellow",
        fillAlpha: 0,
      },
    }
  }

  manage_min_max = (station) => {
    const limitDataset = {...station.data.datasets[0]}
    limitDataset.config = {...station.data.datasets[0].config}
    limitDataset.config.color = "#00000000"
    limitDataset.config.fillColor = "#00000000"
    limitDataset.label = "limit"
    limitDataset.config.highlightColor = "#00000000"
    limitDataset.config.drawFilled = false
    limitDataset.yValues = [...station.data.datasets[0].yValues]
    limitDataset.yValues[0] = 0
    limitDataset.yValues[1] = station.bike_stands
    station.data.datasets = station.data.datasets.concat(limitDataset)
  }

  fetch_data = (followedStations, time_start, time_end, scale, days) =>  {
    return Promise.all(followedStations.map((followedStation) => {
      const header = {
        method: 'POST',
        body: JSON.stringify({
          time_start: time_start,
          time_end: time_end,
          scale: scale,
          days: days,
        }),
      }
      return Promise.all([
          fetch(`https://api.jcdecaux.com/vls/v1/stations/${followedStation.number}?contract=Toulouse&apiKey=${apiKey}`).then((res) => res.json()),
          fetch("https://api.pata.ovh/station/" + followedStation.number, header).then(res => res.json()),
        ]).then((res) => {
          return {
            customApi: res[1],
            api: res[0],
          }
        })
      })
    )
  }

  load_data = (followedStations, time_start, time_end, scale, days) =>  {
    this.fetch_data(followedStations, time_start, time_end, scale, days).then((reps) => {
      let out = reps.map((rep, id) => {
        const station = {
          title: followedStations[id].name,
          number: followedStations[id].number,
          bike_stands: rep.api.bike_stands,
          available_bike_stands: rep.api.available_bike_stands,
          available_bikes: rep.api.available_bikes,
          data: {
            datasets: rep.customApi.days.map((day) => {
              return {
                  yValues: day.stats.map((stat) => stat.moy),
                  label: config.days_name[day.day],
                  config: {
                    color: colors.days_color[day.day],
                    lineWidth: 2,
                    drawValues: false,
                    drawCircles: false,
                    drawCubic: false,
                    highlightColor: colors.days_color[day.day],
                    drawFilled: true,
                    fillColor: colors.days_color[day.day],
                    fillAlpha: 0,
                  }
                }
            }),
            xValues: rep.customApi.time,
          }
        }
        this.manage_min_max(station)
        station.data.datasets = station.data.datasets.concat(this.get_now_dataset(station.data, station.available_bikes))
        return station
      })
      out = this.sortStationByOrder(out)
      let onlyActiveDay = this.keepOnlyActiveDay(out, this.state.activeDay)
      this.setState({refreshing: false, dragRefresh: false, datas: this.state.datas.cloneWithRows(onlyActiveDay), datasRef: out})
    })
  } 

  onRefresh = () => {
    this.setState({dragRefresh: true}, () => this.load_data(this.props.followedStations, "00h00", "23h59", 30, [0, 1, 2 ,3 ,4 , 5, 6]))
  }

  sortStationByOrder = (data) => {
    const out = []
    data.forEach((station) => {
      out[getFollowedStation(this.props.followedStations, "number", station.number).order] = station
    })
    return out
  }

  keepOnlyActiveDay = (data, activeDay) => {
    let out = JSON.parse(JSON.stringify(data))
    out = out.filter((station) => {
      if (station) {
        const newDatasets = station.data.datasets.filter((dataset) => {
          if (config.days_name.indexOf(dataset.label) === -1) return true
          return activeDay[config.days_name.indexOf(dataset.label)]
        })
        station.data.datasets = newDatasets
      }
      return station
    })
    return out
  }

  manageActiveDay = (id) => {
    let newActiveDay = this.state.activeDay.slice(0)
    if (id === null || this.state.activeDay.every((day, idday) => (idday === id) ? true : !day)) {
          newActiveDay = config.days_name.map(() => true)
    } else if (this.state.activeDay.every((day) => day)) {
      newActiveDay = config.days_name.map(() => false)
      newActiveDay[id] = true
    } else {
      newActiveDay[id] = !newActiveDay[id]
    }
    const newDatas = this.keepOnlyActiveDay(this.state.datasRef, newActiveDay)
    this.setState({activeDay: newActiveDay, datas: this.state.datas.cloneWithRows(newDatas)})
  }

  displayDaySelector = () => {
    return (
      <View
        style={{flexDirection: "row"}}
      >
        {config.days_name.map((day, id) =>
          <TouchableOpacity
            key={id}
            style={styles.daySelectorContainer}
            onPress={() => this.manageActiveDay(id)}
            onLongPress={() => this.manageActiveDay(null)}
          >
            <Text
              style={[styles.daySelectorText, {backgroundColor: colors.days_color[id], opacity: (this.state.activeDay[id]) ? 1 : 0.5}]}
            >
              {config.days_name[id]}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  render() {
    const refreshControl = (
      <RefreshControl
        refreshing={this.state.dragRefresh}
        onRefresh={() => this.onRefresh()}
      />
    )
    let listWithEmptyStart = this.state.datas.cloneWithRows([])
    if (this.state.datas._dataBlob) {
      if (this.state.datas._dataBlob.s1.length) {
        listWithEmptyStart = this.state.datas.cloneWithRows(["daySelector"].concat(this.state.datas._dataBlob.s1))
      }
    }
    return (
      <View style={styles.container}>
        {(!this.state.refreshing || (this.state.dragRefresh && this.state.datas._dataBlob)) ?
          <ListView
          style={{flex: 1}}
          dataSource={listWithEmptyStart}
          enableEmptySections={true}
          refreshControl={refreshControl}
          renderRow={(station, sid, id) => {
            if (station === "daySelector") {
              return this.displayDaySelector()
            }
            return (
              <StationAverageGraph
                station_title={getFollowedStation(this.props.followedStations, "order", id - 1).name}
                station={station}
                closeAllEdit={(stationEmmiter) => PubSub.publish('CloseAllGraphEdit', stationEmmiter)}
              />
            )
          }}
        />
        : <ActivityIndicator animating={this.state.refreshing} size="large" />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  daySelectorContainer: {
    height: 40,
    margin: 1,
    marginTop: 5,
    borderRadius: 2,
    flex: 1,
  },
  daySelectorText: {
    height: 40,
    borderRadius: 2,
    color: "black",
    fontSize: 14,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "bold",
    textShadowOffset: {width: 1, height: 0},
    textShadowRadius: 1,
    textShadowColor: "white",
  },
});

export default GraphicsView

//TODO
//Check si retour de fetch OK
// de base, afficher que le jour d'aujourdhui
//ordre des graphiques
