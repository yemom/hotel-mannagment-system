import React, { useEffect, useMemo, useState } from 'react';

/**
 * ReservationDateTimePicker
 * ---------------------------------------------------------------------------
 * Shared date + time control used by every client-side reservation page
 * (rooms, restaurant tables and spa rituals).
 *
 *  - `CalendarGrid` : month calendar with past-date protection.
 *  - `AnalogClock`  : clickable analog clock face for choosing the time.
 *  - `ReservationDateTimePicker` : the combined, drop-in control.
 *
 * Implemented with plain React + SVG so no new dependency is introduced.
 */

/* ───────────────────────────── helpers ───────────────────────────── */

const toIso = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};

export const todayIso = () => toIso(new Date());

const parseIso = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Nearest 15-minute increment for a raw minutes-of-day value. */
const snapToSlot = (minutes, step = 15) => {
  const snapped = Math.round(minutes / step) * step;
  return ((snapped % 1440) + 1440) % 1440;
};

const toHHmm = (minutes) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const to12h = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}`;
};

/* ───────────────────────── calendar grid ───────────────────────── */

export const CalendarGrid = ({ value, onChange, minDate = todayIso(), idPrefix = 'cal' }) => {
  const initial = parseIso(value) || parseIso(minDate) || new Date();
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());

  // Keep the visible month in sync when an external value arrives.
  useEffect(() => {
    const parsed = parseIso(value);
    if (parsed) {
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    }
  }, [value]);

  const min = parseIso(minDate) || new Date();

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < startOffset; i += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(new Date(viewYear, viewMonth, day));
    }
    return list;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  const isDisabled = (day) => day === null || toIso(day) < toIso(min);

  return (
    <div className="rdt-calendar">
      <div className="rdt-calendar-head">
        <button
          type="button"
          className="rdt-nav-btn"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="rdt-calendar-title">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          className="rdt-nav-btn"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="rdt-calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="rdt-calendar-grid" role="grid" id={`${idPrefix}-grid`}>
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="rdt-day rdt-day-empty" />;
          }
          const iso = toIso(day);
          const disabled = isDisabled(day);
          const selected = value === iso;
          const isToday = iso === toIso(new Date());
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={selected}

              disabled={disabled}
              className={`rdt-day ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => !disabled && onChange(iso)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};


/* ───────────────────────── analog clock ───────────────────────── */

export const AnalogClock = ({ value, onChange, label = 'Select time', idPrefix = 'clock' }) => {
  const [minutes, setMinutes] = useState(() => {
    const [h, m] = String(value || '12:00').split(':').map(Number);
    return (((h || 12) * 60) + (m || 0)) % 1440;
  });

  useEffect(() => {
    const [h, m] = String(value || '').split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) setMinutes(((h * 60) + (m || 0)) % 1440);
  }, [value]);

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const hourAngle = ((hours % 12) + mins / 60) * 30;
  const minuteAngle = mins * 6;

  /** Translates a pointer position on the face into clock minutes. */
  const handleFacePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    // atan2 measured clockwise from 12 o'clock.
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    const raw = (angle / 360) * 1440;
    const snapped = snapToSlot(raw, 15);
    setMinutes(snapped);
    onChange(toHHmm(snapped));
  };

  const stepMinutes = (delta) => {
    const next = snapToSlot(minutes + delta, 15);
    setMinutes(next);
    onChange(toHHmm(next));
  };

  return (
    <div className="rdt-clock-wrap" id={`${idPrefix}-wrap`}>
      <div className="rdt-clock-display">
        <span className="rdt-clock-value">{to12h(toHHmm(minutes))}</span>
        <span className="rdt-clock-label">{label}</span>
      </div>

      <div
        className="rdt-clock-face"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={to12h(toHHmm(minutes))}
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={minutes}
        onPointerDown={handleFacePointer}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            stepMinutes(15);
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            stepMinutes(-15);
          }
        }}
      >
        <svg viewBox="0 0 200 200" className="rdt-clock-svg">
          <circle cx="100" cy="100" r="94" className="rdt-clock-ring" />
          <circle cx="100" cy="100" r="84" className="rdt-clock-inner" />

          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 100 + Math.sin(angle) * 74;
            const y1 = 100 - Math.cos(angle) * 74;
            const x2 = 100 + Math.sin(angle) * 82;
            const y2 = 100 - Math.cos(angle) * 82;
            const tx = 100 + Math.sin(angle) * 63;
            const ty = 100 - Math.cos(angle) * 63;
            const display = i === 0 ? 12 : i;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="rdt-tick" />
                <text x={tx} y={ty + 4} className="rdt-tick-label" textAnchor="middle">
                  {display}
                </text>
              </g>
            );
          })}

          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null;
            const angle = (i * 6 * Math.PI) / 180;
            const x1 = 100 + Math.sin(angle) * 78;
            const y1 = 100 - Math.cos(angle) * 78;
            const x2 = 100 + Math.sin(angle) * 82;
            const y2 = 100 - Math.cos(angle) * 82;
            return <line key={`m-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className="rdt-tick-minor" />;
          })}

          <line
            x1="100"
            y1="100"
            x2="100"
            y2="52"
            className="rdt-hand rdt-hand-hour"
            transform={`rotate(${hourAngle} 100 100)`}
          />
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="32"
            className="rdt-hand rdt-hand-minute"
            transform={`rotate(${minuteAngle} 100 100)`}
          />
          <circle cx="100" cy="100" r="6" className="rdt-clock-pin" />
        </svg>
      </div>

      <div className="rdt-clock-steppers">
        <button type="button" className="rdt-step-btn" onClick={() => stepMinutes(-15)}>
          <span className="material-symbols-outlined">remove</span>
          <span>15 min</span>
        </button>
        <button type="button" className="rdt-step-btn" onClick={() => stepMinutes(15)}>
          <span className="material-symbols-outlined">add</span>
          <span>15 min</span>
        </button>
      </div>
    </div>
  );
};


/* ───────────────────── combined date + time control ───────────────────── */

const ReservationDateTimePicker = ({
  date,
  onDateChange,
  time,
  onTimeChange,
  dateLabel = 'Select date',
  timeLabel = 'Select time',
  minDate = todayIso(),
  timeSlots = [],
  showClock = true,
  showCalendar = true,
  idPrefix = 'rdt',
}) => (
  <div className="rdt-picker">
    {showCalendar && (
      <div className="rdt-picker-col">
        <span className="rdt-col-label">
          <span className="material-symbols-outlined">calendar_month</span>
          {dateLabel}
        </span>
        <CalendarGrid
          value={date}
          onChange={onDateChange}
          minDate={minDate}
          idPrefix={`${idPrefix}-cal`}
        />
      </div>
    )}

    {showClock && (
      <div className="rdt-picker-col">
        <span className="rdt-col-label">
          <span className="material-symbols-outlined">schedule</span>
          {timeLabel}
        </span>
        <AnalogClock value={time} onChange={onTimeChange} label={timeLabel} idPrefix={`${idPrefix}-clk`} />

        {timeSlots.length > 0 && (
          <div className="rdt-slot-chips">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`rdt-slot-chip ${time === slot ? 'active' : ''}`}
                onClick={() => onTimeChange(slot)}
              >
                {to12h(slot)}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

export default ReservationDateTimePicker;

