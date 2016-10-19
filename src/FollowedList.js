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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {apiKey} from './GraphicsView'
import Icon from 'react-native-vector-icons/FontAwesome';
import colors from '../colors.json'
import PubSub from 'pubsub-js'
import {getFollowedStation} from '../index.android.js'
import {StationAvialablesBikes} from './StationsListElement'

class FollowedElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationEditable: false,
      stationName: this.props.station_name,
      lastUpdate: null,
    }
  }

  getLastUpdate = () => {
    if (!this.props.station) return 0
    const {last_update} = this.props.station
    const now = Date.now()
    return Math.floor(now / (1000 * 60) - last_update / (1000 * 60))
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

  renderIcon = () => {
    const {station} = this.props
    return (!this.state.stationEditable ?
      <View style={{alignItems: 'center'}}>
        <Icon
          name="gear"
          size={25}
          color="grey"
          style={{flex: 1, margin: 5}}
          onPress={() => {
            this.props.closeAllEdit(station.number.toString())
            this.setState({stationName: this.props.station_name, stationEditable: !this.state.stationEditable})
          }}
        />
        {this.props.loaded ?
          <Icon
            name="refresh"
            size={30}
            color="grey"
            style={{flex: 1, margin: 5}}
            onPress={() => this.props.reloadStation(station.number)}
          /> :
          <ActivityIndicator animating={!this.state.loaded} size={35} />
        }
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
    )
  }

  renderData = () => {
    const {station} = this.props
    return (
     <StationAvialablesBikes scale={2} station={station} containerStyle={styles.stationAviables} />

    )
  }

  renderText = () => {
    const lastUpdate = this.getLastUpdate()
    const {station} = this.props
    return ((station) ?
      <View style={{flex: 8}}>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
          <View style={{flex: 1}}>
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
            <Text numberOfLines={1} style={styles.stationAdress}>{station.address}</Text>
            <Text style={{marginLeft: 5, top: -5}}>{lastUpdate} min</Text>
          </View>
          {this.renderData()}
        </View>
      </View>
      : null
    )
  }

  render() {
    return (
        <View style={[styles.favoriElement, {elevation: (this.props.id % 2 == 0) ? 30 : 0}]}>
          {this.renderText()}
          {this.renderIcon()}          
        </View>
    );
  }
}

class FollowedList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stationData: [],
      loadedStation: [],
      refreshingAll: true,
    }
    this.props.onChangeTab(0, () => PubSub.publish('CloseAllStationEdit', "-1"))
  }

  componentWillMount() {
    this.autoUpdate = setInterval(() => this.forceUpdate(), 60000)
  }

  componentWillUnmount() {
    clearInterval(this.autoUpdate)
  }

  shouldComponentUpdate(nProps) {
    if (nProps.followedStations !== this.props.followedStations) {
     this.onRefresh(nProps.followedStations, false)
    }
    return true
  }

  onRefresh = (stationList, refresh) => {
    const doit = () => {
        Promise.all(stationList.map((followed) => fetch(`https://api.jcdecaux.com/vls/v1/stations/${followed.number}?contract=Toulouse&apiKey=${apiKey}`).then((res) => res.json())))
      .then((datas) => {
        const newStationData = []
        const newLoaded = this.state.loadedStation.slice(0)
        datas.forEach((station) => {
          newStationData[station.number] = station
          newLoaded[station.number] = true
        })
        this.setState({stationData: newStationData, loadedStation: newLoaded, refreshingAll: false})
      })
    }
    if (refresh) {
      this.setState({refreshingAll: true}, () => doit())
    } else {
      doit()
    }
  }

  reloadStation = (number) => {
    const newLoaded = this.state.loadedStation.slice(0)
    newLoaded[number] = false
    this.setState({loadedStation: newLoaded}, () => {
      fetch(`https://api.jcdecaux.com/vls/v1/stations/${number}?contract=Toulouse&apiKey=${apiKey}`).then((res) => res.json())
      .then((json) => {
        const newData = this.state.stationData.slice(0)
        newData[number] = json
        const otherLoaded = this.state.loadedStation.slice(0)
        otherLoaded[number] = true
        this.setState({stationData: newData, loadedStation: otherLoaded})
      })
    })
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
    const refreshControl = (
      <RefreshControl
        refreshing={this.state.refreshingAll}
        onRefresh={() => this.onRefresh(this.props.followedStations, true)}
      />
    )
    let listData = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return (
        <View style={styles.container}>
          <ListView
            style={{width: Dimensions.get("window").width}}
            dataSource={listData.cloneWithRows(this.props.followedStations)}
            refreshControl={refreshControl}
            enableEmptySections={true}
            renderRow={(rowData, sid, id) => <FollowedElement
              id={id}
              changeStationOrder={this.changeStationOrder}
              changeStationName={this.props.changeStationName}
              closeAllEdit={(stationEmmiter) => PubSub.publish('CloseAllStationEdit', stationEmmiter)}
              station={this.state.stationData[rowData.number]}
              station_name={rowData.name}
              reloadStation={this.reloadStation}
              loaded={this.state.loadedStation[rowData.number]}
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
      backgroundColor: colors.background,
    },
    stationName: {
      marginTop: 5,
      height: 40,
      textAlignVertical: "bottom",
      color: "black",
      fontWeight: "bold",
      marginLeft: 10,
      fontSize: 20,
    },
    stationAdress: {
      marginLeft: 15,
      top: -8,
      fontSize: 15,
    },
    favoriElement: {flex: 1,
      backgroundColor: colors.background,
      flexDirection: "row",
      justifyContent: "space-between",
      height: 80,
    },
    stationAviables: {marginRight: 10,
      borderRadius: 4,
      marginRight: 10,
    },
});
 export default FollowedList
