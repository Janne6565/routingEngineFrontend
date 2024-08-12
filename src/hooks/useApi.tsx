import { useQuery } from "@tanstack/react-query";
import { paths, operations, components } from "../api/routingEngine/schema";

const convertCoordinateToString = (
  coord: components["schemas"]["Coordinate"]
) => coord.lat + "," + coord.lng;

export type RouteInstructionResponse = operations["vehicleRoutingProblemSolver"]["responses"]["200"]["content"]["*/*"]

const useApi = (baseUrl: string) => {
  const getRoute = (data: operations["route"]["parameters"]["query"]) =>
    useQuery({
      queryKey: ["getRoute"],
      queryFn: async () => {
        const urlSearchParams = new URLSearchParams({
          from: convertCoordinateToString(data.from),
          to: convertCoordinateToString(data.to),
        });
        const response = await fetch(
          baseUrl + "/route?" + urlSearchParams.toString(),
          {
            method: "GET",
          }
        );
        return await response.json();
      },
    });

  const getOptimalRouteInstructions = (
    data: operations["vehicleRoutingProblemSolver"]["parameters"]["query"]
  ) =>
    useQuery({
      queryKey: ["getOptimalRoute"],
      queryFn: async () => {
        const response = await fetch(baseUrl + "/fleetInstructions", {
          method: "POST",
          body: JSON.stringify(data.fleetInstructionsRequest),
          headers: {
            'Content-Type': 'application/JSON'
          }
        });
        return await response.json() as RouteInstructionResponse;
      },
    });

    return {
      getOptimalRouteInstructions,
      getRoute
    }
};

export default useApi;
