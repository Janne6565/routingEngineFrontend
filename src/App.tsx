import { LatLng, LatLngExpression, LatLngTuple } from "leaflet";
import { components, operations } from "./api/routingEngine/schema";
import DisplayDriverTodos from "./components/DisplayDriverTodos";
import MapComponent from "./components/MapComponent";
import useApi, { RouteInstructionResponse } from "./hooks/useApi";
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type GetRouteRequest = operations["route"]["parameters"]["query"];
type GetOptimalRouteInstructionsRequest =
  operations["vehicleRoutingProblemSolver"]["parameters"]["query"];
const Coord = (lng: number, lat: number) => {
  return { lat: lat, lng: lng };
};

export type JobDto = components["schemas"]["JobDto"];
export type VehicleDto = components["schemas"]["VehicleDto"];

function App() {
  const baseUrl = "http://localhost:8080";
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [drivers, setDrivers] = useState<VehicleDto[]>([]);
  const [currentPlacementType, setCurrentPlacementType] = useState<
    "job" | "driver"
  >("job");

  const setDriver = (index: number, driver: VehicleDto) => {
    setDrivers((drivers) => {
      drivers[index] = driver;
      return drivers;
    });
  }

  const addDriver = (driver: VehicleDto) => {
    setDrivers((drivers) => [...drivers, driver]);
  }

  const setJob = (index: number, job: JobDto) => {
    setJobs((jobs) => {
      jobs[index] = job;
      return jobs;
    });
  }

  const addJob = (job: JobDto) => {
    setJobs((jobs) => [...jobs, job]);
  }

  const buildJobSetter = (index: number) => {
    return (job: JobDto) => setJob(index, job);
  }
  
  const buildDriverSetter = (index: number) => {
    return (driver: VehicleDto) => setDriver(index, driver);
  }

  const buildRequestData = (
    driverPositions: VehicleDto[],
    jobPositions: JobDto[]
  ): components["schemas"]["FleetInstructionsRequest"] => {
    return {
      jobs: jobPositions,
      vehicles: driverPositions,
    };
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["getOptimalRoute"],
    queryFn: async () => {
      const response = await fetch(baseUrl + "/fleetInstructions", {
        method: "POST",
        body: JSON.stringify(buildRequestData(drivers, jobs)),
        headers: {
          "Content-Type": "application/JSON",
        },
      });
      return (await response.json()) as RouteInstructionResponse;
    },
  });

  const bounds: LatLngTuple[] = [
    [52.327972, 13.069778],
    [52.6803845, 13.7624957],
  ];

  const placePoint = useCallback(
    (position: LatLng) => {
      if (currentPlacementType === "job") {
        setJobs((jobs) => [
          ...jobs,
          {
            id: "Job" + jobs.length,
            earliestTime: 0,
            latestTime: 1000,
            serviceTime: 10,
            position: position,
          },
        ]);
      } else {
        setDrivers((drivers) => [
          ...drivers,
          {
            id: "Driver" + drivers.length,
            capacity: 10,
            position: position,
            earliestTime: 0,
            latestTime: 1000,
            serviceTime: 50,
          },
        ]);
      }
    },
    [currentPlacementType]
  );

  const calculate = useCallback(() => {
    queryClient.invalidateQueries(["getOptimalRoute"]);
  }, [jobs, drivers]);

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
      />
      <button onClick={calculate}>Calculate</button>
      {isLoading || isFetching ? <p>Loading...</p> : ""}
      {data ? <DisplayDriverTodos routerInstructionResponse={data} /> : ""}
    </>
  );
}

export default App;
