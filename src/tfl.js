// By Tim Harrison
// https://github.com/trwh

export function getLinesFromTflApi() {
  return new Promise(
    function(resolve, reject) {

      let lines = [];

      // Note that `dlr` and `overground` modes are also available, but the
      // quality of the TFL API data is poor compared to tube.
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

function simplifyLine(line) {
  return {
    id: line.id,
    name: line.name,
    arrivals: []
  };
}

export function getStationsWithLinesFromTflApi(lines) {
  return new Promise(
    function(resolve, reject) {

      let stationsWithLines = [];
      let stationFetchPromises = [];
      let stationIdsSeen = [];

      lines.forEach(line => {
        stationFetchPromises.push(
          fetch("https://api.tfl.gov.uk/line/" + line.id + "/stoppoints")
            .then(response => {
              if(response.ok) {
                return response.json();
              } else {
                throw new Error("Error getting list of stations from TFL API.")
              }
            })
        );
      })

      Promise.all(stationFetchPromises)
        .then(jsonResponses => {

          for (let i = 0; i < jsonResponses.length; i++) {
            Array.from(jsonResponses[i]).forEach(station => {
              if (!stationIdsSeen.includes(station.id)) {
                stationIdsSeen.push(station.id);
                stationsWithLines.push(simplifyStation(station));
              }
              stationsWithLines = addLineToAnyMatchingStations(
                stationsWithLines,
                station.id,
                lines[i]);
            })
          }

          resolve(stationsWithLines);
        })
        .catch(err => reject(err));

    }
  )
}

function simplifyStation(station) {
  let cleanedName = station.commonName.replace(
    " Underground Station", "");
  return {
    id: station.id,
    name: cleanedName,
    lines: []
  };
}

function addLineToAnyMatchingStations(stations, stationId, line) {
  let indexOfMatchingStation = stations.findIndex(station => station.id == stationId);
  stations[indexOfMatchingStation].lines.push(line);
  return stations;
}

export function getLineArrivals(stationId) {
  return new Promise(
    function(resolve, reject) {

      let arrivals = [];
      let lines = [];
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
            if (!arrivalsIdsSeen.includes(arrival.id)) {
              arrivalsIdsSeen.push(arrival.id);
              arrivals.push(simplifyArrival(arrival));
            }
          })
          arrivals = addHumanReadableTimes(arrivals);
          lines = groupArrivalsByLines(arrivals);
          lines = arrangeLineArrivalsByTime(lines);
          resolve(lines);
        })
        .catch(err => reject(err));

    }
  )
}

function simplifyArrival(arrival) {
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

function groupArrivalsByLines(arrivals) {
  let lineIdsSeen = [];
  let lines = [];

  arrivals.forEach(arrival => {
    if (!lineIdsSeen.includes(arrival.lineId)) {
      lineIdsSeen.push(arrival.lineId);
      lines.push(getLineFromArrival(arrival));
    }

    let lineIndex = lineIdsSeen.indexOf(arrival.lineId);
    lines[lineIndex].arrivals.push(arrival);
  })

  return(lines);
}

function getLineFromArrival(arrival) {
  return {
    id: arrival.lineId,
    name: arrival.lineName,
    arrivals: []
  }
}

function arrangeArrivalsByTime(arrivals) {
  let timesToStationSeen = [];
  let orderedArrivals = [];

  arrivals.forEach(arrival => {
    timesToStationSeen.push(arrival.timeToStation);
  })

  timesToStationSeen = timesToStationSeen.sort((a, b) => a - b);

  arrivals.forEach(arrival => {
    let arrivalIndex = timesToStationSeen.indexOf(arrival.timeToStation);
    orderedArrivals[arrivalIndex] = arrival;
  })

  return(orderedArrivals);
}

function arrangeLineArrivalsByTime(lines) {
  for (let i = 0; i < lines.length; i++) {
    lines[i].arrivals = arrangeArrivalsByTime(lines[i].arrivals);
  }

  return(lines);
}

function addHumanReadableTimes(arrivals) {
  arrivals.forEach(arrival => {
    arrival.humanReadableTimeToStation =
      secondsToHumanReadableTime(arrival.timeToStation);
  })

  return(arrivals);
}

function secondsToHumanReadableTime(seconds) {
  if (seconds < 60) {
    return (seconds.toString() + "\"");
  }

  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  return (minutes.toString() + "'" +
    seconds.toString() + "\"");
}

export function updateLineArrivalsOnStations(stations) {
  return new Promise(
    function(resolve, reject) {

      let lineArrivalsPromises = [];

      stations.forEach(station => {
        lineArrivalsPromises.push(
          getLineArrivals(station.id)
            .then(lineArrivals => { return lineArrivals })
        );
      })

      Promise.all(lineArrivalsPromises)
        .then(stationLineArrivals => {

          for (let i = 0; i < stationLineArrivals.length; i++) {
            stations[i].lines = stationLineArrivals[i];
          }

          resolve(stations);
        })
        .catch(err => reject(err));

    }
  )
}

export function resetLineArrivalsOnStations(stations) {
  let stationsWithoutLineArrivals = [];

  stations.forEach(station => {
    stationsWithoutLineArrivals.push ({
      id: station.id,
      name: station.name,
      lines: resetArrivalsOnLines(station.lines)
    });
  });

  return(stationsWithoutLineArrivals);
}

function resetArrivalsOnLines(lines) {
  return lines.map(simplifyLine);
}