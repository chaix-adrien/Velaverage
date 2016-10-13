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
import Spinner from 'react-native-loading-spinner-overlay';

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
  }

  render() {
    return (
        <View style={{flex: 1, width :500}}>
          <MapView
            style={{flex: 1, width :500}}
            initialRegion={{
              latitude: 43.612758579787766,
              longitude: 1.4392240718007088,
              latitudeDelta: 0.16756966830353548,
              longitudeDelta: 0.20409498363733292,
            }}
         >
           {(this.props.stationList) ? this.props.stationList.map((station, id) => (
             <MapView.Marker
               key={id}
               coordinate={station}
               pinColor={this.props.followedStations[station.number] ? "green" : "red"}
             >
               <MapView.Callout tooltip={false} style={{width: 200, height: 50}}>
                 <View style={{flex: 1, backgroundColor: "blue"}}/>
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
