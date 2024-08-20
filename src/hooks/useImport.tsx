import { JobDto } from "../App";
import data from "../../driverData.json";

interface ImportedData {
  LATITUDE: number;
  LONGITUDE: number;
  DURATION: number;
  START_TIME: string;
  END_TIME: string;
}

export const useImport = () => {
  const useData = () => {
    const table = data.table;
    const rows = table.rows.map((row, index) => {
      const res = {
        LATITUDE: row.values[0].value,
        LONGITUDE: row.values[1].value,
        DURATION: row.values[2].value,
        START_TIME: row.values[3].value,
        END_TIME: row.values[4].value,
        INDEX: index
      };

      return res;
    });
    return rows.filter((row) => row.LATITUDE != 0 && row.LONGITUDE != 0);
  };
  return { useData };
};
