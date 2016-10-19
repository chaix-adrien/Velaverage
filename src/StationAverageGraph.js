import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import PubSub from 'pubsub-js'
import {LineChart} from 'react-native-mp-android-chart';
import Icon from 'react-native-vector-icons/FontAwesome';

import {StationAvialablesBikes} from './StationsListElement'
import config from '../config.json'
import colors from '../colors.json'

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
    colors: colors.days_color,
    labels: config.days_name,
  }
}

export class StationAverageGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationName: this.props.station_title,
    }
  }

  render() {
    const {station, changeStationName} = this.props
    return(
      <View>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          <TextInput
            style={[styles.graphTitle, {flex: 7}]}
            value={this.props.station_title}
            editable={false}
          />
          <StationAvialablesBikes station={station} containerStyle={styles.stationAviables} />
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
  stationAviables: {marginRight: 10,
    paddingTop: 5,
    padding: 3,
    backgroundColor: colors.background,
    elevation: 5,
    borderRadius: 4
  },
});
