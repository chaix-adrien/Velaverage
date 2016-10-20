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
import ScrollableTabView from 'react-native-scrollable-tab-view'
import Icon from 'react-native-vector-icons/FontAwesome';
import {MKRangeSlider} from 'react-native-material-kit';

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
      daySelectorState: 0,
      hourRange: {
        start: 1,
        end: 24,
      }
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
          scale: scale,
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
      onlyActiveDay = this.zoomOnHours(onlyActiveDay, this.state.hourRange)
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
    
    this.setState({activeDay: newActiveDay, datas: this.state.datas.cloneWithRows(this.zoomOnHours(newDatas, this.state.hourRange))})
  }

  zoomOnHours = (list, hours) => {
    let stations = JSON.parse(JSON.stringify(list))
    const out = stations.map((station) => {
      const toKeep = {start: hours.start * 60 / station.scale, end: hours.end * 60 / station.scale}
      station.data.xValues = station.data.xValues.slice(toKeep.start, toKeep.end)
      station.data.datasets = station.data.datasets.map((dataset) => {
        if (dataset.label !== "limit") {
          dataset.yValues = dataset.yValues.slice(toKeep.start, toKeep.end)
        }
        return dataset
      })
      return station
    })
    return out
  }

  displayDaySelector = () => {
    const daySelector = (
      <View
        tabLabel="days"
        style={{flexDirection: "row", justifyContent: "center", alignItems: 'center'}}
      >
        {config.days_name.map((day, id) =>
          <TouchableOpacity
            key={id}
            style={styles.daySelectorContainer}
            onPress={() => this.manageActiveDay(id)}
            onLongPress={() => this.manageActiveDay(null)}
          >
            <Text
              style={[styles.daySelectorText, {backgroundColor: colors.days_color[id], opacity: (this.state.activeDay[id]) ? 1 : 0.3}]}
            >
              {config.days_name[id]}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => this.setState({daySelectorState: 1})}
        >
        <Icon
          name="clock-o"
          size={30}
          color="grey"
          style={{flex: 1, margin: 5, top: 5}}
        />
        </TouchableOpacity>
      </View>
    )

    const HourSelector = (
      <View
        style={{flexDirection: "row", justifyContent: "center", alignItems: 'center'}}
        tabLabel="hour"
      >
        <TouchableOpacity
          onPress={() => this.setState({daySelectorState: 0})}
        >
          <Icon
            name="chevron-left"
            size={30}
            color="grey"
            style={{flex: 1, margin: 5, top: 5}}
          />
        </TouchableOpacity>
        <Text style={{flex: 1}}>{this.state.hourRange.start < 10 ? "0" + this.state.hourRange.start : this.state.hourRange.start}h</Text>
        <MKRangeSlider
          minValue={this.state.hourRange.start}
          maxValue={this.state.hourRange.end}
          thumbRadius={12}
          lowerTrackColor={colors.darkMain}
          min={0}
          style={{flex: 11}}
          max={24}
          step={1}
          onConfirm={(curValue) => this.setState({hourRange: {start :Math.round(curValue.min), end : Math.round(curValue.max)}}, () => {
            const onlyActiveDay = this.keepOnlyActiveDay(this.state.datasRef, this.state.activeDay)
            const newDatas = this.state.datas.cloneWithRows(this.zoomOnHours(onlyActiveDay, this.state.hourRange))
            this.setState({datas: newDatas})
          })}
        />
        <Text style={{flex: 1}}>{this.state.hourRange.end < 10 ? "0" + this.state.hourRange.end : this.state.hourRange.end}h</Text>
      </View>
    )

    return (
      <ScrollableTabView
        tabBarUnderlineStyle={{backgroundColor: '#ef6c00'}}
        tabBarActiveTextColor="#e65100"
        locked={true}
        page={this.state.daySelectorState}
        renderTabBar={() => <View/>}
      >
        {daySelector}
        {HourSelector}
      </ScrollableTabView>
    )
  }

  render() {
    const refreshControl = (
      <RefreshControl
        refreshing={this.state.dragRefresh}
        onRefresh={() => this.onRefresh()}
      />
    )
  
    return (
      <View style={styles.container}>
        {(!this.state.refreshing || (this.state.dragRefresh && this.state.datas._dataBlob)) ?
          <View style={{paddingBottom: 4, backgroundColor: colors.background, elevation: 5}}>
            {this.displayDaySelector()}
          </View>
        : null
        }
        {(!this.state.refreshing || (this.state.dragRefresh && this.state.datas._dataBlob)) ?
          <ListView
          style={{flex: 1}}
          dataSource={this.state.datas}
          enableEmptySections={true}
          refreshControl={refreshControl}
          renderRow={(station, sid, id) => {
            return (
              <StationAverageGraph
                station_title={getFollowedStation(this.props.followedStations, "order", parseInt(id)).name}
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
    marginLeft: 2,
    marginTop: 5,
    borderRadius: 2,
    flex: 1.5,
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
