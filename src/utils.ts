import { ICalWeekday } from "ical-generator";
import { DateTime } from "luxon";

export type Bindings = {
    MY_BUCKET: R2Bucket;
};

export type Schedule = {
    section: string;
    instructor: string;
    meeting_pattern: string;
    start_date: string;
    end_date: string;   
    parsed_schedule: {
        days: ICalWeekday[];
        start_time: string;
        end_time: string;
        location: string;
    };
    waitlisted: boolean;
};

export function createDate(dateStr: string, timeStr: string) {
    // Validate input formats using regex
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (am|pm|AM|PM)$/;

    if (!dateRegex.test(dateStr)) {
        throw new Error("Date must be in format DD/MM/YYYY. It is currently: " + dateStr);
    }

    if (!timeRegex.test(timeStr)) {
        throw new Error("Time must be in format HH:MM am/pm. It is currently: " + timeStr);
    }

    // Split the date and time components
    const [month, day, year] = dateStr
        .split("/")
        .map((num) => parseInt(num, 10));
    const [time, period] = timeStr.toLowerCase().split(" ") as [
        string,
        "am" | "pm"
    ];
    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

    // Validate ranges
    if (month < 1 || month > 12)
        throw new Error("Month must be between 1 and 12. It is currently: " + month);
    if (day < 1 || day > 31) throw new Error("Day must be between 1 and 31. It is currently: " + day);
    if (hours < 1 || hours > 12)
        throw new Error("Hours must be between 1 and 12. It is currently: " + hours);
    if (minutes < 0 || minutes > 59)
        throw new Error("Minutes must be between 0 and 59. It is currently: " + minutes);

    // Convert to 24-hour format
    let hour24 = hours;
    if (period === "pm" && hours !== 12) {
        hour24 = hours + 12;
    } else if (period === "am" && hours === 12) {
        hour24 = 0;
    }

    // Create DateTime object with New York timezone
    const dt = DateTime.fromObject({
        year,
        month,
        day,
        hour: hour24,
        minute: minutes
    }, { zone: 'America/New_York' });

    // Validate the date is real
    if (!dt.isValid) {
        throw new Error(`Invalid date: ${dt.invalidReason}. Input was: ${dateStr}`);
    }

    // Convert to JS Date for compatibility with ical-generator
    return dt;
}
