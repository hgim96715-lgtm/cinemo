'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Chevron,
  DayPicker,
  DayButton,
  type DayButtonProps,
  type NavProps,
} from '@daypicker/react';
import '@daypicker/react/style.css';
import { ko } from '@daypicker/react/locale';

import { CinemoNav } from '@/components/common/CinemoNav';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';

import Image from 'next/image';
import '@/styles/calendar.css';
import '@/styles/common.css';
import '@/styles/lobby.css';
import '@/styles/my-cinema.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';
import '@/styles/movie-detail-modal.css';
import { useAuthStore } from '@/lib/auth-store';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useUserMovieCalendar } from '@/hooks/my-cinema/useUserMovieCalendar';
import { useRouter } from 'next/navigation';
import { ErrorModal } from '@/components/common/ErrorModal';

import { tmdbPosterUrl } from '@/lib/tmdb-image';

import { UserMovieCalendarItem } from '@cinemo/api-contract';
import { WatchedRecordDetailModal } from '@/components/my-cinema/WatchedRecordDetailModal';

type CalendarMovie = {
  id: number;
  title: string;
  posterUrl: string;
};

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [selectedCalendarMovie, setSelectedCalendarMovie] =
    useState<UserMovieCalendarItem | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const from = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');

  const {
    data: calendarDate,
    isPending: loading,
    error,
  } = useUserMovieCalendar({
    accessToken,
    userId,
    from,
    to,
  });

  const watchedDates = useMemo(
    () =>
      (calendarDate?.watched ?? []).map((movie) => parseDateKey(movie.date)),
    [calendarDate],
  );

  const releaseNotificationDates = useMemo(
    () =>
      (calendarDate?.releaseNotifications ?? []).map((movie) =>
        parseDateKey(movie.date),
      ),
    [calendarDate],
  );

  const selectedMovies = selectedDate
    ? (calendarDate?.watched ?? []).filter(
        (movie) => movie.date === getDateKey(selectedDate),
      )
    : [];

  const selectedNotification = selectedDate
    ? (calendarDate?.releaseNotifications ?? []).find(
        (movie) => movie.date === getDateKey(selectedDate),
      )
    : undefined;

  const handleMonthChange = (month: Date) => {
    setCalendarMonth(month);
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1));
  };

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login?next=/my-cinema/calendar');
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return null;
  }

  function CalendarDayButton({
    day,
    modifiers,
    children,
    ...buttonProps
  }: DayButtonProps) {
    const dateKey = getDateKey(day.date);

    const watchedMovie = (calendarDate?.watched ?? []).find(
      (movie) => movie.date === getDateKey(day.date),
    );

    const hasReleaseNotification = (
      calendarDate?.releaseNotifications ?? []
    ).some((movie) => movie.date === dateKey);

    const ariaLabel = [
      format(day.date, 'yyyy년 M월 d일'),
      watchedMovie && `${watchedMovie.title} 관람 기록 있음`,
      hasReleaseNotification && '개봉일 알림 설정됨',
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <DayButton
        {...buttonProps}
        day={day}
        modifiers={modifiers}
        className="calendar-day-button"
      >
        {watchedMovie?.posterPath && (
          <span className="calendar-day-poster">
            <Image
              src={tmdbPosterUrl(watchedMovie.posterPath, 'w342')!}
              alt=""
              fill
              sizes="110px"
              className="calendar-day-poster-backdrop"
              aria-hidden="true"
            />
            <Image
              src={tmdbPosterUrl(watchedMovie.posterPath, 'w342')!}
              alt={`${watchedMovie.title} 포스터`}
              fill
              sizes="110px"
              className="calendar-day-poster-image"
            />
          </span>
        )}
        <span className="calendar-day-number">{children}</span>

        {modifiers.releaseNotification && (
          <span className="calendar-day-notification" aria-hidden="true" />
        )}
      </DayButton>
    );
  }

  function CalendarNav({
    onPreviousClick,
    onNextClick,
    previousMonth,
    nextMonth,
    ...navProps
  }: NavProps) {
    const handleToday = () => {
      const today = new Date();

      setCalendarMonth(today);
      setSelectedDate(today);
    };

    return (
      <nav
        {...navProps}
        className={`${navProps.className ?? ''} calendar-month-nav`}
      >
        <button
          type="button"
          className="rdp-button_previous"
          disabled={!previousMonth}
          aria-label="이전 달"
          onClick={onPreviousClick}
        >
          <Chevron
            className="rdp-chevron"
            orientation="left"
            disabled={!previousMonth}
          />
        </button>

        <button
          type="button"
          className="calendar-today-button"
          onClick={handleToday}
        >
          오늘
        </button>

        <button
          type="button"
          className="rdp-button_next"
          disabled={!nextMonth}
          aria-label="다음 달"
          onClick={onNextClick}
        >
          <Chevron
            className="rdp-chevron"
            orientation="right"
            disabled={!nextMonth}
          />
        </button>
      </nav>
    );
  }

  return (
    <main className="my-cinema my-cinema-calendar">
      <CinemoPageHeader
        eyebrow="MY CALENDAR"
        title="영화 캘린더"
        description="보고 싶은 영화의 개봉일을 한눈에 확인하세요"
        nav={
          <CinemoNav
            leftAriaLabel="MY CINEMA로 이동"
            leftHref="/my-cinema"
            leftLabel="MY CINEMA"
            showRightLink
            rightLabel="WISH"
            rightAriaLabel="WISH로 이동"
            rightHref="/my-cinema/wish"
          />
        }
        leading={
          <div className="my-cinema-dashboard-brand">
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
        }
      />
      <section className="my-cinema-calendar-panel">
        <div className="my-cinema-calendar-picker">
          {error ? (
            <ErrorModal
              open
              eyebrow="FAIL"
              title="영화 캘린더 조회 실패"
              description={
                error instanceof Error
                  ? error.message
                  : '캘린더 데이터를 불러오지 못했습니다.'
              }
              onClose={() => window.location.reload()}
            />
          ) : loading && !calendarDate ? (
            <p className="calendar-loading">캘린더 불러오는 중...</p>
          ) : (
            <DayPicker
              mode="single"
              required
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(2030, 11)}
              month={calendarMonth}
              onMonthChange={handleMonthChange}
              selected={selectedDate}
              onSelect={(date) => {
                if (date) setSelectedDate(date);
              }}
              locale={ko}
              showOutsideDays
              fixedWeeks
              weekStartsOn={0}
              components={{
                DayButton: CalendarDayButton,
                Nav: CalendarNav,
              }}
              modifiers={{
                watched: watchedDates,
                releaseNotification: releaseNotificationDates,
              }}
              modifiersClassNames={{
                watched: 'calendar-day--watched',
                releaseNotification: 'calendar-day--release-notification',
              }}
              formatters={{
                formatYearDropdown: (date) => `${date.getFullYear()}년`,
              }}
            />
          )}
        </div>
        <div className="calendar-legend" aria-label="달력 범례">
          {selectedNotification ? (
            <p className="calendar-selected-notification">
              <span className="calendar-legend-dot" aria-hidden="true" />
              <strong>{selectedNotification.title}</strong> · 알림 설정됨
            </p>
          ) : (
            <p className="calendar-selected-notification notification-description">
              <span className="calendar-legend-dot" aria-hidden="true" />
              <strong>개봉일</strong> 알림 설정
            </p>
          )}
        </div>
      </section>

      <section className="calendar-selected-movies">
        <h3>{format(selectedDate, 'yyyy년 M월 d일')}</h3>

        {selectedMovies.length > 0 ? (
          <ul>
            {selectedMovies.map((movie) => (
              <li key={`${movie.tmdbId}-${movie.date}`}>
                <button
                  type="button"
                  className="calendar-movie-button"
                  onClick={() => setSelectedCalendarMovie(movie)}
                >
                  {movie.posterPath && (
                    <Image
                      src={tmdbPosterUrl(movie.posterPath, 'w185')!}
                      alt={movie.title}
                      width={185}
                      height={278}
                    />
                  )}

                  <span>{movie.title}</span>
                </button>
              </li>
            ))}

            {selectedCalendarMovie && (
              <WatchedRecordDetailModal
                open
                movie={selectedCalendarMovie}
                onClose={() => setSelectedCalendarMovie(null)}
              />
            )}
          </ul>
        ) : (
          <p>관람 기록이 없습니다.</p>
        )}
      </section>
    </main>
  );
}
