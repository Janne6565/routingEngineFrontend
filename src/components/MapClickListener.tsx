import { LatLng } from "leaflet";
import { useMapEvents } from "react-leaflet";

interface Props {
  onclick: (pos: LatLng) => void;
}

function MapClickListener(props: Props) {
  useMapEvents({
    click: (e) => {
      props.onclick(e.latlng);
    },
  });

  return <></>;
}

export default MapClickListener;
