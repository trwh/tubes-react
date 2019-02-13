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
      .then(tubeLines => {
        console.log("Tube lines:");
        console.log(JSON.stringify(tubeLines));
        return tubeLines;
      })
      .then(tubeLines => getTubeStations(tubeLines))
      .then(tubeStations => {
        console.log("Tube stations:");
        console.log(JSON.stringify(tubeStations));
      })
      .catch(err => console.log(err)
      );

    return (
      <div>
        Hello! Let's look for {this.state.station}!
      </div>
    );
  }
}

export default App;

// TODO: Refactor for arrow functions
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
      var tubeStationFetchPromises = [];
      // var tubeStationFetchResponseJsons = [];

      tubeLines.forEach(line => {
        tubeStationFetchPromises.push(
          fetch("https://api.tfl.gov.uk/line/" + line.id + "/stoppoints")
            .then(response => response.json())
        );
      })

      // console.log("Just made the array of promises to resolve all. Here it is: "
      //   + JSON.stringify(tubeStationFetchPromises)
      // );

      Promise.all(tubeStationFetchPromises)
        .then(jsonResponses => {

          // console.log("We got this many fetch responses: " +
          //   responses.length);
          // console.log("Here is the first fetch response: " +
          //   JSON.stringify(responses[0]));

          // responses.forEach(response => {
          //   console.log("Dealing with a response now.");
          //   if (response.ok) {
          //     tubeStationFetchResponseJsons.push(response.json());
          //   } else {
          //     throw new Error("Error getting list of tube stations from TFL API.")
          //   }
          // })

          console.log("OK, now we have " +
            jsonResponses.length +
            " response JSON objects to work with. Here they all are: "
            + JSON.stringify(jsonResponses)
            );

          jsonResponses.forEach(json => {
            // console.log("Dealing with a response JSON object now. Here's one of many: "
              // + JSON.stringify(json));
            Array.from(json).forEach(station => {
              // console.log("Found a station object!");
              var simplifiedStation = {
                id: station.id,
                name: station.commonName,
              };
              tubeStations.push(simplifiedStation);
            })
          })

          console.log("OK, there were " + tubeStations.length
            + " stations found.");

          resolve(tubeStations);

        })
        .catch(err => reject(err)
        );

    }
  )
}