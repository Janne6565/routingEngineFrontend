import polyline from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import { FeatureCollection } from "geojson";
import { components, operations } from "../api/routingEngine/schema";
import { JobDto, Route, VehicleDto } from "../App";

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
export type GenericRouteResponse = (components["schemas"]["CoordinateDto"] & {
  driver_id: string;
})[][];

export type GeoJsonWithId = GeoJSON.FeatureCollection & { id: string | undefined };

const locationToPosition = (
  location: components["schemas"]["Location"] | undefined
): components["schemas"]["CoordinateDto"] =>
  location
    ? {
        lat: location.coordinate?.x ?? 0,
        lng: location.coordinate?.y ?? 0,
      }
    : { lat: 0, lng: 0 };

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
  const useRouteLoadingFromUuidAsync = async (id: string) => {
    const response = await fetch(baseUrl + "/fleetInstructions/" + id, {
      method: "GET",
      headers: {
        "Content-Type": "application/JSON",
      },
    });

    const res = (await response.json()) as RouteInstructionResponse;
    const routes: Route[] = [];
    const drivers: VehicleDto[] = [];
    const jobs: JobDto[] = [];

    for (let route of res.routes!) {
      drivers.push({
        position: locationToPosition(route.vehicle?.startLocation),
        capacity: undefined,
        earliestTime: route.vehicle?.earliestDeparture,
        id: route.vehicle?.id,
        latestTime: route.vehicle?.latestArrival,
      });
      let lastPosition = locationToPosition(route.start?.location);
      const returnedRoute: Route = {
        geoData: [],
        distance: 0,
        drivingTime: 0,
        driverId: route.vehicle?.id!,
      };

      for (let activity of route.activities!) {
        const routeResponse = await fetchGeoJson(
          lastPosition,
          locationToPosition(activity.location)
        );
        const geoJson = routeResponse.geoJson as GeoJsonWithId;
        geoJson.id = route.vehicle?.id! + " job" + activity.index!;
        returnedRoute.geoData.push(geoJson);
        returnedRoute.distance += routeResponse.distance;
        returnedRoute.drivingTime += routeResponse.duration;

        lastPosition = locationToPosition(activity.location);

        jobs.push({
          position: locationToPosition(activity.location),
          earliestTime: activity.theoreticalEarliestOperationStartTime,
          latestTime: activity.theoreticalLatestOperationStartTime,
          id: activity.name,
          serviceTime: activity.operationTime,
        });
      }
      const routeToEndResponse = await fetchGeoJson(
        lastPosition,
        locationToPosition(route.end?.location)
      );
      const geoJson = routeToEndResponse.geoJson as GeoJsonWithId;
      geoJson.id = route.vehicle?.id! + " returnHome";
      returnedRoute.distance += routeToEndResponse.distance;
      returnedRoute.drivingTime += routeToEndResponse.duration;
      returnedRoute.geoData.push(geoJson);
      routes.push(returnedRoute);
    }

    return {
      drivers,
      jobs,
      routes,
    };
  };

  const useGenericRouteLoader = async (url: string) => {
    const response = await fetch(url);
    const res = (await response.json()) as GenericRouteResponse;
    const routes: Route[] = [];

    for (let route of res) {
      let lastPosition = route[0];
      const geoData = [];
      let distance = 0;
      let drivingTime = 0;
      for (let position of route.slice(1)) {
        const {
          geoJson,
          distance: routeDistance,
          duration: routeDuration,
        } = await fetchGeoJson(lastPosition, position);
        const geoJsonWithId = geoJson as GeoJsonWithId;
        geoJsonWithId.id = position.driver_id + " " + position.lat + " " + position.lng;
        distance += routeDistance;
        drivingTime += routeDuration;
        geoData.push(geoJsonWithId);
        lastPosition = position;
      }

      routes.push({
        geoData: geoData,
        distance: distance,
        drivingTime: drivingTime,
        driverId: route[0].driver_id,
      });
    }

    return { routes };
  };

  const fetchGeoJson = async (
    from: components["schemas"]["CoordinateDto"],
    to: components["schemas"]["CoordinateDto"]
  ) => {
    const urlSearchParams = new URLSearchParams({
      from: convertCoordinateDtoToString(from),
      to: convertCoordinateDtoToString(to),
    });
    const response = await fetch(
      baseUrl + "/route?" + urlSearchParams.toString()
    );
    const res = (await response.json()) as RouteResponse;
    return {
      geoJson: loadGeoJsonFromResponse(res.paths![0]),
      distance: res.paths![0].distance!,
      duration: res.paths![0].time! / 1000,
    };
  };

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
        const res = (await response.json()) as RouteResponse;
        return loadGeoJsonFromResponse(res.paths![0]);
      },
    });

  const useRouteLoading = (id: string) =>
    useQuery({
      queryKey: ["loadOptimalRoute"],
      queryFn: () => useRouteLoadingFromUuidAsync(id),
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
          const lastPosition = route.end?.location?.coordinate;
          const request = await fetch(
            baseUrl +
              "/route?" +
              new URLSearchParams({
                from: convertCoordinateToString(currentPosition!),
                to: convertCoordinateToString(lastPosition!),
              }),
            {
              method: "GET",
            }
          );

          const res = (await request.json()) as RouteResponse;
          const geoJson = loadGeoJsonFromResponse(res.paths![0]);
          geoJsons.push(geoJson);
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
    useRoute,
    useRouteLoading,
    useRouteLoadingFromUuidAsync,
    useGenericRouteLoader,
  };
};

export default useApi;
