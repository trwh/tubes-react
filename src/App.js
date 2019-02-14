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

    // getArrivals([{"id":"940GZZLURMD","name":"Richmond"}])
    //   .then(arrivals => console.log("Arrivals information from API: " + JSON.stringify(arrivals)))
    //   .catch(err => console.log(err));

    this.state = {
      tubeStations,
      filteredTubeStations: tubeStations,
      userTubeStations: [],
      filterValue: ""
    };

    // this.doGetArrivals = this.doGetArrivals.bind(this);
    this.filterChange = this.filterChange.bind(this);
    this.addUserStation = this.addUserStation.bind(this);
    this.clearUserStations = this.clearUserStations.bind(this);
    this.clearFilterValue = this.clearFilterValue.bind(this);
  }

  componentDidMount() {
    this.doGetArrivals();

    setTimeout(() => {
      console.log("Wrueey");
      this.componentDidMount();
    }, 5000);
  }

  doGetArrivals() {
    getArrivals(this.state.userTubeStations)
      .then(updatedUserTubeStations => {
        this.setState({ userTubeStations: updatedUserTubeStations });
      })
      .catch(err => console.log(err));
  }

  filterChange(e) {
    this.setState({ filterValue: e.target.value });
    this.filterStations(e);
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
    if (!this.state.userTubeStations.includes(station)) {
      this.setState(state => ({
        userTubeStations: state.userTubeStations.concat(station),
      }));
    // this.doGetArrivals();
    }
  }

  clearUserStations() {
    this.setState({ userTubeStations: [] });
  }

  clearFilterValue() {
    this.setState({ filterValue: "" });
  }

  render() {
    return (
      <div>
        <UserStationList stations={this.state.userTubeStations} />
        <button onClick={() => this.clearUserStations()}>Clear list</button>
        <form>
          <label htmlFor="station-filter">
            Name:
          </label>
          <input
            id="station-filter"
            onChange={this.filterChange}
            onClick={this.clearFilterValue}
            value={this.state.filterValue}
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
          <div key={station.id}>
            <li key={station.id}>{station.name}</li>
            <ArrivalsBoard arrivals={station.arrivals} />
          </div>
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

class ArrivalsBoard extends Component {
  render() {
    return (
      <div>
      {JSON.stringify(this.props.arrivals)}
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
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error("Error getting list of tube lines from TFL API.")
          }
        })
        .then(json => {
          json.forEach(line => {
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
                  " Underground Station", "");
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

function getArrival(stationId) {
  return new Promise(
    function(resolve, reject) {

      var arrivals = [];
      var arrivalsIdsSeen = [];

      fetch("https://api.tfl.gov.uk/stoppoint/" + stationId + "/arrivals")
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error("Error getting arrivals from TFL API.")
          }
        })
        .then(json => {
          json.forEach(arrival => {
            if (!arrivalsIdsSeen.includes(arrival.id) &&
              arrival.modeName === "tube") {
              var regex = / Platform \d$/gmi;
              var cleanedCurrentLocation = arrival.currentLocation.replace(
                regex, "");
              var simplifiedArrival = {
                id: arrival.id,
                lineId: arrival.lineId,
                lineName: arrival.lineName,
                towards: arrival.towards,
                timeToStation: arrival.timeToStation,
                currentLocation: cleanedCurrentLocation
              };
              arrivalsIdsSeen.push(arrival.id);
              arrivals.push(simplifiedArrival);
            }
          })
          resolve(arrivals);
        })
        .catch(err => reject(err));

    }
  )
}

function getArrivals(stations) {
  return new Promise(
    function(resolve, reject) {

      var updatedStations = [];
      var arrivalsFetchPromises = [];

      stations.forEach(station => {
        arrivalsFetchPromises.push(
          fetch("https://api.tfl.gov.uk/stoppoint/" + station.id + "/arrivals")
            .then(response => {
              if(response.ok) {
                return response.json();
              } else {
                throw new Error("Error getting arrivals from TFL API.")
              }
            })
        );
      })

      Promise.all(arrivalsFetchPromises)
        .then(jsonResponses => {

          for (var i = 0; i < jsonResponses.length; i++) {

            let arrivals = [];
            let arrivalsIdsSeen = [];

            jsonResponses[i].forEach(arrival => {
              if (!arrivalsIdsSeen.includes(arrival.id) &&
                arrival.modeName === "tube") {
                var regex = / Platform \d$/gmi;
                var cleanedCurrentLocation = arrival.currentLocation.replace(
                  regex, "");
                var simplifiedArrival = {
                  id: arrival.id,
                  lineId: arrival.lineId,
                  lineName: arrival.lineName,
                  towards: arrival.towards,
                  timeToStation: arrival.timeToStation,
                  currentLocation: cleanedCurrentLocation
                };
                arrivalsIdsSeen.push(arrival.id);
                arrivals.push(simplifiedArrival);
              }
            })

            var updatedStation = stations[i];
            updatedStation.arrivals = arrivals;
            updatedStations.push(updatedStation);

          }

          resolve(updatedStations);

        })
        .catch(err => reject(err)
        );

    }
  )
}