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
import CheckBox from 'react-native-check-box'
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControlTab from 'react-native-segmented-control-tab'
import StationsListElement from './StationsListElement'

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
      AsyncStorage.getItem('@Velaverage:followedStations', (err, res) => {
        if (!res) {
          res = [{
            number: 111,
            name: '00111 - MINIMES PASSERELLE',
            order: 0,
          },{
            number: 122,
            name: '00122 - PASSERELLE HAEDENS',
            order: 1,
          },{
            number: 106,
            name: '00106 - BRIENNE PASSERELLE',
            order: 2,
          },{
            number: 265,
            name: '00265 - PASSAGE BORDELONGUE',
            order: 3,
          }
          ]
          AsyncStorage.setItem('@Velaverage:followedStations', JSON.stringify(res))
        } else {
          res = JSON.parse(res)
        }
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

  loadRealTimeInfo = (number, callback) => {
    return fetch(`https://api.jcdecaux.com/vls/v1/stations/${number}?contract=Toulouse&apiKey=0c707a2d7a2e439fca48906a35c3f8c45efb5bc9`).then((res) => res.json()).then((rep) => {
      const newTab = this.state.realTimeInfo.slice(0)
      newTab[number] = rep
      this.setState({realTimeInfo: newTab}, (callback) ? () => callback() : () => {})
    }).catch((e) => {console.log(e); Alert.alert("Network Error", "Please check your internet conexion.")})
  }


  loadOnlyFollowedStation = (callback) => {
    AsyncStorage.getItem('@Velaverage:followedStations', (err, res) => {
      if (!res) {
        res = [{
          number: 111,
          name: '00111 - MINIMES PASSERELLE',
          order: 0,
        },{
          number: 122,
          name: '00122 - PASSERELLE HAEDENS',
          order: 1,
        },{
          number: 106,
          name: '00106 - BRIENNE PASSERELLE',
          order: 2,
        },{
          number: 265,
          name: '00265 - PASSAGE BORDELONGUE',
          order: 3,
        }
        ]
        AsyncStorage.setItem('@Velaverage:followedStations', JSON.stringify(res))
      } else {
        res = JSON.parse(res)
      }
      const toDisplayList = []
      for (let i = 0; i < res.length; i++) {
        for (let j = 0; j < this.stationsList.length; j++) {
          if (res[i].number === this.stationsList[j].number){
            toDisplayList.push(this.stationsList[j])
          }
        }
      }
      this.setState({activeStationList:toDisplayList}, (callback) ? () => callback() : () => {})
    })
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
            returnKeyType={'search'}
          />
        </View>
        <View style={{flexDirection: "row", elevation: 5, backgroundColor: "#F5FCFF"}}>
          <SegmentedControlTab values={['List', 'Map']}
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
          <CheckBox
            style={{flex: 1, padding: 10}}
            onClick={() => this.pressOnOnlyFollowed()}
            isChecked={this.state.onlyFollowed}
            leftText={"Only Followed"}
          />
        </View>
        <View  style={{flex: 1}}>
        {(this.state.displayMode === 0) ?
          this.displayList(dataSearch)
          :
          <MapStations
            followedStations={this.state.followedStations}
            stationList={dataSearch}
            loadRealTimeInfo={this.loadRealTimeInfo}
            realTimeInfo={this.state.realTimeInfo}
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
