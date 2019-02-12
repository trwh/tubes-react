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
    getTubeLines();
    return (
      <div>
        Hello! Let's look for {this.state.station}!
      </div>
    );
  }
}

export default App;

function getTubeLines() {
  var tubeStations = [];

  fetch("https://api.tfl.gov.uk/Line/Mode/tube")
    .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        json.forEach(function(station){
          var simoplifiedStation = {
            id: station.id,
            name: station.name
          };
          tubeStations.push(simoplifiedStation);
        })
          // console.log(JSON.stringify(tubeStations));
          return tubeStations;
      })
      .catch(function(err) {
        console.log(err);
      });

}