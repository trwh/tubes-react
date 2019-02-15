// By Tim Harrison
// https://github.com/trwh

export function getLines() {
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

export function getStations(lines) {
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

export function getArrivals(stationId) {
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
            if (!arrivalsIdsSeen.includes(arrival.id) &&
              arrival.modeName === "tube") {
              arrivalsIdsSeen.push(arrival.id);
              arrivals.push(simplifyArrival(arrival));
            }
          })
          arrivals = addHumanReadableTime(arrivals);
          lines = groupArrivalsByLines(arrivals);
          lines = arrangeLineArrivalsByTime(lines);
          resolve(lines);
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

    let lineIndex = lineIdsSeen.indexOf(arrival.lineId);
    linesWithArrivals[lineIndex].arrivals.push(arrival);
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

function arrangeArrivalsByTime (arrivals) {
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

function arrangeLineArrivalsByTime (lines) {
  for (let i = 0; i < lines.length; i++) {
    lines[i].arrivals = arrangeArrivalsByTime(lines[i].arrivals);
  }

  return(lines);
}

function addHumanReadableTime (arrivals) {
  arrivals.forEach(arrival => {
    arrival.humanReadableTimeToStation =
      secondsToHumanReadableTime(arrival.timeToStation);
  })

  return(arrivals);
}

function secondsToHumanReadableTime (s) {
  return s.toString();
}

export function updateArrivalsOnStations(stations) {
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
            stations[i].lines = stationArrivals[i];
          }

          resolve(stations);
        })
        .catch(err => reject(err));

    }
  )
}