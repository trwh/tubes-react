# [TFL Live Tube Departures Board](https://tubes.org.uk)

A React app which displays London tube departure times provided by [Transport for London's public API](https://api.tfl.gov.uk/) and refreshed every 30s. The TFL API doesn't require authentication.

### Built With

- [React 18](https://react.dev/)
- [Vite](https://vite.dev/)

### Installation

```
npm install
npm run dev
```

Visit http://localhost:3000 to view TFL Arrivals!

### Deploy to production

```
npm run build
```

### Station List

The app relies on a prepopulated list of tube stations in `/src/stations.json` to display for the user to select. There are currently 272 stations. Should any more be added, or any of their IDs change, you can regenerate `stations.json` by running:

```
python scripts/generate_stations.py
```

This fetches all tube lines and their stop points from the TFL API and writes the result to `src/stations.json`.

## License

This project is licensed under the terms of the GNU GPLv3 license.