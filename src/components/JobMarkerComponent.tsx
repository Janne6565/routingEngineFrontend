import React from "react";
import { JobDto, VehicleDto } from "../App";
import { Marker, Popup } from "react-leaflet";
import homeImage from "../assets/Home icon.png";
import L from "leaflet";

interface Props {
  job: JobDto;
  setter: (job: JobDto) => void;
}

function JobMarkerComponent(props: Props) {
  const {} = props;

  const iconCar = new L.Icon({
    iconUrl: homeImage,
    iconRetinaUrl: homeImage,
    iconSize: [25, 25],
    className: "leaflet-div-icon",
  });

  return (
    <>
      <Marker
        position={props.job.position ?? { lat: 0, lng: 0 }}
        key={props.job.position?.toString()}
        icon={iconCar}
      >
        <Popup>
          <div>
            <h3>Job</h3>
            <p>Driver ID: {props.job.id}</p>
            <p>
              Location: {props.job.position.lat}, {props.job.position.lng}
            </p>
            <p>
                Service Time: {props.job.serviceTime}
            </p>
            <p>
                Time Window: {props.job.earliestTime} - {props.job.latestTime}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default JobMarkerComponent;
