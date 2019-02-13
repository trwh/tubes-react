import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      station: "Richmond"
    };
  }

  render() {
    getTubeLines()
      .then(function (tubeLines){
        console.log("Tube lines:");
        console.log(JSON.stringify(tubeLines));
        return tubeLines;
      })
      .then(function(tubeLines) {
        return getTubeStations(tubeLines);
      })
      .then(function (tubeStations){
        console.log("Tube stations:");
        console.log(JSON.stringify(tubeStations));
      })
      .catch(function(err) {
        console.log(err);
      });

    return (
      <div>
        Hello! Let's look for {this.state.station}!
      </div>
    );
  }
}

export default App;

function getTubeLines() {
  return new Promise(
    function(resolve, reject) {

      var tubeLines = [];

      fetch("https://api.tfl.gov.uk/line/mode/tube")
        .then(function(response) {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error("Error getting list of tube lines from TFL API.")
          }
        })
        .then(function(json) {
          json.forEach(function(line){
            var simplifiedLine = {
              id: line.id,
              name: line.name
            };
            tubeLines.push(simplifiedLine);
          })
          resolve(tubeLines);
        })
        .catch(function(err) {
          reject(err);
        });

    }
  )
}

function getTubeStations(tubeLines) {
  return new Promise(
    function(resolve, reject) {

      var tubeStations = [];

      tubeLines.forEach(function(line){
        fetch("https://api.tfl.gov.uk/line/" + line.id + "/stoppoints")
          .then(function(response) {
            if(response.ok) {
              return response.json();
            } else {
              throw new Error("Error getting list of tube stations from TFL API.")
            }
          })
          .then(function(json) {
            json.forEach(function(station){
              var simplifiedStation = {
                id: station.id,
                name: station.commonName,
              };
              tubeStations.push(simplifiedStation);
            })
          })
          .catch(function(err) {
            reject(err);
          });
      })

      resolve(tubeStations);

    }
  )
}