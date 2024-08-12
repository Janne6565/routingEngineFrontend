import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { LatLng, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, SVGOverlay, TileLayer } from "react-leaflet";
import { GeoJSON } from "react-leaflet/GeoJSON";
import { JobDto, VehicleDto } from "../App";
import DriverMarkerComponent from "./DriverMarkerComponent";
import JobMarkerComponent from "./JobMarkerComponent";
import MapClickListener from "./MapClickListener";

type Props = {
  driverPositions: VehicleDto[];
  jobPositions: JobDto[];
  clickHandler: (position: LatLng) => void;
  bounds: LatLngTuple[];
  driverSetterBuilder: (index: number) => (driver: VehicleDto) => void;
  jobSetterBuilder: (index: number) => (job: JobDto) => void;
  geoJson: FeatureCollection<Geometry, GeoJsonProperties>[] | undefined;
};

function MapComponent(props: Props) {
  return (
    <>
      <MapContainer
        center={[52.505284, 13.418273]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "60vh", width: "60vw" }}
      >
        {props.geoJson
          ? props.geoJson.map((geoJson, index) => (
              <GeoJSON data={geoJson} key={index} />
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
            fill="blue"
            opacity={0.1}
          />
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
        </SVGOverlay>
        <MapClickListener onclick={props.clickHandler} />
      </MapContainer>
    </>
  );
}

export default MapComponent;
