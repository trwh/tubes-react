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
      tubeStations: [],
      filteredTubeStations: [],
      userTubeStations: [],
      stationFilter: ""
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addUserStation = this.addUserStation.bind(this);
  }

  componentWillMount() {
    this.setState({
      tubeStations,
      filteredTubeStations: tubeStations
    })
  }

  handleChange(e) {
    this.setState({ stationFilter: e.target.value });
    this.filterStations(e);
  }

  handleSubmit(e) {
    // TODO: Take station object and push it onto userTubeStations
  }

  filterStations(e) {
    let filteredStations = this.state.tubeStations;
    filteredStations = filteredStations.filter((station) => {
      return station.name.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    this.setState({ filteredTubeStations: filteredStations });
  }

  addUserStation(station) {
    console.log("Wrueey!" + station.id);
    this.setState(state => ({
      userTubeStations: state.userTubeStations.concat(station),
      stationFilter: ""
    }));
  }

  render() {
    return (
      <div>
        <h3>Set local station(s)</h3>
        <UserStationList stations={this.state.userTubeStations} />
        <form>
          <label htmlFor="station-filter">
            Name:
          </label>
          <input
            id="station-filter"
            onChange={this.handleChange}
            value={this.state.stationFilter}
          />
        </form>
        <FilteredStationList
          stations={this.state.filteredTubeStations}
          onClick={this.addUserStation}
        />
      </div>
    );
  }
}

class UserStationList extends Component {
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

class FilteredStationList extends Component {
  render() {
    return (
      <ul>
        {this.props.stations.map(station => (
          <div key={station.id}>
            <li key={station.id}>{station.name}</li>
            <button onClick={() => this.props.onClick(station)}>Add</button>
          </div>
        ))}
      </ul>
    );
  }
}

export default App;

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
      var tubeStationIdsSeen = [];

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
              if (!tubeStationIdsSeen.includes(station.id)) {
                var cleanedName = station.commonName.replace(
                  "Underground Station", "");
                var simplifiedStation = {
                  id: station.id,
                  name: cleanedName
                };
                tubeStationIdsSeen.push(station.id);
                tubeStations.push(simplifiedStation);
              }
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