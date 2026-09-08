'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserMovieCalendarItem, UserMovieCalendar } from '@cinemo/shared';
import { getUserMovieCalendarRequest } from '@/lib/user-movie-api';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  token: string;
  onClose: () => void;
  onAdd?: (date: string) => void;
  onDelete?: (tmdbId: number) => void;
  onEdit?: (tmdbId: number, watchedAt: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getDay();
  const lastDate = new Date(Date.UTC(year, month, 0)).getDate();

  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ];
}

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}`;
}

function getKstYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

function moveKstMonth(year: number, month: number, amount: number) {
  const movedDate = new Date(Date.UTC(year, month - 1 + amount, 1, 12));
  return getKstYearMonth(movedDate);
}

type CalendarPeriodSelectProps = {
  value: number;
  options: number[];
  suffix: string;
  label: string;
  onChange: (value: number) => void;
};

function CalendarPeriodSelect({
  value,
  options,
  suffix,
  label,
  onChange,
}: CalendarPeriodSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`movie-calendar-period-select${open ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="movie-calendar-period-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          {value}
          {suffix}
        </span>
        <ChevronDown size={18} strokeWidth={1.7} aria-hidden="true" />
      </button>

      {open ? (
        <div className="movie-calendar-period-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="movie-calendar-period-option"
              role="option"
              aria-selected={option === value}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
              {suffix}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const initialKstMonth = getKstYearMonth();

export function MovieCalendarModal({
  token,
  onClose,
  onAdd,
  onDelete,
  onEdit,
}: Props) {
  const [year, setYear] = useState(initialKstMonth.year);
  const [month, setMonth] = useState(initialKstMonth.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<UserMovieCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const moviesByDate = useMemo(() => {
    const grouped = new Map<string, UserMovieCalendarItem[]>();
    for (const item of calendar?.items ?? []) {
      const movies = grouped.get(item.date) ?? [];
      movies.push(item);
      grouped.set(item.date, movies);
    }
    return grouped;
  }, [calendar]);

  const selectedMovies = selectedDate
    ? (moviesByDate.get(selectedDate) ?? [])
    : [];
  const currentKstYear = getKstYearMonth().year;
  const yearOptions = Array.from(
    { length: currentKstYear - 1999 },
    (_, index) => currentKstYear - index,
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendar() {
      try {
        const response = await getUserMovieCalendarRequest(token, year, month);

        if (!cancelled) {
          setCalendar(response);
        }
      } catch {
        if (!cancelled) {
          setError('관람 기록을 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCalendar();

    return () => {
      cancelled = true;
    };
  }, [token, year, month]);

  function changeCalendarPeriod(nextYear: number, nextMonth: number) {
    setLoading(true);
    setError(null);
    setSelectedDate(null);
    setYear(nextYear);
    setMonth(nextMonth);
  }

  function moveMonth(amount: number) {
    const nextMonth = moveKstMonth(year, month, amount);
    changeCalendarPeriod(nextMonth.year, nextMonth.month);
  }

  return (
    <div className="movie-calendar-modal-backdrop">
      <section
        className="movie-calendar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-calendar-title"
      >
        <header className="movie-calendar-header">
          <div>
            <p className="movie-calendar-kicker">MOVIE CALENDAR</p>
            <div
              className="movie-calendar-period-picker"
              id="movie-calendar-title"
            >
              <CalendarPeriodSelect
                value={year}
                options={yearOptions}
                suffix="년"
                label="년도 선택"
                onChange={(nextYear) => changeCalendarPeriod(nextYear, month)}
              />

              <CalendarPeriodSelect
                value={month}
                options={monthOptions}
                suffix="월"
                label="월 선택"
                onChange={(nextMonth) => changeCalendarPeriod(year, nextMonth)}
              />
            </div>
          </div>

          <button
            type="button"
            className="movie-calendar-close"
            onClick={onClose}
            aria-label="달력 닫기"
          >
            <X size={22} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        <div className="movie-calendar-controls">
          <button
            type="button"
            className="movie-calendar-month-button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft size={20} strokeWidth={1.6} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="movie-calendar-today"
            onClick={() => {
              const current = getKstYearMonth();
              changeCalendarPeriod(current.year, current.month);
            }}
          >
            오늘
          </button>

          <button
            type="button"
            className="movie-calendar-month-button"
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRight size={20} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        <div className="movie-calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="movie-calendar-grid">
          {days.map((day, index) => {
            if (day === null) {
              return <span key={`empty-${index}`} />;
            }

            const dateKey = getDateKey(year, month, day);
            const dayMovies = moviesByDate.get(dateKey) ?? [];
            const selected = selectedDate === dateKey;

            const todayDateKey = new Intl.DateTimeFormat('sv-SE', {
              timeZone: 'Asia/Seoul',
            }).format(new Date());

            const canAddMovie = dateKey <= todayDateKey;

            return (
              <button
                key={dateKey}
                type="button"
                className={[
                  'movie-calendar-day',
                  dayMovies.length > 0 ? 'has-movie' : '',
                  selected ? 'is-selected' : '',
                ]
                .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setSelectedDate(dateKey);
                  if (dayMovies.length === 0 && canAddMovie) {
                    onAdd?.(dateKey);
                  }
                }}
                disabled={!canAddMovie}
                aria-label={`${year}년 ${month}월 ${day}일 ${dayMovies.length > 0 ? '관람 기록 보기' : '영화 기록 추가'}`}
                aria-pressed={selected}
              >
                <strong className="movie-calendar-day-number">{day}</strong>

                {dayMovies.length > 0 ? (
                  <span className="movie-calendar-day-posters">
                    {dayMovies
                      .slice(0, 2)
                      .map((item) =>
                        item.movie.poster_path ? (
                          <img
                            key={item.tmdbId}
                            src={`https://image.tmdb.org/t/p/w185${item.movie.poster_path}`}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span
                            key={item.tmdbId}
                            className="movie-calendar-poster-empty"
                          />
                        ),
                      )}
                  </span>
                ) : null}

                {dayMovies.length > 2 ? (
                  <em className="movie-calendar-day-count">
                    +{dayMovies.length - 2}
                  </em>
                ) : null}
              </button>
            );
          })}
        </div>

        <section className="movie-calendar-detail" aria-live="polite">
          {loading ? (
            <p>관람 기록을 불러오는 중…</p>
          ) : error ? (
            <p>{error}</p>
          ) : selectedDate === null ? (
            <p>날짜를 누르면 본 영화가 표시됨</p>
          ) : selectedMovies.length === 0 ? (
            <p>
              {month}월 {Number(selectedDate.slice(-2))}일에는 관람 기록이 없음
            </p>
          ) : (
            <>
              <div className="movie-calendar-detail-heading">
                <h3>
                  {month}월 {Number(selectedDate.slice(-2))}일 관람 영화
                </h3>
                <button
                  type="button"
                  className="movie-calendar-detail-add"
                  onClick={() => onAdd?.(selectedDate)}
                >
                  이 날짜에 영화 추가
                </button>
              </div>

              <ul className="movie-calendar-detail-list">
                {selectedMovies.map((item) => (
                  <li key={`${item.tmdbId}-${item.watchedAt}`}>
                    {item.movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${item.movie.poster_path}`}
                        alt=""
                        loading="lazy"
                      />
                    ) : null}

                    <div className="movie-calendar-detail-item-content">
                      <span>{item.movie.title}</span>
                      <div className="movie-calendar-detail-item-actions">
                        <button
                          type="button"
                          className="movie-calendar-edit"
                          onClick={() =>
                            onEdit?.(item.tmdbId, item.watchedAt)
                          }
                        >
                          관람일 수정
                        </button>

                        <button
                          type="button"
                          className="movie-calendar-delete"
                          onClick={() => onDelete?.(item.tmdbId)}
                        >
                          관람 기록 삭제
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </section>
    </div>
  );
}
