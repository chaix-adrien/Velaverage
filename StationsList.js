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
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs'
import SearchBar from 'react-native-material-design-searchbar'
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControlTab from 'react-native-segmented-control-tab'
import StationsListElement from './StationsListElement'
import {MKSwitch} from 'react-native-material-kit';
import MapStations from './MapStations'

class StationsList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeStationList: [],
      displayMode: 0,
      onlyFollowed: false,
      followedStations: [],
      realTimeInfo: [],
      query: "",
    }
    this.load_station_data().then((stations) => {
      this.stationsList = stations
      const followedStations = []
      stations.forEach((station, id) => {
        for (let i = 0; i < this.props.followedStations.length; i++) {
          if (station.number === this.props.followedStations[i].number) {
            followedStations[station.number] = true
            this.loadRealTimeInfo(station.number)
          }
        }
        if (!followedStations[station.number]) {
          followedStations[station.number] = false
        }
      })
      this.setState({activeStationList: stations, followedStations: followedStations})
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

  loadRealTimeInfo = (number, callback) => {
    return fetch(`https://api.jcdecaux.com/vls/v1/stations/${number}?contract=Toulouse&apiKey=0c707a2d7a2e439fca48906a35c3f8c45efb5bc9`).then((res) => res.json()).then((rep) => {
      const newTab = this.state.realTimeInfo.slice(0)
      newTab[number] = rep
      this.setState({realTimeInfo: newTab}, (callback) ? () => callback() : () => {})
    }).catch((e) => {console.log(e); Alert.alert("Network Error", "Please check your internet conexion.")})
  }


  loadOnlyFollowedStation = (callback) => {
    const toDisplayList = []
    for (let i = 0; i < this.props.followedStations.length; i++) {
      for (let j = 0; j < this.stationsList.length; j++) {
        if (this.props.followedStations[i].number === this.stationsList[j].number){
          toDisplayList.push(this.stationsList[j])
        }
      }
    }
    this.setState({activeStationList:toDisplayList}, (callback) ? () => callback() : () => {})
  }

  getStation = (stations, by, value) => {
    return {...stations.filter((s) => s[by] === value)}['0']
  }

  un_followStation = (number) => {
    let newFollowed = this.props.followedStations.slice(0)
    const station = this.getStation(newFollowed, "number", number)
    if (station) {
      newFollowed = newFollowed.slice(0, newFollowed.indexOf(station)).concat(newFollowed.slice(newFollowed.indexOf(station) + 1))
      newFollowed.sort((a, b) => a.order - b.order)
      newFollowed.forEach((station, id) => (station.order = id))
    } else {
      let order = -1
      this.props.followedStations.forEach((station) => {
        if (station.order > order) order = station.order
      })
      newFollowed.push({
        number: number,
        name:  this.getStation(this.stationsList, "number", number).name.slice(7),
        order: order + 1
      })
    }
    this.props.setFollowedStation(newFollowed)
    const followedStations = []
    this.stationsList.forEach((station, id) => {
      for (let i = 0; i < newFollowed.length; i++) {
        if (station.number === newFollowed[i].number) {
          followedStations[station.number] = true
        }
      }
      if (!followedStations[station.number]) {
        followedStations[station.number] = false
      }
    })
    this.setState({followedStations: followedStations})
  }

  pressOnOnlyFollowed = (callback) => {
    let toDisplayList = []
    if (this.state.onlyFollowed) {
      this.setState({onlyFollowed: !this.state.onlyFollowed, activeStationList: this.stationsList}, (callback) ? callback : () => {})
    } else {
      this.setState({onlyFollowed: !this.state.onlyFollowed}, () => this.loadOnlyFollowedStation(callback))
    }
  }

  displayList = (list) => {
    if (!list) return <View style={{flex: 1}}/>
    list = list.slice(0)
    let listData = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return (
      <ListView
        style={{width: Dimensions.get("window").width}}
        dataSource={listData.cloneWithRows(list.sort((a, b) => {
          const textA = a.name.slice(7).toUpperCase();
          const textB = b.name.slice(7).toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        }))}
        enableEmptySections={true}
        renderRow={(rowData, sid, id) => <StationsListElement
          realTimeInfo={this.state.realTimeInfo[rowData.number]}
          station={rowData}
          un_followStation={this.un_followStation}
          flexDirection="row"
          loadRealTimeInfo={this.loadRealTimeInfo}
          followed={this.state.followedStations[rowData.number]} />}
      />
    )
  }

  render() {
    const {query} = this.state
    const dataSearch = (query.length >= 1) ? this.state.activeStationList.filter((station) => {
      if (station.name.toUpperCase().indexOf(query.toUpperCase()) !== -1 || station.address.toUpperCase().indexOf(query.toUpperCase()) !== -1)
        return true
      return false
    }) : this.state.activeStationList
    return (
      <View style={styles.container}>
        <View style={{width:Dimensions.get('window').width, elevation: 5, backgroundColor: "#F5FCFF"}}>
          <SearchBar
            onSearchChange={(event) => this.setState({query: event.nativeEvent.text})}
            height={30}
            placeholder={'Search station...'}
            autoCorrect={false}
            padding={5}
            iconSize={20}
            returnKeyType={'search'}
          />
        </View>
        <View style={{flexDirection: "row", elevation: 5, backgroundColor: "#F5FCFF"}}>
          <SegmentedControlTab values={['Map', 'List']}
            borderRadius={3}
            tabsContainerStyle={{height: 40, width: 200, padding: 5}}
            tabStyle={{backgroundColor: 'white', borderWidth: 3, borderColor: '#ef6c00'}}
            activeTabStyle={{backgroundColor: '#ef6c00'}}
            tabTextStyle={{color: '#ef6c00', fontWeight: 'bold'}}
            activeTabTextStyle={{color: 'white'}}
            onTabPress={(selec) => {
              this.setState({displayMode: selec})
            }}
          />
          <View style={{flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center"}} >
            <Text>Only Followed</Text>
            <View style={{left: -5, top: -10, height: 40}}>
              <MKSwitch style={styles.appleSwitch}
                checked={this.state.onlyFollowed}
                trackSize={20}
                trackLength={50}
                onColor="rgba(255,152,0,.3)"
                thumbOnColor='#ef6c00'
                thumbRadius={15}
                rippleColor="rgba(255,152,0,.2)"
                onCheckedChange={(e) => this.pressOnOnlyFollowed()}
              />
            </View>
          </View>
        </View>
        <View  style={{flex: 1}}>
        {(this.state.displayMode === 0) ?
          <MapStations
            un_followStation={this.un_followStation}
            followedStations={this.state.followedStations}
            stationList={dataSearch}
            loadRealTimeInfo={this.loadRealTimeInfo}
            realTimeInfo={this.state.realTimeInfo}
          />
          :
          this.displayList(dataSearch)
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
