import React, {useState, useEffect} from 'react';
import DeckGL from '@deck.gl/react';
import {LightingEffect, DirectionalLight, AmbientLight } from '@deck.gl/core';
import {SolidPolygonLayer, PolygonLayer } from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {SphereGeometry, IcoSphereGeometry} from '@luma.gl/core'
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import * as moment from 'moment';
import * as d3 from 'd3';

const DATA_URL = {
    state_boundaries: `${process.env.PUBLIC_URL}/data/state_borders.json`,
    county_boundaries: `${process.env.PUBLIC_URL}/data/county_borders.json`
}

const MapContainer = styled.div`
    position:fixed;
    width:100%;
    height:100%;
    top:0;
    left:0;
    overflow:visible;
    background:rgb(15,15,15);
    color:white;
    button {
        color:white;
    }
`

const geom = new IcoSphereGeometry({
    iterations: 1
  });

const dirLight = new DirectionalLight({
    color: [128, 128, 0],
    intensity: 5.0,
    direction: [0, -100, -100],
    _shadow: true
  });

const ambientLight = new AmbientLight({
    color: [180,220,220],
    intensity: 3
});

const colorScale = d3.scaleLinear()
    .domain([
        0,
        .03,
        .05,
        .10,
        .15,
        .20,
        .25,
        1000
    ])
    .range([
        '#0D0887',
        '#5C01A6',
        '#9C179E',
        '#CB4679',
        '#ED7953',
        '#FDB42F',
        '#F0F921',
        '#F0F921'
    ])

const handleColor = (val) => {
    let color = d3.color(colorScale(val))
    if (color === null) return [240,240,240]
    return [color.r, color.g, color.b, 150]
}

/* eslint-disable react/no-deprecated */
const Map = () => {

    const [initialViewState, setInitialViewState] = useState({
        latitude: 0,
        longitude: 0,
        zoom: 4.75,
        pitch:40,
        bearing:0
    });

    const [effects] = useState(() => {
        const lightingEffect = new LightingEffect({dirLight, ambientLight});
        lightingEffect.shadowColor = [0, 0, 0, 0.15];
        return [lightingEffect];
        });
    
    const [currDate, setCurrDate] = useState(['2020-03-02'])
    const [oldDate, setOldDate] = useState(['2020-03-01'])
    const [timerId, setTimerId] = useState(null)
    const [timerId2, setTimerId2] = useState(null)
    const [centroidData, setCentroidData] = useState([])
    const [counter, setCounter] = useState(0)

    useEffect(() => {
        d3.csv(`${process.env.PUBLIC_URL}/data/centroids_testing_albers.csv`, d3.autoType)
            .then(data => { setCentroidData(data) })
    },[])
    console.log(centroidData)
    const PlayAnimation = () => {
        setCurrDate(['2020-03-02'])
        setOldDate(['2020-03-01'])
        setTimerId(setInterval(() => {
            setCurrDate(t => {
                if (t < '2021-01-19') {
                    var a = moment(t, 'YYYY-MM-DD')
                    setOldDate(a.format().slice(0,10))
                    a = a.add(1, 'day')
                    return a.format().slice(0,10)
                } else {
                    setTimerId(null)
                    setTimerId2(null)
                    return t
                }
            })
        }, 100))

        setTimerId2(setInterval(() => {
            setCounter( t => t >= 99 ? 0 : t+5)
        },5))
    }

    const layers =  [ 
        new SolidPolygonLayer({
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            id: 'background',
            data: [
                [[-400_000, 240_000], [440_000, 240_000], [440_000, -240_000], [-400_000, -240_000]]
            ],
            opacity: 1,
            getPolygon: d => d,
            stroked: false,
            filled: true,
            getFillColor: [15,15,15],
        }),
        new PolygonLayer({
            id: 'county-layer',
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            data: DATA_URL.county_boundaries,
            getPolygon: d=> d,
            stroked: true,
            filled: false,
            lineWidthMinPixels: 1,
            getLineColor: [240, 240, 240, 10],
            getLineWidth: 1
        }),
        new PolygonLayer({
            id: 'polygon-layer',
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            data: DATA_URL.state_boundaries,
            getPolygon: d=> d,
            stroked: true,
            filled: false,
            lineWidthMinPixels: 1,
            getLineColor: [240, 240, 240, 25],
            getLineWidth: 1
        }),
        new SimpleMeshLayer({
            id: 'mesh-layer',
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            data: centroidData,
            mesh: geom,
            wireframe: true,
            getPosition: d => [d.x,d.y],
            getColor: d => {
                let tempVal = d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100))
                return handleColor(tempVal)
            },
            getScale: d => [2500, 2500, (d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100)))*500000],
            getTranslation: d => [0, 0, (d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100)))*500000],
            // getScale: d => [(d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*20,
            //                 (d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*20, 
            //                 (d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*100], 
            updateTriggers: {
                getTranslation: [currDate],
                getScale: [currDate, counter],
                getColor: [currDate, counter]
            }
        }),
    ]

    return (
        <MapContainer>
            <Button onClick={PlayAnimation} id="playButton">Play</Button>
            <div id="title">
                <h1>COVID Testing Positivity Rates</h1>
                <h2>7-Day Rolling Average of {currDate}</h2>
            </div>
            <DeckGL 
                layers={layers} 
                initialViewState={initialViewState} 
                effects={effects}
                controller={true}>
            </DeckGL>
        </MapContainer>
    )
}

export default Map