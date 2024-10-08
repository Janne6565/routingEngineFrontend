import { components } from "../api/routingEngine/schema";
import { RouteInstructionResponse } from "../hooks/useApi";

interface Props {
  routerInstructionResponse: RouteInstructionResponse;
}

const minutesToDate = (minutes: number) => {
  const date = new Date(0);
  date.setMinutes(minutes);
  return date;
};

function DisplayDriverTodos(props: Props) {
  const { routerInstructionResponse } = props;

  const routes = routerInstructionResponse.routes;
  const columns = [
    {
      type: "string",
      label: "Task ID",
    },
    {
      type: "string",
      label: "Task Name",
    },
    {
      type: "date",
      label: "Start",
    },
    {
      type: "date",
      label: "End",
    },
    {
      type: "number",
      label: "Duration",
    },
    {
      type: "number",
      label: "Percent Complete",
    },
    {
      type: "string",
      label: "Dependencys",
    },
  ];
  const convertRouteToRows = (route: components["schemas"]["VehicleRoute"]) =>
    route.activities?.map((activity) => [
      "activity" + activity.index,
      route.tourActivities?.jobs
        ?.filter((job) => job.index == activity.index)
        .at(0)?.name,
      minutesToDate(activity.arrTime ?? 0),
      minutesToDate(activity.endTime ?? 0),
      activity.operationTime,
      100,
      "",
    ]) ?? [];
  const convertTime = (time: number | undefined) => {
    return time ? Math.round(time) + "min" : "0min";
  };

  return routes?.map((route, index) => (
    <div key={index}>
      <h1>{route.vehicle?.id ?? ""}</h1>
      <div className="route">
        {"HomeLocation " + convertTime(route.start?.arrTime) + " -> "}
        {route.activities?.map(
          (activity) =>
            convertTime(activity.arrTime) +
            " " +
            activity.job.name +
            " " +
            convertTime(activity.endTime) +
            " -> "
        )}
        {"HomeLocation"} {convertTime(route.end?.arrTime)}
      </div>
    </div>
  ));
}

export default DisplayDriverTodos;
