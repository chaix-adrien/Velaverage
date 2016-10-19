/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import colors from '../colors.json'

export class StationAvialablesBikes extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  percent_to_color = (percent) => {
    if (percent > 0.5) return "green"
    else if (percent > 0.3) return colors.main
    else if (percent != 0) return "red"
    else return "black"
  }

  render() {
    const {station} = this.props
    return (
     <View style={[{flexDirection: "row"}, (this.props.containerStyle) ? this.props.containerStyle : {}]}>
       <View>
         <Icon
          name="bicycle"
          size={20}
          color={this.percent_to_color(station.available_bikes / station.bike_stands)}
          style={{margin: 2}}
        />
        <Text style={styles.available_bikesText}>{station.available_bikes}</Text>
       </View>
       <View>
         <Icon
            name="th-large"
            size={20}
            color={this.percent_to_color(station.available_bike_stands / station.bike_stands)}
            style={{margin: 2}}
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
      realTimeInfo: null,
    }
  }

  render() {
    const {station, realTimeInfo, flexDirection} = this.props
    return (
      <TouchableOpacity onPress={() => {
          this.view.transitionTo({height: 0})
          this.props.loadRealTimeInfo(station.number, () => this.view.transitionTo({height: 40}))
        }}>
      <Animatable.View
        ref={(e => (this.view = e))}
        style={{flexDirection: flexDirection, flex: 1, height: (flexDirection === "row") ? 40 : null, justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "grey"}}
      >
        <View>
          <Text style={[styles.stationName, {textAlign: (flexDirection === "row") ? "left" : "center"}]}>{station.name.slice(8)}</Text>
          <Text style={{marginLeft: 5, textAlign: (flexDirection === "row") ? "left" : "center"}}>{(station.address.length > 25) ? station.address.slice(0, 23) + "..." : station.address}</Text>
        </View>
        <View style={{flexDirection: "row", marginLeft: 5}}>
          {(realTimeInfo) ?
            <StationAvialablesBikes station={realTimeInfo} />
            : null
          }
          <TouchableOpacity onPress={() => this.props.un_followStation(station.number)} >
          <Icon
            name={this.props.followed ? "minus-circle" : "plus-circle"}
            size={40}
            color={this.props.followed ? "red" : "green"}
            style={{marginRight: 5, marginLeft: 5, marginBottom: (flexDirection === "row") ? 0 : 5}}
          />
          </TouchableOpacity>
         </View>
      </Animatable.View>
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