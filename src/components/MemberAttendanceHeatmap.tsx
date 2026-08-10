import React, { useState } from "react";
import { AttendanceRecord } from "../types";
import { Calendar, Flame, CheckCircle, Award, Clock } from "lucide-react";

interface MemberAttendanceHeatmapProps {
  memberId: string;
  attendance: AttendanceRecord[];
  memberName?: string;
}

export const MemberAttendanceHeatmap: React.FC<MemberAttendanceHeatmapProps> = ({
  memberId,
  attendance,
  memberName
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    dayName: string;
    services: string[];
    count: number;
  } | null>(null);

  // Filter attendance for this specific member
  const memberRecords = attendance.filter((a) => a.memberId === memberId);

  // Create a map of YYYY-MM-DD -> list of service names
  const attendanceMap: Record<string, string[]> = {};
  memberRecords.forEach((rec) => {
    // Normalise date
    let dateKey = rec.date;
    if (!attendanceMap[dateKey]) {
      attendanceMap[dateKey] = [];
    }
    if (!attendanceMap[dateKey].includes(rec.serviceName)) {
      attendanceMap[dateKey].push(rec.serviceName);
    }
  });

  // Generate 52 weeks (364 days) leading up to today (2026-07-28)
  const today = new Date("2026-07-28");
  const weeksCount = 26; // 26 weeks (~6 months) for clean responsive grid layout
  const days: Array<{
    dateObj: Date;
    dateStr: string;
    dayName: string;
    monthName: string;
    dayOfWeek: number;
    weekIndex: number;
    services: string[];
    count: number;
  }> = [];

  // Start from Sunday 26 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeksCount * 7 - 1));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < weeksCount * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const weekIndex = Math.floor(i / 7);

    const services = attendanceMap[dateStr] || [];

    days.push({
      dateObj: d,
      dateStr,
      dayName: dayNames[dayOfWeek],
      monthName: monthNames[d.getMonth()],
      dayOfWeek,
      weekIndex,
      services,
      count: services.length
    });
  }

  // Calculate statistics
  const totalCheckIns = memberRecords.length;
  
  // Calculate Sunday attendance rate over the 26 weeks
  const sundayDays = days.filter((d) => d.dayOfWeek === 0);
  const sundaysAttended = sundayDays.filter((d) => d.count > 0).length;
  const sundayRate = sundayDays.length > 0 ? Math.round((sundaysAttended / sundayDays.length) * 100) : 0;

  // Calculate current streak of Sundays attended
  let streak = 0;
  const reversedSundays = [...sundayDays].reverse();
  for (const sDay of reversedSundays) {
    if (sDay.count > 0) {
      streak++;
    } else if (sDay.dateObj <= today) {
      break;
    }
  }

  const mostRecentRecord = memberRecords[0] || null;

  return (
    <div className="bg-[#0A192F] text-white p-5 md:p-6 rounded-2xl border border-[#0F2342]/50 shadow-2xl space-y-5">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#0F2342]/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-[11px] uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            SANCTUARY ATTENDANCE HEATMAP &amp; FAITH METRICS
          </div>
          <h3 className="text-lg md:text-xl font-black uppercase text-white mt-0.5">
            {memberName ? `${memberName}'s Service Activity` : "Attendance Activity Log"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="bg-[#0F2342]/80 text-sky-200 border border-[#1e3a8a]/60 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            {totalCheckIns} Total Check-Ins
          </span>
          <span className="bg-amber-500/20 text-orange-300 border border-amber-400/40 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            {streak} Weeks Streak
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            {sundayRate}% Sunday Attendance
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <span>Past 26 Weeks Activity (182 Days)</span>
          {mostRecentRecord && (
            <span className="text-orange-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Latest: {mostRecentRecord.serviceName} ({mostRecentRecord.date})
            </span>
          )}
        </div>

        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="inline-block min-w-[620px] w-full">
            {/* Days grid layout: 7 rows (Sun..Sat) */}
            <div className="grid grid-cols-[30px_1fr] gap-2 items-center">
              {/* Day Labels Column */}
              <div className="grid grid-rows-7 gap-1 text-[10px] font-mono text-sky-300 font-bold">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Heatmap Squares Grid (26 columns) */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {days.map((day, idx) => {
                  let colorClass = "bg-[#0A192F]/40 border border-[#0F2342]/30 hover:border-sky-400";
                  if (day.count === 1) {
                    colorClass = "bg-emerald-500 border border-emerald-400 text-[#0A192F] font-bold shadow-xs";
                  } else if (day.count >= 2) {
                    colorClass = "bg-amber-500 border border-amber-300 text-[#0A192F] font-black shadow-md animate-pulse";
                  }

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() =>
                        setHoveredCell({
                          dateStr: day.dateStr,
                          dayName: day.dayName,
                          services: day.services,
                          count: day.count
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-4.5 w-full rounded-sm transition-all transform hover:scale-125 cursor-pointer ${colorClass}`}
                      title={`${day.dayName}, ${day.dateStr}: ${
                        day.count > 0 ? day.services.join(", ") : "No Attendance Record"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip Banner on Hover */}
        <div className="min-h-[36px] bg-[#0A192F]/60 border border-[#17325B]/50 rounded-xl p-2.5 px-4 text-xs font-mono flex items-center justify-between text-sky-200">
          {hoveredCell ? (
            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-400 uppercase">
                {hoveredCell.dayName}, {hoveredCell.dateStr}
              </span>
              <span>•</span>
              {hoveredCell.count > 0 ? (
                <span className="text-emerald-300 font-bold">
                  ✓ Attended: {hoveredCell.services.join(" & ")}
                </span>
              ) : (
                <span className="text-neutral-400">No service check-in logged on this day</span>
              )}
            </div>
          ) : (
            <span className="text-neutral-400 text-[11px]">
              💡 Hover or tap any box above to inspect specific service check-in logs.
            </span>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-2xs bg-[#0A192F]/60 border border-[#17325B]" />
              <span>Absent</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-2xs bg-emerald-500" />
              <span>Sunday Worship</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-2xs bg-amber-500" />
              <span>Special / Night of Fire</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
