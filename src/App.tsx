import { useQueryClient } from "@tanstack/react-query";
import { LatLng, LatLngTuple } from "leaflet";
import { useCallback, useState } from "react";
import { components } from "./api/routingEngine/schema";
import DisplayDriverTodos from "./components/DisplayDriverTodos";
import MapComponent from "./components/MapComponent";
import useApi from "./hooks/useApi";

import "./style.css";

export type JobDto = components["schemas"]["JobDto"];
export type VehicleDto = components["schemas"]["VehicleDto"];

const buildRequestData = (
  driverPositions: VehicleDto[],
  jobPositions: JobDto[]
): components["schemas"]["FleetInstructionsRequest"] => {
  return {
    jobs: jobPositions,
    vehicles: driverPositions,
  };
};

function App() {
  const baseUrl = "http://localhost:8080";
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [drivers, setDrivers] = useState<VehicleDto[]>([]);
  const { useOptimalRouteInstruction } = useApi(baseUrl);
  const [currentPlacementType, setCurrentPlacementType] = useState<
    "job" | "driver"
  >("job");
  const { data, isLoading, isFetching } = useOptimalRouteInstruction(
    buildRequestData(drivers, jobs)
  );

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

  const bounds: LatLngTuple[] = [
    [52.327972, 13.069778],
    [52.6803845, 13.7624957],
  ];

  const placePoint = useCallback(
    (position: LatLng) => {
      if (currentPlacementType === "job") {
        addJob({
          id: "Job" + jobs.length,
          earliestTime: 0,
          latestTime: 1000,
          serviceTime: 10,
          position: position,
        });
      } else {
        addDriver({
          id: "Driver" + drivers.length,
          capacity: 10,
          position: position,
          earliestTime: 0,
          latestTime: 1000,
          serviceTime: 50,
        });
      }
    },
    [currentPlacementType, drivers.length, jobs.length]
  );

  const calculate = useCallback(() => {
    queryClient.invalidateQueries(["getOptimalRoute"]);
  }, [jobs, drivers, queryClient]);

  return (
    <>
      <h1>Routing Engine :) </h1>
      <h3>
        Placement Type: {currentPlacementType}{" "}
        <button
          onClick={() => {
            setCurrentPlacementType((placementType) =>
              placementType == "job" ? "driver" : "job"
            );
          }}
        >
          Switch
        </button>
      </h3>
      <MapComponent
        bounds={bounds}
        jobPositions={jobs}
        driverPositions={drivers}
        clickHandler={placePoint}
        driverSetterBuilder={buildDriverSetter}
        jobSetterBuilder={buildJobSetter}
        geoJson={data?.geoJsons}
      />
      <button onClick={calculate}>Calculate</button>
      {isLoading || isFetching ? <p>Loading...</p> : ""}
      {data ? <DisplayDriverTodos routerInstructionResponse={data} /> : ""}
    </>
  );
}

export default App;
