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
  Dimensions,
  ListView,
  TextInput,
} from 'react-native';
import MapView from 'react-native-maps';
import Popover from 'react-native-popover'
import {apiKey} from './GraphicsView'
import StationsListElement from './StationsListElement'
import Icon from 'react-native-vector-icons/FontAwesome';
import colors from '../colors.json'
import PubSub from 'pubsub-js'
import {getFollowedStation} from '../index.android.js'

class FollowedElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationEditable: false,
      stationName: this.props.station_name
    }
  }

  componentWillMount() {
    this.closeSub = PubSub.subscribe('CloseAllStationEdit', (chan, strationEmmiter) => {
      if (strationEmmiter !== this.props.station.number.toString()) {
        this.setState({stationEditable: false, stationName: this.props.station_name})
      }
    })
    this.openSub = PubSub.subscribe('OpenStationEdit', (chan, toOpen) => {
      if (toOpen === this.props.station.number.toString()) {
        this.setState({stationEditable: true, stationName: this.props.station_name})
      }
    })
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.closeSub);
    PubSub.unsubscribe(this.openSub);
  }

  render() {
    const {station} = this.props
    return (
        <View style={styles.favoriElement}>
          {(station) ?
            <View style={{flex: 8}}>
              <TextInput
                value={this.state.stationName}
                editable={this.state.stationEditable}
                onChangeText={(text) => {
                    this.setState({stationName: text})
                }}
                style={styles.stationName}
                onSubmitEditing={() => {
                  this.props.changeStationName(station.number, this.state.stationName)
                  this.setState({stationEditable: !this.state.stationEditable})
                }}
                onEndEditing={() => {
                  this.props.changeStationName(station.number, this.state.stationName)
                }}
              />
              <Text style={styles.stationAdress}>{station.address}</Text>
            </View>
            : null
          }
          {!this.state.stationEditable ?
            <View style={{alignItems: 'center'}}>
              <Icon
                name="gear"
                size={25}
                color={"#BF360C"}
                style={{flex: 1, margin: 5}}
                onPress={() => {
                  this.props.closeAllEdit(station.number.toString())
                  this.setState({stationName: this.props.station_name, stationEditable: !this.state.stationEditable})
                }}
              />
              <Icon
                name="refresh"
                size={30}
                color={"#BF360C"}
                style={{flex: 1, margin: 5}}
                onPress={() => {
                  this.props.closeAllEdit(station.number.toString())
                  this.setState({stationName: this.props.station.name, stationEditable: !this.state.stationEditable})
                }}
              />
            </View> :
            <View>
              <Icon
                name="angle-up"
                size={25}
                color="#004d40"
                style={{height: 20, marginLeft: 10}}
                onPress={() => {
                  this.props.changeStationOrder(station.number, -1, this.state.stationEditable)
                }}
              />
              <Icon
                name="check-circle"
                size={30}
                color={"#BF360C"}
                style={{flex: 1, margin: 5}}
                onPress={() => {
                  this.props.closeAllEdit(station.number.toString())
                  this.setState({stationName: this.props.station_name, stationEditable: !this.state.stationEditable})
                }}
              />
              <Icon
                name="angle-down"
                size={25}
                color="#004d40"
                style={{marginLeft: 10, height: 20}}
                onPress={() => this.props.changeStationOrder(station.number, 1, this.state.stationEditable)}
                />
            </View>
          }
        </View>
    );
  }
}

class FollowedList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationData: []
    }
    this.props.onChangeTab(0, () => PubSub.publish('CloseAllStationEdit', "-1"))
  }

  shouldComponentUpdate(nProps) {
    if (nProps.followedStations !== this.props.followedStations) {
      Promise.all(nProps.followedStations.map((followed) => fetch(`https://api.jcdecaux.com/vls/v1/stations/${followed.number}?contract=Toulouse&apiKey=${apiKey}`).then((res) => res.json())))
      .then((datas) => {
        const newStationData = []
        datas.forEach((station) => {
          newStationData[station.number] = station
        })
        this.setState({stationData: newStationData})
      })
    }
    return true
  }

  changeStationOrder = (number, side, editable) => {
    if (this.props.changeStationOrder(number, side, editable)) {
      PubSub.publish('CloseAllStationEdit', "-1")
      const act = getFollowedStation(this.props.followedStations, "number", number)
      const dest = getFollowedStation(this.props.followedStations, "order", act.order)
      PubSub.publish('OpenStationEdit', dest.number.toString())
    }
  }

  render() {
    let listData = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return (
        <View style={styles.container}>
          <ListView
            style={{width: Dimensions.get("window").width}}
            dataSource={listData.cloneWithRows(this.props.followedStations)}
            enableEmptySections={true}
            renderRow={(rowData, sid, id) => <FollowedElement
              changeStationOrder={this.changeStationOrder}
              changeStationName={this.props.changeStationName}
              closeAllEdit={(stationEmmiter) => PubSub.publish('CloseAllStationEdit', stationEmmiter)}
              station={this.state.stationData[rowData.number]}
              station_name={rowData.name}
            />}
          />
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#F5FCFF',
    },
    stationName: {
      height: 40,
      textAlignVertical: "bottom",
      color: "black",
      fontWeight: "bold",
      marginLeft: 10,
      fontSize: 20,
    },
    stationAdress: {
      marginLeft: 15,
      fontSize: 15,
    },
    favoriElement: {flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: "black",
      height: 80,
    },
});
 export default FollowedList
