NB: This project is a work in progress - the UI is currently unstyled! Check back for updates, or star this repo to be notified automatically.

# [TFL Arrivals](https://tubes.org.uk)
A simple React app which displays London tube arrival times provided by [Transport for London's public API](https://api.tfl.gov.uk/).

Because it's not straightforward to get a list of tube stations from the TFL API, a list of stations and their IDs is provided in `/src/stations.json` and is included in the build. Live arrival times are then fetched by the app from the TFL API using these station IDs and refreshed every 30s. The TFL API doesn't require authentication.

### Built With

* [Create React App](https://github.com/facebook/create-react-app)
* [universal-cookie](https://github.com/reactivestack/cookies/tree/master/packages/universal-cookie)

### Installation

```
npm install
npm start
```
Visit http://localhost:3000 to view TFL Arrivals!

### Deploy to production

```
npm run build
```

### Station List

The app relies on a prepopulated list of tube stations in `/src/stations.json` to display for the user to select. There are currently 270 and should any more be added, or any of their IDs change, you can recreate `stations.json` by following these instructions.

The file is created with output from the functions I've written and `export`ed in `/src/tfl.js`. The relevant functions will be run in the right order if you uncomment this block in the main React `App` `constructor`,

```
    tfl.getLinesFromTflApi()
      .then(lines => tfl.getStationsWithLinesFromTflApi(lines))
      .then(stationsWithLines => console.log("Tube stations from API: " + JSON.stringify(stationsWithLines)))
      .catch(err => console.log(err));
```

Then copy the output in the JavaScript console to create `/src/stations.json` manually.

## License

This project is licensed under the terms of the GNU GPLv3 license.
