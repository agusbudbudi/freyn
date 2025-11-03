"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import LoadingState from "@/components/LoadingState";
import ProjectModal from "@/components/ProjectModal";

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

// Custom event renderer to control label placement (title left, time right)
function EventItem({ event }) {
  try {
    const startStr = format(event.start, "HH:mm");
    const endStr = format(event.end, "HH:mm");
    return (
      <div className="project-event-inner">
        <span className="project-event-title">{event.title}</span>
        <span className="project-event-time">
          {startStr} - {endStr}
        </span>
      </div>
    );
  } catch (e) {
    return <div className="project-event-inner">{event.title}</div>;
  }
}

function MonthEvent({ event }) {
  return (
    <div className="project-event-inner">
      <span className="project-event-title">{event.title}</span>
    </div>
  );
}

export default function ProjectsCalendarPage() {
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Control calendar navigation and view explicitly to ensure toolbar works
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const loadProjects = async (opts = {}) => {
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
  };

  useEffect(() => {
    loadProjects();
  }, []);

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
        className: "project-event",
      };
    };
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedProject(event.resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSaved = (updatedProject) => {
    // Biarkan ProjectModal yang mengelola animasi close-nya sendiri (handleStartClose memanggil onClose setelah ~220ms)
    // Jangan panggil handleCloseModal di sini untuk menghindari race condition dengan animasi internal modal.

    // Optimistic update agar event di calendar langsung ter-update
    if (updatedProject && (updatedProject._id || updatedProject.id)) {
      setProjects((prev) =>
        prev.map((p) =>
          String(p._id || p.id) ===
          String(updatedProject._id || updatedProject.id)
            ? updatedProject
            : p
        )
      );
    }

    // Refresh data dari server setelah animasi selesai supaya popup benar-benar tertutup sebelum fetch
    setTimeout(() => {
      loadProjects({ silent: true });
    }, 260);
  };

  return (
    <div className="content-body">
      <div className="content-card">
        {/* <div className="card-header">
          <h2 className="card-title">Projects Calendar</h2>
        </div> */}
        <div className="card-body" style={{ height: "85dvh" }}>
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
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleProjectSaved}
        editProject={selectedProject}
      />
    </div>
  );
}
