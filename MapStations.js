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
var UIManager = require('NativeModules').UIManager;
import RNFS from 'react-native-fs'
import Spinner from 'react-native-loading-spinner-overlay';
import StationsListElement from './StationsListElement'
import Popover from 'react-native-popover'

import MapView from 'react-native-maps';

class MapStations extends Component {
  constructor(props) {
    super(props)
    this.state = {
      region : {
        latitude: 43.612758579787766,
        longitude: 1.4392240718007088,
        latitudeDelta: 0.16756966830353548,
        longitudeDelta: 0.20409498363733292,
      },
      loading: 0,
      displayPopup: null,
    }
    this.marker = []
  }

  isInRegion = (coord, region) => {
    if (coord.latitude >= region.latitude - region.latitudeDelta / 2
      && coord.longitude >= region.longitude - region.latitudeDelta / 2
      && coord.latitude <= region.latitude + region.latitudeDelta / 2
      && coord.longitude <= region.longitude + region.longitudeDelta / 2)
      return true
    return false
  }

  getMedianMarker = (inRegion, id) => {
    if (inRegion.length < 1) return null
    const medianMarker = {
      latitude: 0,
      longitude: 0,
      stations: inRegion,
    }
    inRegion.forEach((station) => {
      medianMarker.latitude += station.latitude
      medianMarker.longitude += station.longitude
    })
    medianMarker.latitude /= inRegion.length
    medianMarker.longitude /= inRegion.length
    return (
      <MapView.Marker
        key={id}
        coordinate={medianMarker}
      >
        <Text style={styles.markerGroup}>{inRegion.length}</Text>
      </MapView.Marker>
    )
  }

  getMarker = (stationsList) => {
    if (!stationsList) return []
    const {region} = this.state
    const inRegion = stationsList.filter((station) => this.isInRegion(station, region))
    if ((region.latitudeDelta > 0.015 || region.longitudeDelta > 0.015) && inRegion.length > 25) {
      const simplified = []
      let i = 0;
      for (let la = region.latitude - region.latitudeDelta / 2 + (region.latitudeDelta / 6);
        la < region.latitude + region.latitudeDelta / 2;
        la += region.latitudeDelta / 3) {
          for (let lo = region.longitude - region.longitudeDelta / 2 + (region.longitudeDelta / 6);
            lo < region.longitude + region.longitudeDelta / 2;
            lo += region.longitudeDelta / 3) {
            simplified[i] = inRegion.filter((station) => this.isInRegion(station, {latitude: la, longitude: lo, latitudeDelta: region.latitudeDelta / 3, longitudeDelta: region.longitudeDelta / 3}))
            i++
          }
        }
      return simplified.map((region, id) => this.getMedianMarker(region, id))
    } else {
      return inRegion.map((station, id) => (
        <MapView.Marker
          ref={(elem) => (this.marker[station.number] = elem)}
          key={id}
          coordinate={station}
          pinColor={this.props.followedStations[station.number] ? "green" : "red"}
          onPress={() => {
            this.props.loadRealTimeInfo(station.number)
            this.setState({displayPopup: true, popupStation: station})
          }}
        />
      ))
    }
  }

  render() {
    return (
        <View style={{flex: 1}} onLayout={({nativeEvent: {layout}}) =>
        this.popupRect={x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 - 40, width: 1, height: 1,}}>
          <MapView
            ref={(elem) => (this.map = elem)}
            style={{flex: 1, width: Dimensions.get('window').width}}
            initialRegion={{
              latitude: 43.612758579787766,
              longitude: 1.4392240718007088,
              latitudeDelta: 0.16756966830353548,
              longitudeDelta: 0.20409498363733292,
            }}
            showsUserLocation={true}
            onRegionChangeComplete={(region) => this.setState({region: region})}
          >
            {this.getMarker(this.props.stationList)}
          </MapView>
          <Popover
            placement="top"
            isVisible={this.state.displayPopup}
            fromRect={this.popupRect}
            onClose={() => this.setState({displayPopup: false})}
          >
            <StationsListElement
              realTimeInfo={this.props.realTimeInfo[this.state.popupStation ? this.state.popupStation.number : 0]}
              station={this.state.popupStation}
              un_followStation={this.props.un_followStation}
              flexDirection="column"
              loadRealTimeInfo={this.props.loadRealTimeInfo}
              followed={this.props.followedStations[this.state.popupStation ? this.state.popupStation.number : 0]}
            />
          </Popover>
       </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  markerGroup: {
    borderRadius: 10,
    width: 27,
    height: 27,
    backgroundColor: "#ef6c00",
    textAlign: 'center',
    textAlignVertical: "center",
    fontWeight: 'bold',
    color: "white",
  },
});
 export default MapStations
