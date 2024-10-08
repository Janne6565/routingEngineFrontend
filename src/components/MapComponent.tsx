import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { geoJSON, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, SVGOverlay, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet/GeoJSON";
import { JobDto, VehicleDto } from "../App";
import DriverMarkerComponent from "./DriverMarkerComponent";
import JobMarkerComponent from "./JobMarkerComponent";
import MarkerClusterGroup from "react-leaflet-cluster";
import { GeoJsonWithId } from "../hooks/useApi";

type Props = {
  driverPositions: VehicleDto[];
  jobPositions: JobDto[];
  bounds: LatLngTuple[];
  driverSetterBuilder: (index: number) => (driver: VehicleDto) => void;
  jobSetterBuilder: (index: number) => (job: JobDto) => void;
  geoJson: GeoJsonWithId[] | undefined;
};

function MapComponent(props: Props) {
  return (
    <>
      <MapContainer
        center={[52.505284, 11.418273]}
        zoom={7}
        scrollWheelZoom={true}
        style={{ height: "80vh", width: "70vw" }}
      >
        {props.geoJson
          ? props.geoJson.map((geoJson, index) => (
              <GeoJSON data={geoJson} key={geoJson.id}/>
            ))
          : ""}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SVGOverlay bounds={props.bounds}>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="black"
            strokeOpacity={0.5}
            strokeWidth={2}
          />
          <MarkerClusterGroup chunkedLoading>
            {props.driverPositions.map((driver: VehicleDto) => (
              <DriverMarkerComponent
                driver={driver}
                setter={props.driverSetterBuilder(
                  props.driverPositions.indexOf(driver)
                )}
                key={driver.id}
              />
            ))}
            {props.jobPositions.map((job: JobDto) => (
              <JobMarkerComponent
                job={job}
                setter={props.jobSetterBuilder(props.jobPositions.indexOf(job))}
                key={job.id}
              />
            ))}
          </MarkerClusterGroup>
        </SVGOverlay>
      </MapContainer>
    </>
  );
}

export default MapComponent;
