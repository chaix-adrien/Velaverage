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
  "red",
  "blue",
  "green",
  "#FF00FF",
  "#042423",
  "#FF6600",
  "cyan",
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
      stationNameEditable: false,
      stationName: this.props.station.title,
    }
  }
  render()
    {
      const {station} = this.props
      return(
        <View>
          <View style={{flexDirection: "row", alignItems: "center"}}>
              <TextInput
                style={[styles.graphTitle, {flex: 7}]}
                value={this.state.stationName}
                editable={this.state.stationNameEditable}
                onChangeText={(text) => {
                    this.setState({stationName: text})
                }}
                onEndEditing={() => {
                  AsyncStorage.getItem('@Velaverage:stationNamesPerso', (err, stationNames) => {
                    stationNames = JSON.parse(stationNames)
                    stationNames[station.number.toString()] = this.state.stationName
                    AsyncStorage.setItem('@Velaverage:stationNamesPerso', JSON.stringify(stationNames))
                  })
                }}
              />
              <Text style={[styles.graphTitle, {flex: 2}]}>({station.available_bikes}/{station.bike_stands})</Text>
              <Icon
                name="info-circle"
                size={30}
                color={(station.status === 'OPEN') ? "#2E7D32" : "#BF360C"}
                style={{flex: 1}}
                onPress={() => {
                  this.setState({stationNameEditable: !this.state.stationNameEditable})
                }}
              />
          </View>
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
          />
        </View>
      )
    }
  }

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
