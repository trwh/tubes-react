import { useState, useEffect, useRef, useCallback } from "react";
import * as tfl from "./tfl.js";
import masterStations from "./stations.json";

const REFRESH_INTERVAL_MS = 30000;

function App() {
  const [filteredStations, setFilteredStations] = useState(masterStations);
  const [userStations, setUserStations] = useState([]);
  const [filterValue, setFilterValue] = useState("");

  // Keep a ref to userStations so the interval callback always sees the
  // latest value without needing to restart the interval.
  const userStationsRef = useRef(userStations);
  useEffect(() => {
    userStationsRef.current = userStations;
  }, [userStations]);

  const updateUserStationLineArrivals = useCallback(() => {
    const stations = userStationsRef.current;
    if (stations.length === 0) return;

    tfl
      .updateLineArrivalsOnStations(stations)
      .then((updatedStations) => {
        setUserStations(updatedStations);
      })
      .catch((err) => console.log(err));
  }, []);

  // Load saved stations from localStorage on mount.
  useEffect(() => {
    const stored = localStorage.getItem("userStations");
    if (stored) {
      setUserStations(JSON.parse(stored));
    }
  }, []);

  // Periodically refresh arrivals data.
  useEffect(() => {
    updateUserStationLineArrivals();
    const intervalId = setInterval(
      updateUserStationLineArrivals,
      REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(intervalId);
  }, [updateUserStationLineArrivals]);

  // Log line statuses on mount.
  useEffect(() => {
    tfl.getAllLineStatuses().then((statuses) => console.log(statuses));
  }, []);

  function clearFilterValue() {
    setFilterValue("");
    setFilteredStations(masterStations);
  }

  function filterChange(e) {
    const value = e.target.value;
    setFilterValue(value);

    const filtered = masterStations.filter((station) => {
      return (
        station.name.toLowerCase().search(value.toLowerCase().trim()) !== -1
      );
    });
    setFilteredStations(filtered);
  }

  function setUserStationsInLocalStorage(stations) {
    const stationsWithoutLineArrivals =
      tfl.resetLineArrivalsOnStations(stations);
    localStorage.setItem(
      "userStations",
      JSON.stringify(stationsWithoutLineArrivals),
    );
  }

  function addUserStation(station) {
    if (!userStations.includes(station)) {
      const newUserStations = userStations.concat(station);
      setUserStationsInLocalStorage(newUserStations);
      setUserStations(newUserStations);
      clearFilterValue();
      // Trigger an immediate refresh for the new station list.
      // We need to update the ref first so the fetch uses the new list.
      userStationsRef.current = newUserStations;
      updateUserStationLineArrivals();
    }
  }

  function clearUserStations() {
    localStorage.removeItem("userStations");
    setUserStations([]);
  }

  return (
    <div>
      <h2>Live TFL Arrivals</h2>
      <div>
        <div>
          <button onClick={updateUserStationLineArrivals}>Refresh</button>
        </div>
        <UserStationList stations={userStations} />
        <div>
          <button onClick={clearUserStations}>Clear list</button>
        </div>
        <form>
          <label htmlFor="station-filter">Search:</label>
          <input
            id="station-filter"
            onChange={filterChange}
            onClick={clearFilterValue}
            value={filterValue}
          />
        </form>
        <FilteredStationList
          stations={filteredStations}
          onClick={addUserStation}
        />
      </div>
    </div>
  );
}

function UserStationList({ stations }) {
  return (
    <div>
      {stations.map((station) => (
        <div key={station.id}>
          <h3>{station.name}</h3>
          <ArrivalsBoard lines={station.lines} />
        </div>
      ))}
    </div>
  );
}

function ArrivalsBoard({ lines }) {
  return (
    <div>
      {lines.map((line) => (
        <div key={line.id}>
          <h4>{line.name}</h4>
          <ArrivalsBoardLine arrivals={line.arrivals} />
        </div>
      ))}
    </div>
  );
}

function ArrivalsBoardLine({ arrivals }) {
  return (
    <ul>
      {arrivals.map((arrival) => (
        <li key={arrival.id}>
          {arrival.humanReadableTimeToStation} | {arrival.towards} |{" "}
          {arrival.currentLocation}
        </li>
      ))}
    </ul>
  );
}

function FilteredStationList({ stations, onClick }) {
  return (
    <div id="filtered-stations-dropdown">
      {stations.map((station) => (
        <div
          key={station.id}
          className="filtered-stations-dropdown-item"
          onClick={() => onClick(station)}
        >
          {station.name}
        </div>
      ))}
    </div>
  );
}

export default App;
