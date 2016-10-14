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
import SearchBar from 'react-native-material-design-searchbar'
import CheckBox from 'react-native-check-box'
import Icon from 'react-native-vector-icons/FontAwesome';
import SegmentedControlTab from 'react-native-segmented-control-tab'

import MapStations from './MapStations'


export class StationAvialablesBikes extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {station} = this.props
    return (
     <View style={{flexDirection: "row"}}>
       <View>
         <Icon
          name="bicycle"
          size={20}
          color="green"
          style={{margin: 2}}
        />
        <Text style={styles.available_bikesText}>{station.available_bikes}</Text>
       </View>
       <View>
         <Icon
          name="th-large"
          size={20}
          style={{margin: 2}}
          color="green"
        />
        <Text style={styles.available_bikesText}>{station.available_bike_stands}</Text>
       </View>
     </View>
    )
  }
}

class StationsListElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      realTimeInfo: null
    }
  }

  render() {
    const {station, realTimeInfo, flexDirection} = this.props
    return (
      <TouchableOpacity
        onPress={() => {this.props.loadRealTimeInfo(station.number)}}
        style={{flexDirection: flexDirection, flex: 1, justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "grey"}}
      >
        <View>
          <Text style={[styles.stationName, {textAlign: (flexDirection === "row") ? "left" : "center"}]}>{station.name.slice(7)}</Text>
          <Text style={{marginLeft: 5, textAlign: (flexDirection === "row") ? "left" : "center"}}>{(station.address.length > 25) ? station.address.slice(0, 23) + "..." : station.address}</Text>
        </View>
        <View style={{flexDirection: "row", marginLeft: 5}}>
          {(realTimeInfo) ?
            <StationAvialablesBikes station={realTimeInfo} />
            : null
          }
          <Icon
            name={this.props.followed ? "minus-circle" : "plus-circle"}
            size={40}
            color={this.props.followed ? "red" : "green"}
            style={{marginLeft: 10, marginRight: 5, marginBottom: (flexDirection === "row") ? 0 : 5}}
            onPress={() => {
            }}
          />
         </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  stationName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
  },
  available_bikesText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "black",
    top: -5,
  },
});

export default StationsListElement
