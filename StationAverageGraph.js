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
} from 'react-native';
import RNFS from 'react-native-fs'
import {LineChart} from 'react-native-mp-android-chart';
import Icon from 'react-native-vector-icons/FontAwesome';

import {days_color, days_name} from "./index.android.js"
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
      stationNameEditable: false
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
                value={station.title}
                editable={this.state.stationNameEditable}
              />
              <TouchableOpacity style={{flex: 1, alignItems: "center"}}>
                <Icon name="pencil-square" size={20} color="#FF8F00" 
                  style={{flex: 1}}
                  onPress={() => {
                    this.setState({stationNameEditable: !this.state.stationNameEditable})
                  }}
                />
              </TouchableOpacity>
            <Text style={[styles.graphTitle, {flex: 2}]}>({station.available_bikes}/{station.bike_stands})</Text>
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
