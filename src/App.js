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
    //   .then(lines => tfl.getStations(lines))
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
    tfl.updateArrivalsOnStations(stations)
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