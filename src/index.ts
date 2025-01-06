import { Hono } from "hono";
import ical, { ICalEventRepeatingFreq } from "ical-generator";
import { Bindings, Schedule, createDate } from "./utils";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/:user_id", async (c) => {
    const data = await c.req.json<Schedule[]>();
    const user_id = c.req.param("user_id");

    const cal = ical();
    for (const course of data) {
        // First date and start time of class
        const startDate = createDate(
            course.start_date,
            course.parsed_schedule.start_time
        );
        // First date and end time of class
        const endDate = createDate(
            course.start_date,
            course.parsed_schedule.end_time
        );
        // Last date and end time of class
        const lastDate = createDate(
            course.end_date,
            course.parsed_schedule.end_time
        );

        cal.createEvent({
            start: startDate,
            end: endDate,
            summary: `${course.section}`,
            location: course.parsed_schedule.location,
            description: `Course: ${course.section}\n\nInstructor: ${course.instructor}\n\nMeeting Pattern: ${course.meeting_pattern}`,
            repeating: {
                freq: ICalEventRepeatingFreq.WEEKLY,
                byDay: course.parsed_schedule.days,
                until: lastDate,
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
