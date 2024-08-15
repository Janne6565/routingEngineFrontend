
const util = () => {
    const convertStringDateTimeToMinutes = (dateTimeString: string | number) => {
        if (typeof dateTimeString == "number") {
            return dateTimeString;
        }

        const splitted = dateTimeString.split(":");
        return parseInt(splitted[0]) * 60 + parseInt(splitted[1]);
    }

    return {
        convertStringDateTimeToMinutes
    }
}


export default util;