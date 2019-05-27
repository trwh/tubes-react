import React, { Component } from 'react';
import * as tfl from './tfl.js';
// import './App.css';

const masterStations = require("./stations.json");

class App extends Component {
  constructor(props) {
    super(props);

    // tfl.getLinesFromTflApi()
    //   .then(lines => tfl.getStationsWithLinesFromTflApi(lines))
    //   .then(stationsWithLines => console.log("Tube stations from API: " + JSON.stringify(stationsWithLines)))
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
    this.getUserStationsFromLocalStorage();

    setTimeout(() => {
      this.periodicallyRefresh();
    }, 0);

    console.log(tfl.getAllLineStatuses());
  }

  periodicallyRefresh() {
    this.updateUserStationLineArrivals();

    setTimeout(() => {
      this.periodicallyRefresh();
    }, 30000);
  }

  updateUserStationLineArrivals() {
    tfl.updateLineArrivalsOnStations(this.state.userStations)
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
        e.target.value.toLowerCase().trim()) !== -1;
    });
    this.setState({ filteredStations: filteredStations });
  }

  addUserStation(station) {
    if (!this.state.userStations.includes(station)) {
      let newUserStations = this.state.userStations.concat(station);
      this.setUserStationsInLocalStorage(newUserStations);

      this.setState({ userStations: newUserStations }, () => {
        this.clearFilterValue();
        this.updateUserStationLineArrivals();
      });
    }
  }

  clearUserStations() {
    localStorage.removeItem("userStations");
    this.setState({ userStations: [] });
  }

  clearFilterValue() {
    this.setState({
      filterValue: "",
      filteredStations: masterStations
    });
  }

  setUserStationsInLocalStorage(stations) {
    let stationsWithoutLineArrivals = tfl.resetLineArrivalsOnStations(stations);
    localStorage.setItem(
      "userStations",
      JSON.stringify(stationsWithoutLineArrivals)
    );
  }

  getUserStationsFromLocalStorage() {
    if (localStorage.getItem("userStations")) {
      this.setState({
        userStations: JSON.parse(localStorage.getItem("userStations"))
      });
    }
  }

  render() {
    return (
      <div>
        <h2>Live TFL Arrivals</h2>
        <div>
          <div>
            <button onClick={() => this.updateUserStationLineArrivals()}>Refresh</button>
          </div>
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