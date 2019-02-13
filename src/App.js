import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import './App.css';

const cookies = new Cookies();

class App extends Component {
  constructor(props) {
    super(props);

    // TODO: Refactor to consume a promise
    var tubeStations = getTubeStationsFromCookies();

    console.log(JSON.stringify(tubeStations));

    // TODO: Store tubeStations in state
    this.state = {
      myStation: ""
    };
  }

  render() {
    // getTubeLines()
    //   .then(tubeLines => getTubeStations(tubeLines))
    //   .then(tubeStations => console.log("Tube stations from API: " + tubeStations.length))
    //   .catch(err => console.log(err));

    return (
      <div>
        Hello! Let's look for {this.state.station}!
      </div>
    );
  }
}

export default App;

// TODO: Refactor to return promise
function getTubeStationsFromCookies() {
  if (cookies.get("tfl-arr")) {
    console.log("Hey, there's a cookie!");
    return JSON.parse(cookies.get("tfl-arr"));
  } else {
    console.log("No cookie set, getting stations manually.");

    getTubeLines()
      .then(tubeLines => getTubeStations(tubeLines))
      .then(tubeStations => {
        console.log("Tube stations from API: " + tubeStations.length);
        cookies.set("tfl-arr", JSON.stringify(tubeStations),
          {
            path: "/",
            maxAge: 31536000
          }
        );
        return tubeStations;
      })
      .catch(err => console.log(err));
  }
}

function getTubeLines() {
  return new Promise(
    function(resolve, reject) {

      var tubeLines = [];

      fetch("https://api.tfl.gov.uk/line/mode/tube")
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error("Error getting list of tube lines from TFL API.")
          }
        })
        .then(json => {
          json.forEach(function(line){
            var simplifiedLine = {
              id: line.id,
              name: line.name
            };
            tubeLines.push(simplifiedLine);
          })
          resolve(tubeLines);
        })
        .catch(err => reject(err));

    }
  )
}

function getTubeStations(tubeLines) {
  return new Promise(
    function(resolve, reject) {

      var tubeStations = [];
      var tubeStationFetchPromises = [];

      tubeLines.forEach(line => {
        tubeStationFetchPromises.push(
          fetch("https://api.tfl.gov.uk/line/" + line.id + "/stoppoints")
            .then(response => {
              if(response.ok) {
                return response.json();
              } else {
                throw new Error("Error getting list of tube stations from TFL API.")
              }
            })
        );
      })

      Promise.all(tubeStationFetchPromises)
        .then(jsonResponses => {

          jsonResponses.forEach(json => {
            Array.from(json).forEach(station => {
              var simplifiedStation = {
                id: station.id,
                name: station.commonName,
              };
              tubeStations.push(simplifiedStation);
            })
          })

          // console.log("OK, there were " + tubeStations.length
          //   + " stations found.");
          resolve(tubeStations);

        })
        .catch(err => reject(err)
        );

    }
  )
}