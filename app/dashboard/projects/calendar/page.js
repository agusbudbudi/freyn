"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import LoadingState from "@/components/LoadingState";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";
import { Card, CardBody } from "@/components/ui/Card";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => dfStartOfWeek(date, { weekStartsOn: 1 }), // Monday start
  getDay,
  locales,
});

function hashToColor(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 70; // saturation %
  const l = 45; // lightness %
  return `hsl(${h} ${s}% ${l}%)`;
}

function getContrastColor(hsl) {
  // crude contrast by extracting the final L% from HSL string
  const match = /(\d+)\%\)?$/.exec(hsl.replaceAll(",", ""));
  const l = match ? parseInt(match[1], 10) : 45;
  return l > 55 ? "#111" : "#fff";
}

const eventInnerClasses = "flex items-center justify-between gap-1.5 w-full";
const eventTitleClasses =
  "font-semibold text-[11px] overflow-hidden text-ellipsis whitespace-nowrap";
const eventTimeClasses = "font-normal text-[11px] whitespace-nowrap ml-2";

// Custom event renderer to control label placement (title left, time right)
function EventItem({ event }) {
  try {
    const startStr = format(event.start, "HH:mm");
    const endStr = format(event.end, "HH:mm");
    return (
      <div className={eventInnerClasses}>
        <span className={eventTitleClasses}>{event.title}</span>
        <span className={eventTimeClasses}>
          {startStr} - {endStr}
        </span>
      </div>
    );
  } catch (e) {
    return <div className={eventInnerClasses}>{event.title}</div>;
  }
}

function MonthEvent({ event }) {
  return (
    <div className={eventInnerClasses}>
      <span className={eventTitleClasses}>{event.title}</span>
    </div>
  );
}

export default function ProjectsCalendarPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Control calendar navigation and view explicitly to ensure toolbar works
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {};
  }, []);

  const loadProjects = useCallback(async (opts = {}) => {
    const silent = opts?.silent === true;
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/projects", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data.projects || []);
      } else {
        console.error("Failed to fetch projects:", data.message);
      }
    } catch (e) {
      console.error("Failed to fetch projects for calendar", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useWorkspaceSwitchListener(() => loadProjects({ silent: false }));

  useEffect(() => {
    const evts = (projects || []).map((p) => {
      const start = new Date(p.createdAt);
      let end = new Date(p.deadline);

      // Ensure a valid range
      if (isNaN(end.getTime()) || end < start) {
        end = new Date(start);
      }

      // If deadline time appears to be midnight (likely date-only), extend to end of that day
      const isMidnight =
        end.getHours() === 0 &&
        end.getMinutes() === 0 &&
        end.getSeconds() === 0;
      if (isMidnight) {
        end = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
          23,
          59,
          59
        );
      }

      return {
        id: String(p._id || p.id),
        title: p.projectName || "Untitled Project",
        start,
        end,
        allDay: false, // use actual time range (createdAt → deadline time)
        resource: p,
      };
    });
    setEvents(evts);
  }, [projects]);

  const eventPropGetter = useMemo(() => {
    return (event) => {
      const key = String(event.resource?.id || event.resource?._id || event.id);
      const bg = hashToColor(key);
      const color = getContrastColor(bg);
      return {
        style: {
          backgroundColor: bg,
          color,
          borderColor: bg,
          borderRadius: "6px",
          padding: "2px 6px",
        },
        className: "cursor-pointer",
      };
    };
  }, []);

  const handleSelectEvent = (event) => {
    const projectId = event.resource?._id || event.resource?.id;
    if (!projectId) return;
    router.push(`/dashboard/projects/${projectId}/edit`);
  };

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <CardBody className="h-[85dvh]">
          {!loading && (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.MONTH}
              date={currentDate}
              view={currentView}
              onNavigate={(date, view) => {
                setCurrentDate(date);
                if (view) setCurrentView(view);
              }}
              onView={(view) => setCurrentView(view)}
              popup
              selectable={false}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              components={{ event: EventItem, month: { event: MonthEvent } }}
              messages={{
                next: ">",
                previous: "<",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
              }}
              showMultiDayTimes
              dayLayoutAlgorithm="no-overlap"
            />
          )}
          {loading && <LoadingState message="Loading calendar..." />}
        </CardBody>
      </Card>
    </div>
  );
}
