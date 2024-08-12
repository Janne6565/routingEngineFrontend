import React from "react";
import { VehicleDto } from "../App";
import { Marker, Popup } from "react-leaflet";
import carImage from "../assets/Car icon.svg";
import L from "leaflet";

interface Props {
  driver: VehicleDto;
  setter: (driver: VehicleDto) => void;
}

function DriverMarkerComponent(props: Props) {
  const {} = props;

  const iconCar = new L.Icon({
    iconUrl: carImage,
    iconRetinaUrl: carImage,
    iconSize: [25, 25],
    className: "leaflet-div-icon",
  });

  return (
    <>
      <Marker
        position={props.driver.position ?? { lat: 0, lng: 0 }}
        key={props.driver.position?.toString()}
        icon={iconCar}
      >
        <Popup>
          <div>
            <h3>Driver</h3>
            <p>Driver ID: {props.driver.id}</p>
            <p>
              Location: {props.driver.position.lat}, {props.driver.position.lng}
            </p>
            <p>Service Time: {props.driver.serviceTime}</p>
            <p>
              Time Window: {props.driver.earliestTime} -{" "}
              {props.driver.latestTime}
            </p>
            <p>
              Capacity: {props.driver.capacity}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default DriverMarkerComponent;
