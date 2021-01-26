import React, {useState, useEffect, useRef, useCallback} from 'react';
import DeckGL from '@deck.gl/react';
import {LightingEffect, DirectionalLight, AmbientLight } from '@deck.gl/core';
import {SolidPolygonLayer, PolygonLayer, ColumnLayer } from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import Slider from '@material-ui/core/Slider';
// import {SphereGeometry, IcoSphereGeometry} from '@luma.gl/core'
import * as moment from 'moment';
import * as d3 from 'd3';

const DATA_URL = {
    state_boundaries: `${process.env.PUBLIC_URL}/data/state_borders.json`,
    county_boundaries: `${process.env.PUBLIC_URL}/data/county_borders.json`
}

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

const colors = [
    '#0D0887',
    '#5C01A6',
    '#9C179E',
    '#CB4679',
    '#ED7953',
    '#FDB42F',
    '#F0F921',
    '#F0F921'
]

const breaks = [
    0,
    .03,
    .05,
    .10,
    .15,
    .20,
    .25,
    1000
]

const colorScale = d3.scaleLinear()
    .domain(breaks)
    .range(colors)

const handleColor = (val) => {
    let color = d3.color(colorScale(val))
    if (color === null) return [240,240,240]
    return [color.r, color.g, color.b, 150]
}

/* eslint-disable react/no-deprecated */
const Map = () => {

    const dateList = () => {
        let tempList = ['2020-02-01']
        let currDate = '2020-02-01'

        while (currDate < '2021-01-18') {
            let tempDate = moment(currDate, 'YYYY-MM-DD')
            currDate = tempDate.add(1, 'day').format().slice(0,10)
            tempList.push(currDate)
        }

        return tempList
        
    }

    let validDates = dateList()

    const [initialViewState, setInitialViewState] = useState({
        latitude: 0,
        longitude: 0,
        zoom: 4.6,
        pitch:40,
        bearing:0
    });

    const [effects] = useState(() => {
        const lightingEffect = new LightingEffect({dirLight, ambientLight});
        lightingEffect.shadowColor = [0, 0, 0, 0.15];
        return [lightingEffect];
    });

    const [timerId, setTimerId] = useState(null)
    const [centroidData, setCentroidData] = useState([])
    const [timeInterval, setTimeInterval] = useState(800)
    
    const [currDate, setCurrDate] = useState(['2020-02-01']);

    const [toggle, running] = useInterval(() => {
        setCurrDate(t => {
            if (t < '2021-01-18') {
                var a = moment(t, 'YYYY-MM-DD')
                a = a.add(1, 'day')
                return a.format().slice(0,10)
            } else {
                return t
            }
        })
    }, 1000-timeInterval);
  
    const resetDate = () => setCurrDate('2020-02-01');

    useEffect(() => {
        document.addEventListener('contextmenu', event => event.preventDefault());

        d3.csv(`${process.env.PUBLIC_URL}/data/centroids_testing_albers.csv`, d3.autoType)
            .then(data => { setCentroidData(data) })
    },[])

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
        // new SimpleMeshLayer({
        //     id: 'mesh-layer',
        //     coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        //     data: centroidData,
        //     mesh: geom,
        //     wireframe: true,
        //     getPosition: d => [d.x,d.y],
        //     getColor: d => {
        //         let tempVal = d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100))
        //         return handleColor(tempVal)
        //     },
        //     getScale: d => [2500, 2500, (d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100)))*500000],
        //     getTranslation: d => [0, 0, (d[`pos_${currDate}`]*(counter/100)+(d[`pos_${currDate}`]*((100-counter)/100)))*500000],
        //     // getScale: d => [(d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*20,
        //     //                 (d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*20, 
        //     //                 (d[`tcap_${currDate}`]*(counter/100)+(d[`tcap_${currDate}`]*((100-counter)/100)))*100], 
        //     updateTriggers: {
        //         getTranslation: [currDate],
        //         getScale: [currDate, counter],
        //         getColor: [currDate, counter]
        //     }
        // }),
        new ColumnLayer({
            id: 'line-layer',
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            data: centroidData,
            diskResolution: 6,
            radius: 5000,
            material:false,
            extruded: true,
            pickable: true,
            elevationScale: 5000,
            getPosition: d => [d.x,d.y],
            getFillColor: d => handleColor(d[`pos_${currDate}`]),
            getLineColor: [0, 0, 0],
            getElevation: d => [(d[`pos_${currDate}`])*250],
            // getElevation: d => [(d[`tcap_${currDate}`])/10],
            updateTriggers: {
                getFillColor: currDate,
                getElevation: currDate,
            },
            transitions: {
                getFillColor: 1000-timeInterval,
                getElevation: 1000-timeInterval,
            }
        })
    ]

    const handleTimeInterval = (e, newVal) => {
        setTimeInterval(newVal)
    };

    const handleDate = (e, newVal) => {
        setCurrDate(validDates[newVal])
    };

    const idle = () => {}

    return (
        <div id="mapContainer">
            <div id="buttons">
                <button onClick={resetDate}>Reset</button>
                <button onClick={toggle}>{running ? "Pause" : "Resume"}</button>
                
                <p id="playback-slider" >
                    Playback Speed
                </p>
                <Slider 
                    value={timeInterval} 
                    onMouseDown={running ? toggle : idle} 
                    onChange={handleTimeInterval} 
                    min={0}
                    max={900}
                    step={25}
                    aria-labelledby="playback-slider"
                />

                <p id="date-slider" >
                    Date Select
                </p>
                <Slider 
                    value={validDates.indexOf(currDate)}
                    onMouseDown={running ? toggle : idle} 
                    onChange={handleDate} 
                    min={0}
                    max={validDates.length-1}
                    step={1}
                    aria-labelledby="date-slider"
                />
            </div>
            <div id="title">
                <h1>COVID Testing Positivity Rates</h1>
                <h2>7-Day Rolling Average of {currDate}</h2>
            </div>
            <div id="logo">
                <a href="https://theuscovidatlas.org/" target="_blank" rel="noopener noreferrer">
                    <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="US Covid Atlas Logo" />
                </a>
            </div>
            <div id="attribution">
                <a href="https://theuscovidatlas.org/" target="_blank" rel="noopener noreferrer">  
                    <p>Learn more at USCovidAtlas.org</p>
                </a>
                <p>Testing data from CDC. State and County boundaries from US Census.</p>
            </div>
            <div id="scale">
                <div id="breaks">
                    {breaks.slice(1,-1).reverse().map((item, index) => <p>{index===0 ? '>' : ''}{parseInt(item*100)}%</p>)}
                </div>
                <div id="colors">
                    {colors.slice(0,-1).reverse().map(item => <span style={{backgroundColor: item}}></span>)}
                </div>
            </div>
            <DeckGL 
                layers={layers} 
                initialViewState={initialViewState} 
                effects={effects}
                controller={true}>
            </DeckGL>
        </div>
    )
}

// Thanks https://stackoverflow.com/a/56952253 @Ori Drori
function useInterval(callback, delay) {
    const savedCallback = useRef();
    const intervalId = useRef(null);
    const [currentDelay, setDelay] = useState(delay);
  
    const toggleRunning = useCallback(
      () => setDelay(currentDelay => (currentDelay === null ? delay : null)),
      [delay]
    );
  
    const clear = useCallback(() => clearInterval(intervalId.current), []);
  
    // Remember the latest function.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
  
      if (intervalId.current) clear();
  
      if (currentDelay !== null) {
        intervalId.current = setInterval(tick, currentDelay);
      }
  
      return clear;
    }, [currentDelay, clear]);
  
    return [toggleRunning, !!currentDelay];
}

export default Map