import { useQueryClient } from "@tanstack/react-query";
import { LatLng, LatLngTuple } from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { components } from "./api/routingEngine/schema";
import DisplayDriverTodos from "./components/DisplayDriverTodos";
import MapComponent from "./components/MapComponent";
import useApi from "./hooks/useApi";

import "./style.css";
import { useImport } from "./hooks/useImport";
import useUtil from "./hooks/useUtil";

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
  const { convertStringDateTimeToMinutes } = useUtil();
  const [currentPlacementType, setCurrentPlacementType] = useState<
    "job" | "driver"
  >("job");
  const { data, isLoading, isFetching, refetch } = useOptimalRouteInstruction(
    buildRequestData(drivers, jobs)
  );
  const { useData } = useImport();

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

  useEffect(() => {
    const data = useData();
    type driverJsonDataType = (typeof data)[number];
    let counter = 0;
    const mappings = {
      position: (job: driverJsonDataType) => {
        return { lat: job.LATITUDE, lng: job.LONGITUDE };
      },
      earliestTime: (job: driverJsonDataType) =>
        convertStringDateTimeToMinutes(job.START_TIME),
      latestTime: (job: driverJsonDataType) =>
        convertStringDateTimeToMinutes(job.END_TIME),
      serviceTime: (job: driverJsonDataType) => job.DURATION,
      id: (job: driverJsonDataType) => "importedJob" + job.INDEX,
    };
    const constructJobDto = (job: driverJsonDataType) => {
      const buildingJobDto: JobDto = {};

      for (const key of Object.keys(mappings)) {
        buildingJobDto[key] = mappings[key](job);
      }
      return buildingJobDto;
    };

    data.forEach((driver) => {
      addJob(constructJobDto(driver));
    })

  }, []);

  const bounds: LatLngTuple[] = [
    [47.27101, 5.8630797],
    [60.4363296, 25.1965582],
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
    refetch();
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
