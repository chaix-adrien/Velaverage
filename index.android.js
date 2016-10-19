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
  Dimensions,
  AsyncStorage,
  TouchableOpacity,
} from 'react-native';
import RNFS from 'react-native-fs'
import ScrollableTabView from 'react-native-scrollable-tab-view'
import MapView from 'react-native-maps';

import GraphicsView from './src/GraphicsView'
import StationsList from './src/StationsList'
import FollowedList from './src/FollowedList'
import {StationAverageGraph} from './src/StationAverageGraph.js'

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

export const getFollowedStation = (stationList, by, value) => {
  return {...stationList.filter((s) => s[by] === value)}['0']
}

class Velaverage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      followedStations: [],
    }
    this.onChangeTabCallback = []
    this.lastTab = 0
    AsyncStorage.getItem('@Velaverage:followedStations', (err, res) => {
      if (!res) {
        res = "[]"
        AsyncStorage.setItem('@Velaverage:followedStations', res)
        res = []
      } else {
        res = JSON.parse(res).sort((a, b) => a.order - b.order)
      }
      this.setState({followedStations: res})
    })
  }

  changeStationName = (number, name) => {
    const newFollowed = this.state.followedStations.slice(0)
    getFollowedStation(newFollowed, "number", number).name = name
    this.setFollowedStation(newFollowed)
    this.forceUpdate()
  }

  changeStationOrder = (number, side) => {
    const station = getFollowedStation(this.state.followedStations, "number", number)
    if (station.order + side < 0 || station.order + side >= this.state.followedStations.length) return false
    const stationToSwitch = getFollowedStation(this.state.followedStations, "order", station.order + side)
    stationToSwitch.order = station.order
    station.order = station.order + side
    const newDatas = this.state.followedStations.sort((a, b) => a.order - b.order)
    AsyncStorage.setItem('@Velaverage:followedStations', JSON.stringify(newDatas), () => {
      this.setState({followedStations: newDatas})
    })
    this.forceUpdate()
    return true
  }

  setFollowedStation = (followedStations) => {
    AsyncStorage.setItem('@Velaverage:followedStations', JSON.stringify(followedStations))
    this.setState({followedStations: followedStations})
  }

  onChangeTab = (id, callback) => {
    if (callback) {
      this.onChangeTabCallback[id] = callback
    } else if (this.onChangeTabCallback[this.lastTab]) {
      this.onChangeTabCallback[this.lastTab]()
    }
    this.lastTab = id
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollableTabView
          tabBarUnderlineStyle={{backgroundColor: '#ef6c00'}}
          tabBarActiveTextColor="#e65100"
          locked={true}
          onChangeTab={(tab) => this.onChangeTab(tab.i)}
        >
          <FollowedList tabLabel="Followed"
          followedStations={this.state.followedStations}
          changeStationOrder={this.changeStationOrder}
          changeStationName={this.changeStationName}
          onChangeTab={this.onChangeTab} />
          <GraphicsView followedStations={this.state.followedStations} setFollowedStation={this.setFollowedStation} tabLabel="Graphics" />
          <StationsList followedStations={this.state.followedStations} setFollowedStation={this.setFollowedStation} tabLabel="Stations" />
        </ScrollableTabView>
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

AppRegistry.registerComponent('Velaverage', () => Velaverage);


//TODO  
//(load station file, si pas en local et pas internet: message d'erreur)
//choix de la precision
//tab Followed (par defaut) afficher les station avec un boutton refresh a chaques
//Tab Search (station, date, heure) => sortir un grap 1h avant / apres

/*
Option:
color theme
list : display only followed de base ?
tab at startup
default day displayed par rapport a aujourdhui
*/
