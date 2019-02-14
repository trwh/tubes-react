import React, { Component } from 'react';
import Cookies from 'universal-cookie';
// import './App.css';

const tubeStations = require("./stations.json");
const cookies = new Cookies();

class App extends Component {
  constructor(props) {
    super(props);

    // getTubeLines()
    //   .then(tubeLines => getTubeStations(tubeLines))
    //   .then(tubeStations => console.log("Tube stations from API: " + JSON.stringify(tubeStations)))
    //   .catch(err => console.log(err));

    this.state = {
      userTubeStations: [],
      inputText: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({ inputText: e.target.value });
  }

  // TODO: Get ID of station submitted?
  handleSubmit(e) {
    e.preventDefault();
    if (!this.state.inputText.length) {
      return;
    }
    const newStation = {
      name: this.state.inputText,
      id: Date.now()
    };
    this.setState(state => ({
      userTubeStations: state.userTubeStations.concat(newStation),
      inputText: ""
    }));
  }

  render() {
    return (
      <div>
        <h3>Set local station(s)</h3>
        <StationList stations={this.state.userTubeStations} />
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="new-station">
            Station name:
          </label>
          <input
            id="new-station"
            onChange={this.handleChange}
            value={this.state.inputText}
          />
          <button>
            Add station
          </button>
        </form>
      </div>
    );
  }
}

class StationList extends Component {
  render() {
    return (
      <ul>
        {this.props.stations.map(station => (
          <li key={station.id}>{station.name}</li>
        ))}
      </ul>
    );
  }
}

export default App;

// TODO: This becomes code to store our list of set stations.
// function getLocalStationsFromCookies() {
//   if (cookies.get("tfl-arr")) {
//     console.log("Hey, there's a cookie!");
//     return JSON.parse(cookies.get("tfl-arr"));
//   } else {
//     console.log("No cookie set, getting stations manually.");
//     getTubeLines()
//       .then(tubeLines => getTubeStations(tubeLines))
//       .then(tubeStations => {
//         console.log("Tube stations from API: " + tubeStations.length);
//         cookies.set("tfl-arr", JSON.stringify(tubeStations),
//           {
//             path: "/",
//             maxAge: 31536000
//           }
//         );
//         return tubeStations;
//       })
//       .catch(err => console.log(err));
//   }
// }

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