/**
 * 人员定位: 基于RN react-native-amap3d 库实现，版本号0.12.0
 * 1.在地图上显示所有人员的位置
 * 2.点击某个人员时，底部弹出详情弹框，可查看详情信息等
 */
import React, { Component } from 'react';
import { StyleSheet, View, Platform, Image } from 'react-native';
import {observable} from 'mobx';
import { observer } from 'mobx-react';
import { MapView, Marker } from "react-native-amap3d";

@observer
export default class StaffLocationPage extends Component {

    @observable position = { longitude: 112.0, latitude: 28.0 };
    @observable sourceData = [];    // 接口请求的数据
    @observable showMap = true;     // 是否展示地图，修复Android上部分机型在地图切换时的bug

    constructor(props) {

    }

    componentDidMount() {
        /**
         * 通过接口获取当前小区信息等
         * this.position = { longitude: result.lon, latitude: result.lat };
         * 通过接口获取所有人员数据
         * this.sourceData = result.data;
         */
    }

    // 处理人员图标点击事件
    _onStaffItemPress = (item) => { }

    _renderIcon = (item) => {
        let iconURL = item.imageUrl && item.imageUrl.length ? {uri: item.imageUrl} : require('./images/default_header.png');
        return (
            <View style={styles.staffPositionContainer}>
                <Image source={require('./images/staff_position.png')}/>
                <View style={styles.staffPosition}/>
                <Image style={styles.staffPositionIcon} defaultSource={require('./images/default_header.png')} source={iconURL}/>
                <Image style={styles.staffStatu} source={item.online == 1 ? require('./images/staff_online.png') : require('./images/staff_offline.png')}/>
            </View>
        );
    }

    _renderMarkers = () => {
        var items = [];
        if (this.sourceData && this.sourceData.length) {
            for (let i = 0; i < this.sourceData.length; i++) {
                const element = this.sourceData[i];
                let position = {longitude: element.lngLat[0], latitude: element.lngLat[1]};
                let item = (
                    <Marker infoWindowDisabled={true} 
                                 clickDisabled={false}
                                    coordinate={position}
                                          icon={() => this._renderIcon(element)}
                                       onPress={() => this._onStaffItemPress(element)}/>
                );
                items.push(item);
            }
        }
        return items;
    }

    render() {
        return (
            <View style={styles.container}>
                {this.showMap ? <MapView 
                    locationEnabled
                    zoomLevel={15}
                    style={{flex: 1}}
                    locationInterval={10000}
                    distanceFilter={10}
                    coordinate={this.position}
                    showsCompass={false}
                    showsZoomControls={false}
                    showsScale={false}
                    showsLocationButton={false}
                    >
                    {this._renderMarkers()}
                </MapView> : null}
            </View>
        );
    }

    formatTime(t) {
        t = parseInt(t);
        if (t < 10) {
            return "0" + t
        }
        return t
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(247, 247, 249, 1)',
    },
    staffPositionContainer: {
        backgroundColor: 'transparent',
        width: 76,
        ...Platform.select({
            android:{
                height: 76+7,
            },
            ios:{
                height: 76*2,
            }
        }),
        flexDirection: 'column',
        alignItems: 'center'
    },
    staffPositionIcon: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    staffStatu: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 16,
        width: 16
    },
    staffPosition: {
        width: 14,
        height: 7,
        borderRadius: 14,
        backgroundColor: '#DDDDDD'
    }
})
