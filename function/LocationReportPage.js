/**
 * 位置上报: 基于RN react-native-amap-geolocation 库实现，版本号1.1.2
 * 1.登录成功后，弹窗提示是否开启位置上报；退出登录或被挤出登录的情况，需要停止位置上报
 * 2.每60s上报一次，由于iOS不能设置时间间隔回调，所以手动通过时间点记录再进行比较，实现非准确上报
 */
import React, { Component } from 'react';
import { DeviceEventEmitter, Platform, PermissionsAndroid, View, NativeModules } from 'react-native';

import { init, setInterval, setAllowsBackgroundLocationUpdates, setNeedAddress, addLocationListener, start, stop, setLocatingWithReGeocode } from 'react-native-amap-geolocation';
import moment from 'moment';

export default class LocationReportPage extends Component {

    curLatitude = null; // 当前纬度
    curLongitude = null; // 当前经度
    reportTimestamp = null; // iOS上报的时间点，用来做定时(非准确上报)
    hasInitListener = false; // 初始化高德监听(在通知回调中开启一次，在APP初始化开启会有问题)
    isLoginState = false; // 是否是登录状态

    constructor(props) {
        global.positionReport = false; // 定位上报标识：全局使用，其它地方可进行关闭或打开
    }

    componentWillMount() {
        this.loginSuccessListener = DeviceEventEmitter.addListener('loginSuccess', (data) => {
            DeviceEventEmitter.emit('uploadPosition', '1');
        });
        this.logoutListenter = DeviceEventEmitter.addListener('logOut', (data) => {
            DeviceEventEmitter.emit('uploadPosition', '0');
        });
        this.uploadPositionListener = DeviceEventEmitter.addListener('uploadPosition', (data) => {
            stop();
            global.positionReport = false;
            this.curLatitude = null;
            this.curLongitude = null;
            this.reportTimestamp = null;
            if (data == 1) {
                this.isLoginState = true;
                global.positionAlert.show();
            } else {
                this.isLoginState = false;
                global.positionAlert.hide();
                DeviceEventEmitter.emit('changePositionReportState', '0');
            }
        });
        this._initAmap();
    }

    componentWillUnmount() {
        this.loginSuccessListener.remove();
        this.logoutListenter.remove();
        this.uploadPositionListener.remove();
   }

    _initAmap = () => {
        // 主线程初始化SDK
        if(Platform.OS === 'android'){
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        }
        init({
            ios: "15b619ee7ce8cabc0bdc93efc19ba1ce",
            android: "0a2a2bb0552b359cea518930960c6ff5"
        });
    }

    // 开启位置上报
    _launchPositionReport = () => {
        if (this.isLoginState && global.positionReport == false) {
            DeviceEventEmitter.emit('changePositionReportState', '1');
            global.positionReport = true;
            if (this.hasInitListener) {
                start();
            } else {
                this.hasInitListener = true;
                this.initPositionListener();
            }
        }
    }

    // 关闭位置上报
    _stopPositionReport = () => {
        stop();
        DeviceEventEmitter.emit('changePositionReportState', '0');
        global.positionReport = false;
        this.curLatitude = null;
        this.curLongitude = null;
        this.reportTimestamp = null;
    }

    // 初始化SDK的监听
    initPositionListener = () => {
        setNeedAddress(true);
        if (Platform.OS === 'ios') {
            setLocatingWithReGeocode(true);
            setAllowsBackgroundLocationUpdates(true); // iOS后台权限需要开启
        } else {
            setInterval(60*1000);
        }
        addLocationListener(location =>{
            if (location) {
                if(location.city) {
                    if (Platform.OS === 'ios') {
                        if (location.timestamp == null) {
                            this.reportTimestamp = location.timestamp;
                        } else {
                            if (location.timestamp - this.reportTimestamp < 58*1000) {
                                return;
                            } else {
                                this.reportTimestamp = location.timestamp;
                            }
                        }
                    }
                    let currentPositon = {
                        lng: location.longitude,
                        lat: location.latitude,
                        positionName: location.address,
                        currentTime: ''+new moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                    };
                    if (this.curLatitude == null) {
                        this.curLatitude = location.latitude;
                        this.curLongitude = location.longitude;
                        this.uploadPosition([currentPositon]);
                    } else {
                        let meters = this.getDistance(this.curLongitude, this.curLatitude, location.longitude, location.latitude);
                        if (meters > 10.0) {
                            this.uploadPosition([currentPositon]);
                            this.curLatitude = location.latitude;
                            this.curLongitude = location.longitude;
                        } else {
                            let positonArr = [{
                                currentTime: ''+new moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                            }];
                            this.uploadPosition(positonArr);
                        }
                    }
                    global.curLatitude = location.latitude;
                    global.curLongitude = location.longitude;
                } else {
                    global.curLatitude = null;
                    global.curLongitude = null;
                }
            } else {
                global.curLatitude = null;
                global.curLongitude = null;
            }
        });
        start();
    }

    // 计算两点距离：网上找的公式
    getDistance = (startLon, startLat, endLon, endLat) => {
        var lon1 = (Math.PI / 180) * startLon;
        var lat1 = (Math.PI / 180) * startLat;
        var lon2 = (Math.PI / 180) * endLon;
        var lat2 = (Math.PI / 180) * endLat;
        // 地球半径
        var R = 6371;
        // 两点间距离 KM
        var d = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)) * R;
        // 公里转米
        var abs = Math.abs(d * 1000);
        return Math.round(abs);
    }

    // 上报位置数据给后台
    uploadPosition = async(requestParam) => {
        // ......
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                {/* AlertView 是自定义的模态弹窗 */}
                <AlertView 
                    ref={alert => global.positionAlert = alert}
                    title={'是否开启位置上报'}
                    leftTitle={'关闭'}
                    rightTitle={'开启'}
                    leftClick={this._stopPositionReport}
                    rightClick={this._launchPositionReport} />
            </View>
        );
    }
}
