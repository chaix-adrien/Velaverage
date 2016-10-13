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
import SegmentedControlTab from 'react-native-segmented-control-tab'
import CheckBox from 'react-native-check-box'
import Icon from 'react-native-vector-icons/FontAwesome';

import MapStations from './MapStations'

class StationsListElement extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {station} = this.props
    return (
      <View style={{flexDirection: "row", flex: 1, justifyContent: "space-between", borderBottomWidth: 1, borderColor: "grey"}}>
        <View>
          <Text style={styles.stationName}>{station.name.slice(7)}</Text>
          <Text>{station.name.slice(7)}</Text>
        </View>
        <View style={{flexDirection: "row", marginLeft: 5}}>
          <Text style={{fontSize: 16, fontWeight: "bold", textAlignVertical: "center"}}>(23/25)</Text>
          <Icon
            name={this.props.followed ? "minus-circle" : "plus-circle"}
            size={40}
            color={this.props.followed ? "red" : "green"}
            style={{marginLeft: 5, marginRight: 5}}
            onPress={() => {
            }}
          />
         </View>
      </View>
    )
  }
}

class StationsList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeStationList: null,
      displayMode: 0,
      onlyFollowed: false,
      followedStations: [],
    }
    this.load_station_data().then((stations) => {
      AsyncStorage.getItem('@Velaverage:followedStations', (err, res) => {
        res = JSON.parse(res)
        this.stationsList = stations
        const followedStations = []
        stations.forEach((station, id) => {
          for (let i = 0; i < res.length; i++) {
            if (station.number === res[i].number) {
              followedStations[station.number] = true
            }
          }
          if (!followedStations[station.number]) {
            followedStations[station.number] = false
          }
        })
        this.setState({activeStationList: stations, followedStations: followedStations})
      })
    })
  }

  load_station_data = () => {
    return new Promise((resolve, reject) => {
      RNFS.readFile(RNFS.DocumentDirectoryPath + "/stationDataToulouse.json").then((content) => {
        resolve(JSON.parse(content))
      }).catch((e) => {
        fetch("https://developer.jcdecaux.com/rest/vls/stations/Toulouse.json").then((res) => res.json()).then((rep) => {
          if (!rep) {
            reject("Error While downloading Station file")
          }
          rep.sort((a, b) => a.number - b.number)
          RNFS.writeFile(RNFS.DocumentDirectoryPath + "/stationDataToulouse.json", JSON.stringify(rep))
          resolve(rep)
        }).catch((e) => {
          reject(e)
        })
      })
    })
  }

  loadOnlyFollowedStation = () => {
    AsyncStorage.getItem('@Velaverage:followedStations', (err, res) => {
      res = JSON.parse(res)
      const toDisplayList = []
      for (let i = 0; i < res.length; i++) {
        for (let j = 0; j < this.stationsList.length; j++) {
          if (res[i].number === this.stationsList[j].number){
            toDisplayList.push(this.stationsList[j])
          }
        }
      }
      this.setState({activeStationList:toDisplayList})
    })
  }

  pressOnOnlyFollowed = () => {
    let toDisplayList = []
    if (this.state.onlyFollowed) {
      this.setState({onlyFollowed: !this.state.onlyFollowed, activeStationList: this.stationsList})
    } else {
      this.setState({onlyFollowed: !this.state.onlyFollowed}, () => this.loadOnlyFollowedStation())
    }
  }

  displayList = (list) => {
    if (!list) return <View style={{flex: 1}}/>
    list = list.slice(0)
    let listData = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return (
      <ListView
        dataSource={listData.cloneWithRows(list.sort((a, b) => {
          const textA = a.name.slice(7).toUpperCase();
          const textB = b.name.slice(7).toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        }))}
        enableEmptySections={true}
        renderRow={(rowData, sid, id) => <StationsListElement station={rowData} followed={this.state.followedStations[rowData.number]} />}
      />
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{flexDirection: "row"}}>
          <SegmentedControlTab values={['List', 'Map']}
            borderRadius={3}
            tabsContainerStyle={{height: 40, width: 200, padding: 5}}
            tabStyle={{backgroundColor: 'white', borderWidth: 3, borderColor: '#ef6c00'}}
            activeTabStyle={{backgroundColor: '#ef6c00'}}
            tabTextStyle={{color: '#ef6c00', fontWeight: 'bold'}}
            activeTabTextStyle={{color: 'white'}}
            onTabPress={(selec) => this.setState({displayMode: selec})}
          />
          <CheckBox
            style={{flex: 1, padding: 10}}
            onClick={() => this.pressOnOnlyFollowed()}
            isChecked={this.state.onlyFollowed}
            leftText={"Only Followed"}
          />
        </View>
        <View  style={{alignItems: "flex-start", flex: 1}}>
        {(this.state.displayMode === 0) ?
          this.displayList(this.state.activeStationList)
          :
          <MapStations
            followedStations={this.state.followedStations}
            stationList={this.state.activeStationList}
          />
        }
        </View>
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
  stationName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
  }
});
 export default StationsList
