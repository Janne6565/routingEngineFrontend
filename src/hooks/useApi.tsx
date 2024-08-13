import polyline from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import { FeatureCollection } from "geojson";
import { components, operations } from "../api/routingEngine/schema";

const convertCoordinateDtoToString = (
  coord: components["schemas"]["CoordinateDto"] | undefined
) => (coord ? coord.lat + "," + coord.lng : "0,0");

const convertCoordinateToString = (
  coord: components["schemas"]["Coordinate"]
) => coord.x + "," + coord.y;

export type RouteInstructionResponse =
  operations["vehicleRoutingProblemSolver"]["responses"]["200"]["content"]["*/*"];
export type RouteResponse =
  operations["route"]["responses"]["200"]["content"]["*/*"];

const loadGeoJsonFromResponse = (
  path: components["schemas"]["Path"]
): GeoJSON.FeatureCollection => {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: polyline
            .decode(path.points!)
            .map((coord) => [coord[1], coord[0]]),
        },
      },
    ],
  };
};

const useApi = (baseUrl: string) => {
  const useRoute = (data: operations["route"]["parameters"]["query"]) =>
    useQuery({
      queryKey: ["getRoute"],
      queryFn: async () => {
        const urlSearchParams = new URLSearchParams({
          from: convertCoordinateDtoToString(data.from),
          to: convertCoordinateDtoToString(data.to),
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

  const useOptimalRouteInstruction = (
    data: operations["vehicleRoutingProblemSolver"]["requestBody"]["content"]["application/json"]
  ) =>
    useQuery({
      queryKey: ["getOptimalRoute"],
      queryFn: async () => {
        const response = await fetch(baseUrl + "/fleetInstructions", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/JSON",
          },
        });

        const res = (await response.json()) as RouteInstructionResponse;
        const geoJsons: FeatureCollection[] = [];
        for (const route of res.routes!) {
          let currentPosition = route.start?.location?.coordinate;
          for (const activity of route.activities!) {
            const nextPosition = activity.location?.coordinate;

            const routeRequest = await fetch(
              baseUrl +
                "/route?" +
                new URLSearchParams({
                  from: convertCoordinateToString(currentPosition!),
                  to: convertCoordinateToString(nextPosition!),
                }).toString(),
              {
                method: "GET",
              }
            );
            const res = (await routeRequest.json()) as RouteResponse;
            const geoJson = loadGeoJsonFromResponse(res.paths![0]);
            geoJsons.push(geoJson);
            currentPosition = nextPosition;
          }
        }

        return {
          ...res,
          geoJsons: geoJsons,
        };
      },
      enabled: false,
    });

  return {
    useOptimalRouteInstruction,
    getRoute: useRoute,
  };
};

export default useApi;
