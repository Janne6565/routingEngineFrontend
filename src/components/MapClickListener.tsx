import { LatLng } from "leaflet";
import { useMapEvents } from "react-leaflet";

interface Props {
  onclick: (pos: LatLng) => void;
}

function MapClickListener(props: Props) {
  const {} = props;
  useMapEvents({
    click: (e) => {
      props.onclick(e.latlng);
    },
  });

  return <></>;
}

export default MapClickListener;
