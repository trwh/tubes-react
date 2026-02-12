import { useState, useEffect, useRef, useCallback } from "react";
import * as tfl from "./tfl.js";
import masterStations from "./stations.json";

const REFRESH_INTERVAL_MS = 30000;

const LINE_COLOURS = {
  bakerloo: "#b26300",
  central: "#dc241f",
  circle: "#ffc80a",
  district: "#007d32",
  "hammersmith-city": "#f589a6",
  jubilee: "#838d93",
  metropolitan: "#9b0058",
  northern: "#000000",
  piccadilly: "#0019a8",
  victoria: "#039be5",
  "waterloo-city": "#76d0bd",
};

function getLineColour(lineId) {
  return LINE_COLOURS[lineId] || "#888c96";
}

function getStatusClass(status) {
  if (!status) return "";
  if (status === "Good Service") return "good-service";
  if (status.includes("Minor") || status.includes("Reduced"))
    return "minor-delays";
  if (
    status.includes("Severe") ||
    status.includes("Suspended") ||
    status.includes("Part Closure")
  )
    return "severe-delays";
  return "disrupted";
}

function App() {
  const [filteredStations, setFilteredStations] = useState([]);
  const [userStations, setUserStations] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [lineStatuses, setLineStatuses] = useState([]);
  const [error, setError] = useState(null);

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
        setUserStations([...updatedStations]);
        setError(null);
      })
      .catch(() => {
        setError("Could not load arrival times. Will retry automatically.");
      });
  }, []);

  // Load saved stations from localStorage and start periodic refresh.
  useEffect(() => {
    const stored = localStorage.getItem("userStations");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserStations(parsed);
      userStationsRef.current = parsed;
    }

    updateUserStationLineArrivals();
    const intervalId = setInterval(
      updateUserStationLineArrivals,
      REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(intervalId);
  }, [updateUserStationLineArrivals]);

  // Fetch line statuses on mount and periodically.
  useEffect(() => {
    function fetchStatuses() {
      tfl
        .getAllLineStatuses()
        .then((statuses) => setLineStatuses(statuses))
        .catch(() => {});
    }
    fetchStatuses();
    const intervalId = setInterval(fetchStatuses, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  function filterChange(e) {
    const value = e.target.value;
    setFilterValue(value);

    if (value.trim().length === 0) {
      setFilteredStations([]);
      return;
    }

    const filtered = masterStations.filter((station) => {
      return (
        station.name.toLowerCase().search(value.toLowerCase().trim()) !== -1
      );
    });
    setFilteredStations(filtered);
  }

  function clearFilterValue() {
    setFilterValue("");
    setFilteredStations([]);
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
    if (!userStations.find((s) => s.id === station.id)) {
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

  function removeUserStation(stationId) {
    const newUserStations = userStations.filter((s) => s.id !== stationId);
    setUserStationsInLocalStorage(newUserStations);
    setUserStations(newUserStations);
    userStationsRef.current = newUserStations;
  }

  function clearUserStations() {
    localStorage.removeItem("userStations");
    setUserStations([]);
    userStationsRef.current = [];
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <h1>Live Tube Departures Board</h1>
          <button
            className="refresh-btn"
            onClick={updateUserStationLineArrivals}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      <div className="search-section">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a station..."
          onChange={filterChange}
          onClick={clearFilterValue}
          value={filterValue}
        />
        {filteredStations.length > 0 && (
          <FilteredStationList
            stations={filteredStations}
            onClick={addUserStation}
          />
        )}
      </div>

      {userStations.length > 0 && (
        <div className="actions-row">
          <button className="clear-btn" onClick={clearUserStations}>
            Clear all
          </button>
        </div>
      )}

      {userStations.length === 0 ? (
        <div className="empty-state">
          Search for a station above to see live arrivals.
        </div>
      ) : (
        <UserStationList
          stations={userStations}
          lineStatuses={lineStatuses}
          onRemove={removeUserStation}
        />
      )}

      <DisruptionsBar lineStatuses={lineStatuses} />

      <footer className="footer">
        <div>
          Powered by{" "}
          <a
            href="https://tfl.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            TfL Open Data
          </a>
        </div>
        <div>
          &copy; Tim Harrison 2026 &middot;{" "}
          <a
            href="https://github.com/trwh/tubes-react"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </div>
      </footer>
    </div>
  );
}

function DisruptionsBar({ lineStatuses }) {
  const disruptions = lineStatuses.filter(
    (line) => line.status !== "Good Service",
  );

  if (disruptions.length === 0) return null;

  return (
    <div className="disruptions-section">
      <hr className="disruptions-hr" />
      <h2 className="disruptions-heading">Current Disruptions</h2>
      <div className="disruptions-bar">
        {disruptions.map((line) => (
          <div
            key={line.id}
            className="disruption-item"
            style={{ borderLeftColor: getLineColour(line.id) }}
          >
            <span className="disruption-line-name">{line.name}</span>
            <span className="disruption-status">{line.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner">
      <span>{message}</span>
      <button onClick={onDismiss}>&times;</button>
    </div>
  );
}

function UserStationList({ stations, lineStatuses, onRemove }) {
  return (
    <div className="stations-list">
      {stations.map((station) => (
        <div key={station.id} className="station-card">
          <div className="station-header">
            <span className="station-name">{station.name}</span>
            <button
              className="station-remove"
              onClick={() => onRemove(station.id)}
              title="Remove station"
            >
              &times;
            </button>
          </div>
          {station.lines.length === 0 ||
          station.lines.every((l) => l.arrivals.length === 0) ? (
            <div className="station-loading">Loading arrivals...</div>
          ) : (
            <ArrivalsBoard lines={station.lines} lineStatuses={lineStatuses} />
          )}
        </div>
      ))}
    </div>
  );
}

function ArrivalsBoard({ lines, lineStatuses }) {
  return (
    <div>
      {lines.map((line) => {
        const statusInfo = lineStatuses.find((s) => s.id === line.id);
        return (
          <div key={line.id} className="line-section">
            <div className="line-header">
              <span
                className="line-colour"
                style={{ backgroundColor: getLineColour(line.id) }}
              />
              <span className="line-name">{line.name}</span>
              {statusInfo && (
                <span
                  className={
                    "line-status-badge " + getStatusClass(statusInfo.status)
                  }
                >
                  {statusInfo.status}
                </span>
              )}
            </div>
            <ArrivalsBoardLine arrivals={line.arrivals} />
          </div>
        );
      })}
    </div>
  );
}

function ArrivalsBoardLine({ arrivals }) {
  if (arrivals.length === 0) return null;

  return (
    <ul className="arrivals-list">
      {arrivals.map((arrival) => (
        <li key={arrival.id} className="arrival-row">
          <span className="arrival-time">
            {arrival.humanReadableTimeToStation}
          </span>
          <span className="arrival-towards">{arrival.towards}</span>
          <span className="arrival-location">{arrival.currentLocation}</span>
        </li>
      ))}
    </ul>
  );
}

function FilteredStationList({ stations, onClick }) {
  return (
    <div className="dropdown">
      {stations.map((station) => (
        <div
          key={station.id}
          className="dropdown-item"
          onClick={() => onClick(station)}
        >
          {station.name}
        </div>
      ))}
    </div>
  );
}

export default App;
