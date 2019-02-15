import React, { Component } from 'react';
import Cookies from 'universal-cookie';
// import './App.css';

const masterStations = require("./stations.json");
const cookies = new Cookies();

class App extends Component {
  constructor(props) {
    super(props);

    // getLines()
    //   .then(lines => getStations(lines))
    //   .then(stations => console.log("Tube stations from API: " + JSON.stringify(stations)))
    //   .catch(err => console.log(err));

    // updateArrivalsOnStations([{"id":"940GZZLURMD","name":"Richmond"}])
    //   .then(arrivals => console.log("Arrivals information from API: " + JSON.stringify(arrivals)))
    //   .catch(err => console.log(err));

    this.state = {
      masterStations,
      filteredStations: masterStations,
      userStations: [],
      filterValue: ""
    };

    // this.doUpdateArrivalsOnStations = this.doUpdateArrivalsOnStations.bind(this);
    this.filterChange = this.filterChange.bind(this);
    this.addUserStation = this.addUserStation.bind(this);
    this.clearUserStations = this.clearUserStations.bind(this);
    this.clearFilterValue = this.clearFilterValue.bind(this);
  }

  componentDidMount() {
    this.doUpdateArrivalsOnStations(this.state.userStations);

    setTimeout(() => {
      console.log("Wrueey");
      this.componentDidMount();
    }, 5000);
  }

  doUpdateArrivalsOnStations(stations) {
    updateArrivalsOnStations(stations)
      .then(updatedStations => {
        this.setState({ userStations: updatedStations });
      })
      .catch(err => console.log(err));
  }

  filterChange(e) {
    this.setState({ filterValue: e.target.value });
    this.filterStations(e);
  }

  filterStations(e) {
    let filteredStations = this.state.masterStations;
    filteredStations = filteredStations.filter((station) => {
      return station.name.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    this.setState({ filteredStations: filteredStations });
  }

  addUserStation(station) {
    if (!this.state.userStations.includes(station)) {
      let newUserStations = this.state.userStations.concat(station);
      this.doUpdateArrivalsOnStations(newUserStations);
    }
  }

  clearUserStations() {
    this.setState({ userStations: [] });
  }

  clearFilterValue() {
    this.setState({ filterValue: "" });
  }

  render() {
    return (
      <div>
        <UserStationList stations={this.state.userStations} />
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
          stations={this.state.filteredStations}
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

function getLines() {
  return new Promise(
    function(resolve, reject) {

      let lines = [];

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
            lines.push(simplifyLine(line));
          })
          resolve(lines);
        })
        .catch(err => reject(err));

    }
  )
}

function simplifyLine (line) {
  return {
    id: line.id,
    name: line.name
  };
}

function getStations(lines) {
  return new Promise(
    function(resolve, reject) {

      let stations = [];
      let stationFetchPromises = [];
      let stationIdsSeen = [];

      lines.forEach(line => {
        stationFetchPromises.push(
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

      Promise.all(stationFetchPromises)
        .then(jsonResponses => {

          jsonResponses.forEach(json => {
            Array.from(json).forEach(station => {
              if (!stationIdsSeen.includes(station.id)) {
                stationIdsSeen.push(station.id);
                stations.push(simplifyStation(station));
              }
            })
          })

          resolve(stations);
        })
        .catch(err => reject(err));

    }
  )
}

function simplifyStation (station) {
  let cleanedName = station.commonName.replace(
    " Underground Station", "");
  return {
    id: station.id,
    name: cleanedName
  };
}

function getArrivals(stationId) {
  return new Promise(
    function(resolve, reject) {

      let arrivals = [];
      let arrivalsIdsSeen = [];

      fetch("https://api.tfl.gov.uk/stoppoint/" + stationId + "/arrivals")
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error("Error getting arrivals for "
              + stationId + " from TFL API.");
          }
        })
        .then(json => {
          json.forEach(arrival => {
            if (!arrivalsIdsSeen.includes(arrival.id) &&
              arrival.modeName === "tube") {
              arrivalsIdsSeen.push(arrival.id);
              arrivals.push(simplifyArrival(arrival));
            }
          })
          arrivals = groupArrivalsByLines(arrivals);
          resolve(arrivals);
        })
        .catch(err => reject(err));

    }
  )
}

function simplifyArrival (arrival) {
  let regex = / Platform \d$/gmi;
  let cleanedCurrentLocation = arrival.currentLocation.replace(
    regex, "");
  return {
    id: arrival.id,
    lineId: arrival.lineId,
    lineName: arrival.lineName,
    towards: arrival.towards,
    timeToStation: arrival.timeToStation,
    currentLocation: cleanedCurrentLocation
  };
}

function groupArrivalsByLines (arrivals) {
  let lineIdsSeen = [];
  let linesWithArrivals = [];

  arrivals.forEach(arrival => {
    if (!lineIdsSeen.includes(arrival.lineId)) {
      lineIdsSeen.push(arrival.lineId);
      linesWithArrivals.push(getLineFromArrival(arrival));
    }

    let linesWithArrivalsIndex = lineIdsSeen.indexOf(arrival.lineId);
    linesWithArrivals[linesWithArrivalsIndex].arrivals.push(arrival);
  })

  return(linesWithArrivals);
}

function getLineFromArrival (arrival) {
  return {
    id: arrival.lineId,
    name: arrival.lineName,
    arrivals: []
  }
}

function updateArrivalsOnStations(stations) {
  return new Promise(
    function(resolve, reject) {

      let arrivalsPromises = [];

      stations.forEach(station => {
        arrivalsPromises.push(
          getArrivals(station.id)
            .then(arrival => { return arrival })
        );
      })

      Promise.all(arrivalsPromises)
        .then(stationArrivals => {

          for (let i = 0; i < stationArrivals.length; i++) {
            stations[i].arrivals = stationArrivals[i];
          }

          resolve(stations);
        })
        .catch(err => reject(err));

    }
  )
}