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
      .then(function (output){
        console.log(JSON.stringify(output));
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

      var tubeStations = [];

      fetch("https://api.tfl.gov.uk/Line/Mode/tube")
        .then(function(response) {
              return response.json();
            })
        .then(function(json) {
          // TODO: Handle response.ok errors
          json.forEach(function(station){
            var simplifiedStation = {
              id: station.id,
              name: station.name
            };
            tubeStations.push(simplifiedStation);
          })
          resolve(tubeStations);
        })
        .catch(function(err) {
          console.log(err);
          reject(err);
        });

    }
  )
}