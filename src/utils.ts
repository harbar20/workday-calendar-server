import { ICalWeekday } from "ical-generator";

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

export function createDate(dateStr: string, timeStr: string): Date {
    // Validate input formats using regex
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (am|pm|AM|PM)$/;

    if (!dateRegex.test(dateStr)) {
        throw new Error("Date must be in format DD/MM/YYYY");
    }

    if (!timeRegex.test(timeStr)) {
        throw new Error("Time must be in format HH:MM am/pm");
    }

    // Split the date and time components
    const [day, month, year] = dateStr
        .split("/")
        .map((num) => parseInt(num, 10));
    const [time, period] = timeStr.toLowerCase().split(" ") as [
        string,
        "am" | "pm"
    ];
    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

    // Validate ranges
    if (month < 1 || month > 12)
        throw new Error("Month must be between 1 and 12");
    if (day < 1 || day > 31) throw new Error("Day must be between 1 and 31");
    if (hours < 1 || hours > 12)
        throw new Error("Hours must be between 1 and 12");
    if (minutes < 0 || minutes > 59)
        throw new Error("Minutes must be between 0 and 59");

    // Convert to 24-hour format
    let hour24 = hours;
    if (period === "pm" && hours !== 12) {
        hour24 = hours + 12;
    } else if (period === "am" && hours === 12) {
        hour24 = 0;
    }

    // Create date object (month is 0-based in JavaScript)
    const date = new Date(year, month - 1, day, hour24, minutes);

    // Validate the date is real (handles edge cases like 31/4/2024 which isn't a real date)
    if (date.getMonth() !== month - 1) {
        throw new Error("Invalid date for the given month");
    }

    return date;
}
