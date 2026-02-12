#!/usr/bin/env python3
"""
Generate stations.json from the TFL API.

Fetches all tube lines and their stop points from Transport for London's public
API, then writes the station data to src/stations.json.

Usage:
    python scripts/generate_stations.py

No dependencies required - uses Python standard library only.
"""

import json
import urllib.request
from typing import Any, Dict, List

TFL_API_BASE = "https://api.tfl.gov.uk"


def fetch_json(url: str) -> Any:
    """Fetch JSON data from a URL."""
    print(f"Fetching: {url}")
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0 (tubes-react station generator)")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def get_tube_lines() -> List[Dict[str, Any]]:
    """Fetch all tube lines from the TFL API."""
    url = f"{TFL_API_BASE}/line/mode/tube"
    lines_data = fetch_json(url)
    
    lines = []
    for line in lines_data:
        lines.append({
            "id": line["id"],
            "name": line["name"]
        })
    
    print(f"Found {len(lines)} tube lines")
    return lines


def get_stations_for_line(line_id: str) -> List[Dict[str, Any]]:
    """Fetch all stop points (stations) for a specific tube line."""
    url = f"{TFL_API_BASE}/line/{line_id}/stoppoints"
    return fetch_json(url)


def simplify_station_name(name: str) -> str:
    """Remove ' Underground Station' suffix from station names."""
    return name.replace(" Underground Station", "")


def build_stations_with_lines(lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Build a deduplicated list of stations with their associated lines.
    
    Each station will have:
    - id: station ID from TFL
    - name: simplified station name
    - lines: list of lines serving this station (with empty arrivals arrays)
    """
    stations_dict: Dict[str, Dict[str, Any]] = {}
    
    for line in lines:
        line_id = line["id"]
        line_name = line["name"]
        
        print(f"Processing {line_name} line...")
        stations_data = get_stations_for_line(line_id)
        
        for station_data in stations_data:
            station_id = station_data["id"]
            station_name = simplify_station_name(station_data["commonName"])
            
            # Initialize station if we haven't seen it before
            if station_id not in stations_dict:
                stations_dict[station_id] = {
                    "id": station_id,
                    "name": station_name,
                    "lines": []
                }
            
            # Add this line to the station's lines list
            stations_dict[station_id]["lines"].append({
                "id": line_id,
                "name": line_name,
                "arrivals": []
            })
    
    # Convert dictionary to list and sort by station name
    stations_list = list(stations_dict.values())
    stations_list.sort(key=lambda s: s["name"])
    
    print(f"Total unique stations: {len(stations_list)}")
    return stations_list


def write_stations_json(stations: List[Dict[str, Any]], output_path: str) -> None:
    """Write stations data to JSON file with 2-space indentation."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stations, f, indent=2, ensure_ascii=False)
    
    print(f"Written {len(stations)} stations to {output_path}")


def main() -> None:
    """Main entry point - fetch stations from TFL API and write to JSON file."""
    print("=" * 60)
    print("TFL Stations Generator")
    print("=" * 60)
    print()
    
    # Fetch tube lines
    lines = get_tube_lines()
    print()
    
    # Build stations with associated lines
    stations = build_stations_with_lines(lines)
    print()
    
    # Write to file
    output_path = "src/stations.json"
    write_stations_json(stations, output_path)
    print()
    
    print("=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
