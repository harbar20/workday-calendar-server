import { Hono } from "hono";
import ical, { ICalEventRepeatingFreq, ICalWeekday } from "ical-generator";

type Bindings = {
    MY_BUCKET: R2Bucket;
};

type Schedule = {
    section: string;
    instructor: string;
    meeting_pattern: string;
    parsed_schedule: {
        days: ICalWeekday[];
        start_time: string;
        end_time: string;
        location: string;
    };
    waitlisted: boolean;
}[];

const app = new Hono<{ Bindings: Bindings }>();

app.post("/:user_id", async (c) => {
    const data = await c.req.json<Schedule>();
    const user_id = c.req.param("user_id");

    const eightWeeks = 8 * 7 * 24 * 60 * 60 * 1000;

    const cal = ical();
    for (const course of data) {
        const todayString = new Date().toISOString().split("T")[0];
        const startDate = `${todayString}T${course.parsed_schedule.start_time}`;
        const endDate = `${todayString}T${course.parsed_schedule.end_time}`;

        cal.createEvent({
            start: new Date(startDate),
            end: new Date(endDate),
            summary: `${course.section}`,
            location: course.parsed_schedule.location,
            description: `Course: ${course.section}\n\nInstructor: ${course.instructor}\n\nMeeting Pattern: ${course.meeting_pattern}`,
            repeating: {
                freq: ICalEventRepeatingFreq.WEEKLY,
                byDay: course.parsed_schedule.days,
                until: new Date(Date.now() + eightWeeks),
            },
        });
    }

    const filename = `${user_id}.ics`;

    c.header("Content-Type", "text/calendar");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    // CORS
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // Write to bucket
    await c.env.MY_BUCKET.put(filename, cal.toString());

    return c.body(cal.toString());
});

app.get("/:user_id", async (c) => {
    const user_id = c.req.param("user_id");
    const result = await c.env.MY_BUCKET.get(`${user_id}.ics`);
    if (!result) {
        return c.json({ error: "File not found" }, 404);
    }
    return c.body(result.body);
});

export default app;
