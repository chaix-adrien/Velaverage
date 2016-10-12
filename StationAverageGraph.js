import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ListView,
  TextInput,
  TouchableOpacity,
  AsyncStorage,
} from 'react-native';
import RNFS from 'react-native-fs'
import {LineChart} from 'react-native-mp-android-chart';
import Icon from 'react-native-vector-icons/FontAwesome';

const days_name = [
  "Dim",
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
]
const days_color = [
  "#042423",
  "red",
  "blue",
  "#64dd17",
  "#FF00FF",
  "#FF6600",
  "#29b6f6",
]
const legend = {
  enabled: true,
  fontStyle: 1,
  textColor: '#458DCB',
  textSize: 13,
  position: 'BELOW_CHART_LEFT',
  form: 'CIRCLE',
  formSize: 13,
  xEntrySpace: 5,
  yEntrySpace: 5,
  formToTextSpace: 3,
  wordWrapEnabled: true,
  maxSizePercent: 0.5,
  custom: {
    colors: days_color,
    labels: days_name,
  }
}

export class StationAverageGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationEditable: false,
      stationName: this.props.station_title,
    }
  }

  shouldComponentUpdate(nProps, nState) {
    console.log("update: ", nProps.station_title, this.props.station_title)
    if (nProps.station_title !== this.props.station_title) {
      console.log("update ok")
      this.setState({stationName: nProps.station_title})
    }
    return true
  }

  render()
    {
      const {station, changeStationName} = this.props
      return(
        <View>
          <View style={{flexDirection: "row", alignItems: "center", width: 300}}>
              <TextInput
                style={[styles.graphTitle, {flex: 7}]}
                value={this.state.stationName}
                editable={this.state.stationEditable}
                onChangeText={(text) => {
                    this.setState({stationName: text})
                }}
                onEndEditing={() => changeStationName(station.number, this.state.stationName)}
              />
              {
                (this.state.stationEditable) ?
                null : <Text style={[styles.graphTitle, {flex: 2}]}>({station.available_bikes}/{station.bike_stands})</Text>
              }
                  <View>
                    <Icon
                      name="angle-up"
                      size={30}
                      color="#004d40"
                      style={{flex: 1, marginLeft: 5, marginRight: 5}}
                      onPress={() => {
                        this.setState({stationName: this.props.changeStationOrder(station.number, -1)})}
                      }
                    />
                    <Icon
                      name="angle-down"
                      size={30}
                      color="#004d40"
                      style={{flex: 1, marginLeft: 5, marginRight: 5}}
                      onPress={() => this.setState({stationName: this.props.changeStationOrder(station.number, 1)})}
                    />
                  </View>
              <Icon
                name={(this.state.stationEditable) ? "check-circle" : "gear"}
                size={30}
                color={(station.status === 'OPEN') ? "#2E7D32" : "#BF360C"}
                style={{flex: 1}}
                onPress={() => {
                  this.setState({stationName: this.props.station_title, stationEditable: !this.state.stationEditable})
                }}
              />
          </View>
        </View>
      )
    }
  }
/*
          <LineChart
            style={{height:300, width: 350}}
            legend={legend}
            data={station.data}
            drawGridBackground={true}
            borderColor={'teal'}
            borderWidth={1}
            drawBorders={true}
            touchEnabled={true}
            dragEnabled={true}
            scaleEnabled={true}
            scaleXEnabled={true}
            scaleYEnabled={true}
            pinchZoom={true}
            doubleTapToZoomEnabled={true}
            dragDecelerationEnabled={true}
            dragDecelerationFrictionCoef={0.99}
            keepPositionOnRotation={false}
            description={{text: ''}}
          />*/
const styles = StyleSheet.create({
  graphTitle: {
    color: "black",
    marginLeft: 5,
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 20,
    height: 40,
  },
});
