import React, { Component } from 'react';
import * as tfl from './tfl.js';
import Cookies from 'universal-cookie';
// import './App.css';

const masterStations = require("./stations.json");
const cookies = new Cookies();

class App extends Component {
  constructor(props) {
    super(props);

    // tfl.getLines()
    //   .then(lines => tfl.getStationsWithLines(lines))
    //   .then(stations => console.log("Tube stations from API: " + JSON.stringify(stations)))
    //   .catch(err => console.log(err));

    this.state = {
      masterStations,
      filteredStations: masterStations,
      userStations: [],
      filterValue: ""
    };

    this.filterChange = this.filterChange.bind(this);
    this.addUserStation = this.addUserStation.bind(this);
    this.clearFilterValue = this.clearFilterValue.bind(this);
  }

  componentDidMount() {
    this.getUserStationsFromCookie();
    this.periodicallyRefresh();
  }

  periodicallyRefresh() {
    setTimeout(() => {
      // console.log("Refreshing arrivals information.");
      this.periodicallyRefresh();
    }, 30000);

    this.updateUserStationsAndTheirLineArrivals(this.state.userStations);
  }

  updateUserStationsAndTheirLineArrivals(stations) {
    tfl.updateLineArrivalsOnStations(stations)
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
      this.setStationCookie(newUserStations);
      this.setState({ userStations: newUserStations });
    }
  }

  clearUserStations() {
    this.setStationCookie([]);
    this.setState({ userStations: [] });
  }

  clearFilterValue() {
    this.setState({ filterValue: "" });
  }

  setStationCookie(stations) {
    let stationsWithoutLines = tfl.removeLinesFromStations(stations);
    cookies.set("stations", stationsWithoutLines, {
        path: "/",
        maxAge: 99999999
      }
    );
  }

  getUserStationsFromCookie() {
    if(cookies.get("stations")) {
      let userStationsFromCookie = cookies.get("stations");
      this.updateUserStationsAndTheirLineArrivals(userStationsFromCookie);
    }
  }

  render() {
    return (
      <div>
        <h2>Live TFL Arrivals</h2>
        <div>
          <UserStationList stations={this.state.userStations} />
          <div>
            <button onClick={() => this.clearUserStations()}>Clear list</button>
          </div>
          <form>
            <label htmlFor="station-filter">
              Search:
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
      </div>
    );
  }
}

class UserStationList extends Component {
  render() {
    return (
      <div>
        {this.props.stations.map(station => (
          <div key={station.id}>
            <h3>{station.name}</h3>
            <ArrivalsBoard lines={station.lines} />
          </div>
        ))}
      </div>
    );
  }
}

class ArrivalsBoard extends Component {
  render() {
    return (
     <div>
        {this.props.lines.map(line => (
          <div key={line.id}>
            <h4>{line.name}</h4>
            <ArrivalsBoardLine arrivals={line.arrivals} />
          </div>
        ))}
      </div>
    );
  }
}

class ArrivalsBoardLine extends Component {
  render() {
    return (
     <ul>
        {this.props.arrivals.map(arrival => (
          <li key={arrival.id}>{arrival.humanReadableTimeToStation} | {arrival.towards} | {arrival.currentLocation}</li>
        ))}
      </ul>
    );
  }
}

class FilteredStationList extends Component {
  render() {
    return (
      <div id="filtered-stations-dropdown">
        {this.props.stations.map(station => (
          <div key={station.id}
            className="filtered-stations-dropdown-item"
            onClick={() => this.props.onClick(station)}>
            {station.name}
          </div>
        ))}
      </div>
    );
  }
}

export default App;