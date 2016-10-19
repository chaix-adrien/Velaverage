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
import {days_name} from './GraphicsView'
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
    labels: days_name,
  }
}

export class StationAverageGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationEditable: false,
      stationName: this.props.station_title,
      isInputFocused: false,
    }
  }

  componentWillMount() {
    this.closeSub = PubSub.subscribe('CloseAllGraphEdit', (chan, strationEmmiter) => {
      if (strationEmmiter !== this.props.station.number.toString()) {
        this.setState({stationEditable: false, stationName: this.props.station_title})
      }
    })
    this.openSub = PubSub.subscribe('OpenSpecificGraphEdit', (chan, toOpen) => {
      if (toOpen === this.props.station.number.toString()) {
        this.setState({stationEditable: true, stationName: this.props.station_title})
      }
    })
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.closeSub);
    PubSub.unsubscribe(this.openSub);
  }

  render() {
    const {station, changeStationName} = this.props
    return(
      <View>
        <View style={{flexDirection: "row", alignItems: "center"}}>
            <TextInput
              style={[styles.graphTitle, {flex: 7}]}
              value={this.state.stationName}
              editable={this.state.stationEditable}
              onChangeText={(text) => {
                  this.setState({stationName: text})
              }}
              onFocus={() => {
                this.setState({isInputFocused: true})}}
              onEndEditing={() => {
                changeStationName(station.number, this.state.stationName)
                this.setState({isInputFocused: false})
              }}
              />
            {
              (this.state.stationEditable) ?
              <View>
                <Icon
                  name="angle-up"
                  size={30}
                  color="#004d40"
                  style={{flex: 1, marginLeft: 5, marginRight: 5}}
                  onPress={() => {
                    this.props.changeStationOrder(station.number, -1, this.state.stationEditable)
                  }}
                />
                <Icon
                  name="angle-down"
                  size={30}
                  color="#004d40"
                  style={{flex: 1, marginLeft: 5, marginRight: 5}}
                  onPress={() => this.props.changeStationOrder(station.number, 1, this.state.stationEditable)}
                />
              </View>
              :
             <StationAvialablesBikes station={station} containerStyle={{marginRight: 10, paddingTop: 5, padding: 3, backgroundColor: colors.background, elevation: 5, borderRadius: 4}} />
            }
            <Icon
              name={(this.state.stationEditable) ? "check-circle" : "gear"}
              size={30}
              color={"#BF360C"}
              style={{flex: 1}}
              onPress={() => {
                this.props.closeAllEdit(station.number.toString())
                this.setState({stationName: this.props.station_title, stationEditable: !this.state.stationEditable})
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
