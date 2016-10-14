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
          >
          {(this.props.stationList) ? this.props.stationList.map((station, id) => (
            <MapView.Marker
              ref={(elem) => (this.marker[station.number] = elem)}
              key={id}
              coordinate={station}
              pinColor={this.props.followedStations[station.number] ? "green" : "red"}
              onPress={() => this.setState({displayPopup: true, popupStation: station})}
            />
          )) : null}
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
});
 export default MapStations
