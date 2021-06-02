import React, { Component } from 'react';
import {Dimensions, View, Text, ScrollView, FlatList} from 'react-native';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default class WaterFallPage extends Component {

    static navigationOptions = ({ navigation }) => ({
        headerTitle:'瀑布流',
    });

    constructor(props) {
        super(props);

        let dataArr = [{title: '1', height: 150},
                        {title: '2', height: 180},
                        {title: '3', height: 130},
                        {title: '4', height: 220},
                        {title: '5', height: 110},
                        {title: '6', height: 210},
                        {title: '7', height: 90},
                        {title: '8', height: 170},
                        {title: '9', height: 130},
                        {title: '10', height: 180},
                        {title: '11', height: 140},
                        {title: '12', height: 120},
                        {title: '13', height: 150}];
        var dataArr1 = [];
        var dataArr2 = [];
        var arr1Height = 0;
        var arr2Height = 0;
        for (let i = 0; i < dataArr.length; i++) {
            if (arr1Height > arr2Height) {
                dataArr2.push(dataArr[i]);
                arr2Height += dataArr[i].height; 
            } else {
                dataArr1.push(dataArr[i]);
                arr1Height += dataArr[i].height;
            }
        }

        this.columnData = [dataArr1, dataArr2];
    }

    _renderItem = ({item, index}) =>{
        let height = item.height;
        return <View style={{width: windowWidth/2-20, height: height, backgroundColor: '#999999', margin: 10}}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{fontSize: 24}}>{item.title}</Text>
            </View>
        </View>
    }

    render() {
        return (
            <ScrollView style={{flex: 1}}>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    {this.columnData.map((col, index) =>{
                        return <FlatList
                            // ref={ref => this.state.columns[index] = ref}
                            data={col}
                            keyExtractor={ (item, index) => item + index}
                            renderItem={ this._renderItem }
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={false}
                        /> 
                    })}
                </View>
            </ScrollView> 
        );
    }
}
