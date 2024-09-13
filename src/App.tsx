import { LatLngTuple } from "leaflet";
import { useCallback, useState } from "react";
import { components } from "./api/routingEngine/schema";
import MapComponent from "./components/MapComponent";
import useApi, { GeoJsonWithId } from "./hooks/useApi";

import "./style.css";
import { FeatureCollection } from "geojson";

export type VehicleDto = components["schemas"]["VehicleDto"];

export type JobDto = components["schemas"]["JobDto"] & {
  timeArrival?: number;
  timeDeparture?: number;
};

export type Route = {
  geoData: GeoJsonWithId[];
  distance: number;
  drivingTime: number;
  driverId: string;
};

function App() {
  const baseUrl = "http://localhost:8080";
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [uuid, setUUID] = useState("");
  const [genericRouteUrl, setGenericLoadingUrl] = useState("");
  const [drivers, setDrivers] = useState<VehicleDto[]>([]);
  const { useRouteLoadingFromUuidAsync, useGenericRouteLoader: useGenericRouteLoading } =
    useApi(baseUrl);
  const [currentPlacementType, setCurrentPlacementType] = useState<
    "job" | "driver"
  >("job");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  const setDriver = (index: number, driver: VehicleDto) => {
    setDrivers((drivers) => {
      drivers[index] = driver;
      return drivers;
    });
  };

  const addDriver = (driver: VehicleDto) => {
    setDrivers((drivers) => [...drivers, driver]);
  };

  const setJob = (index: number, job: JobDto) => {
    setJobs((jobs) => {
      jobs[index] = job;
      return jobs;
    });
  };

  const addJob = (job: JobDto) => {
    setJobs((jobs) => [...jobs, job]);
  };

  const buildJobSetter = (index: number) => {
    return (job: JobDto) => setJob(index, job);
  };

  const buildDriverSetter = (index: number) => {
    return (driver: VehicleDto) => setDriver(index, driver);
  };

  const loadFromUuid = useCallback(() => {
    useRouteLoadingFromUuidAsync(uuid).then((res) => {
      setJobs([...res.jobs]);
      setDrivers(res.drivers);
      const getRouteDriverNumber = (route: Route) => parseInt(route.driverId.slice(6));
      setRoutes(res.routes.sort((a, b) => getRouteDriverNumber(a) > getRouteDriverNumber(b) ? 1 : getRouteDriverNumber(a) == getRouteDriverNumber(b) ? 0 : -1));
    });
  }, [uuid]);

  const changeCurrentRouteIndex = useCallback(
    (change: number) => {
      setCurrentRouteIndex(
        (prevRouteIndex) => (prevRouteIndex + change > 0 ? (prevRouteIndex + change) % routes.length : (routes.length - 1 + (prevRouteIndex + change)))
      );
    },
    [routes, currentRouteIndex]
  );

  const loadGenericRoute = useCallback(() => {
    useGenericRouteLoading(genericRouteUrl).then((response) => {
      const { routes } =
        response;

      setRoutes(routes);
    });
  }, [genericRouteUrl]);

  const bounds: LatLngTuple[] = [
    [47.27101, 5.8630797],
    [60.4363296, 25.1965582],
  ];

  return (
    <>
      <h1>Routing Engine :) </h1>
      <h3>
        {showAllRoutes ? (
          <>
            Total Distance: {Math.round(routes.reduce((prev, nextItem) => prev + nextItem.distance, 0) / 1000)}km <br />
            Total Driving Time: {Math.round(routes.reduce((prev, nextItem) => prev + nextItem.drivingTime, 0)  / 60 / 60)}h <br />
            Total Routes Count: {routes.length}
          </>
        ) : currentRouteIndex < routes.length ? (
          <>
            Distance: {Math.round(routes[currentRouteIndex].distance / 1000)}km
            <br />
            Driving Time:{" "}
            {Math.round(routes[currentRouteIndex].drivingTime / 60)}min <br />
            Current driver: {routes[currentRouteIndex].driverId} (
            {currentRouteIndex})<br />
            <button onClick={() => changeCurrentRouteIndex(-1)}>
              Previous
            </button>
            <button onClick={() => changeCurrentRouteIndex(1)}>Next</button><br/>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(routes[currentRouteIndex].geoData))}>Copy GeoJson</button>
          </>
        ) : (
          <>Nothing to display</>
        )}
      </h3>
      <span>
        <label htmlFor="showAllRoutes">
          Display all routes:
          <input
            name="showAllRoutes"
            defaultChecked
            type="checkbox"
            onChange={(e) => {
              setShowAllRoutes(e.target.checked);
            }}
          />
        </label>
      </span>
      <MapComponent
        bounds={bounds}
        jobPositions={[]}
        driverPositions={[]}
        driverSetterBuilder={buildDriverSetter}
        jobSetterBuilder={buildJobSetter}
        geoJson={
          showAllRoutes
            ? routes.map((route) => route.geoData).reduce((prev, next) => prev.concat(next), [])
            : currentRouteIndex < routes.length
            ? routes[currentRouteIndex].geoData
            : []
        }
      />
      <input
        type="text"
        placeholder="uuid"
        onChange={(e) => setUUID(e.target.value)}
      />
      <button onClick={loadFromUuid}>Load from uuid</button>
      <input
        type="text"
        placeholder="uri"
        onChange={(e) => setGenericLoadingUrl(e.target.value)}
      />
      <button onClick={loadGenericRoute}>Load generic Route</button>
    </>
  );
}

export default App;
