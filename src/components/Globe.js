import React, {useState, useEffect} from 'react';
import DeckGL from '@deck.gl/react';
import {LightingEffect, _SunLight as SunLight, AmbientLight, _GlobeView as GlobeView} from '@deck.gl/core';
import {SolidPolygonLayer, GeoJsonLayer} from '@deck.gl/layers';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import * as moment from 'moment';
import * as d3 from 'd3';

const MapContainer = styled.div`
    position:fixed;
    width:100%;
    height:100%;
    top:0;
    left:0;
    overflow:visible;
`

const view = new GlobeView({id: 'globe', controller: false, resolution:1});

const dirLight = new SunLight({
    timestamp: 1554927200000, 
    color: [180, 220, 220],
    intensity: 1,
    _shadow: true
});

const ambientLight = new AmbientLight({
    color: [180,220,220],
    intensity: 1
});
const colorScale = (val) => {
    let color = d3.color(d3.interpolateYlOrRd((val/1000)+0.25));
    return [color.r, color.g, color.b, 150]
}
// Source data GeoJSON
const COUNTIES = `${process.env.PUBLIC_URL}/data/counties_update2.geojson`; //eslint-disable-line

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

const getData = (data, dates) => {
    var sum = 0;

    for (let i=0; i<dates.length; i++){
        sum += data[dates[i]]
    }

    return sum;
}


/* eslint-disable react/no-deprecated */
export default function Globe(props){
    const [initialViewState, setInitialViewState] = useState({
        latitude: 38,
        longitude: -87,
        zoom: 4.5,
        pitch:45,
        bearing:-30
    });

    const [effects] = useState(() => {
        const lightingEffect = new LightingEffect({dirLight, ambientLight});
        lightingEffect.shadowColor = [0, 0, 0, 0.15];
        return [lightingEffect];
        });
    
    const [currDate, setCurrDate] = useState(['2020-03-01'])
    const [timerId, setTimerId] = useState(null)

    const PlayAnimation = () => {
        // setIsPlaying(1)
        setTimerId(setInterval(() => {
            setCurrDate(t => {
                var a = moment(t[0]);
                a = a.add(1, 'week');
                if (a > moment()) a = moment('2020-03-01');

                let dates = [];
                
                for (let i=0; i<7; i++){
                    let tempDate = a.add(1, 'day')
                    dates.push(moment(tempDate, 'YYYY-MM-DD').format().slice(0,10))
                }

                return dates
            })
        }, 500))
    }

    const layers =  [ 
        new SolidPolygonLayer({
            id: 'background',
            data: [
                [[-135, 55], [-60, 55], [-60, 15], [-135, 15]]
            ],
            opacity: 1,
            getPolygon: d => d,
            stroked: false,
            filled: true,
            getFillColor: [255,255,255],
        }),
        new GeoJsonLayer({
            id: 'counties-layer',
            data: COUNTIES,
            pickable: true,
            stroked: true,
            filled: true,
            extruded: true,
            lineWidthScale: 1,
            lineWidthMinPixels: 1,
            getFillColor: f => colorScale((getData(f.properties,currDate)/f.properties['population'])*100000),
            wireframe:true,
            getLineColor: [255,255,255],
            getElevation: f => (getData(f.properties,currDate)/f.properties['population'])*50000000,
            getRadius: 100,
            getLineWidth: 1,
            transitions: {
                getElevation: 500,
                getFillColor: 500,
            },   
            parameters: {
                depthTest: true,
            },
            updateTriggers: {
                getElevation: currDate,
                getFillColor: currDate
            }
        }),
    ]

    return (
        <MapContainer>
            <Button onClick={PlayAnimation} id="playButton">Play</Button>
            <div id="title">
                <h1>COVID Cases by Population, Week of {currDate[0]}</h1>
            </div>
            <DeckGL 
                layers={layers} 
                initialViewState={initialViewState} 
                effects={effects}
                // views={view} //enable this for globe view
                controller={true}>
            </DeckGL>
        </MapContainer>
    )
}