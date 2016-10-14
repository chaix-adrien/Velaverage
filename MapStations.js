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
import Spinner from 'react-native-loading-spinner-overlay';
import StationsListElement from './StationsListElement'

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
    }
    this.marker = []
  }

  render() {
    return (
        <View style={{flex: 1}}>
          <MapView 
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
             >
              <MapView.Callout
                tooltip={false}
                style={{width: 250, height: 100}}
                onPress={() => this.props.loadRealTimeInfo(station.number, () => setTimeout(() => this.marker[station.number].showCallout(), 100))}
              >
                <StationsListElement
                  un_followStation={this.un_followStation}
                  flexDirection="column"
                  realTimeInfo={this.props.realTimeInfo[station.number]}
                  station={station}
                  followed={this.props.followedStations[station.number]} />
              </MapView.Callout>
             </MapView.Marker>
           )) : null}
         </MapView>
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
