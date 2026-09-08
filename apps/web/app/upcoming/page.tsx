'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Heart } from 'lucide-react';
import {
  getUpcomingMoviesRequest,
  type UpcomingMovie,
} from '@/lib/lobby-board-api';
import {
  listUserMoviesRequest,
  toggleUserMovieRequest,
} from '@/lib/user-movie-api';
import { useAuthStore } from '@/lib/auth-store';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import '../styles/lobby.css';

export default function UpcomingPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [movies, setMovies] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingInterestId, setTogglingInterestId] = useState<number | null>(
    null,
  );
  const [interestedIds, setInterestedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadUpcomingMovies() {
      setLoading(true);
      setError(null);
      try {
        const upcomingMovies = await getUpcomingMoviesRequest();
        if (!cancelled) {
          setMovies(upcomingMovies);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '개봉 예정작을 불러오지 못했어요.',
          );
          setMovies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadUpcomingMovies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = accessToken;
    let cancelled = false;

    async function loadInterestedMovies() {
      if (!token) {
        if (!cancelled) {
          setInterestedIds([]);
        }
        return;
      }

      try {
        const result = await listUserMoviesRequest(token, 'wish', 1, 100);
        if (!cancelled) {
          setInterestedIds(result.items.map((movie) => movie.tmdbId));
        }
      } catch {
        if (!cancelled) {
          setInterestedIds([]);
        }
      }
    }
    void loadInterestedMovies();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleInterestClick(tmdbId: number) {
    if (!accessToken) {
      router.push('/login?next=/upcoming');
      return;
    }
    setTogglingInterestId(tmdbId);
    try {
      const result = await toggleUserMovieRequest(accessToken, tmdbId, 'wish');
      setInterestedIds((current) =>
        result.active
          ? [...current, tmdbId]
          : current.filter((id) => id !== tmdbId),
      );
      setMovies((current) =>
        current.map((movie) =>
          movie.tmdbId === tmdbId
            ? {
                ...movie,
                interestCount: Math.max(
                  0,
                  movie.interestCount + (result.active ? 1 : -1),
                ),
              }
            : movie,
        ),
      );
    } finally {
      setTogglingInterestId(null);
    }
  }

  function formatReleaseDate(releaseDate: string) {
    // console.log(releaseDate);
    const [year, month, day] = releaseDate.split('-');
    if (!year || !month || !day) return '개봉일 미정';
    return `${year}.${month}.${day} 개봉 예정`;
  }

  return (
    <main className="lobby upcoming-lobby lobby--lit">
      <section className="lobby-stage upcoming-page">
        <nav className="upcoming-nav" aria-label="개봉 예정 영화 메뉴">
          <Link href="/" className="upcoming-nav-link upcoming-nav-link--lobby">
            <ArrowLeft size={17} aria-hidden />
            <span>CINEMO LOBBY</span>
          </Link>

          <Link href="/my-cinema/wish" className="upcoming-nav-link upcoming-nav-link--wish">
            <Heart size={17} aria-hidden />
            <span>찜한 영화</span>
          </Link>
        </nav>

        <header className="upcoming-header">
          <CalendarDays size={28} aria-hidden />
          <p className="lobby-destination-kicker">COMING SOON</p>
          <h1>곧 스크린에서 만날 영화</h1>
          <p>개봉일을 확인하고 미리 찜해보세요</p>
        </header>

        <section
          className="upcoming-list"
          aria-label="앞으로 극장에서 만날 영화"
        >
          {loading ? (
            <p>개봉 예정작을 불러오는 중이에요.</p>
          ) : error ? (
            <p>{error}</p>
          ) : movies.length === 0 ? (
            <p>현재 개봉 예정작이 없어요.</p>
          ) : (
            movies.map((movie, index) => {
              const poster = tmdbPosterUrl(movie.posterPath, 'w185');
              const interested = interestedIds.includes(movie.tmdbId);
              const toggling = togglingInterestId === movie.tmdbId;

              return (
                <article className="upcoming-movie-card" key={movie.tmdbId}>
                  <span className="upcoming-movie-rank">{index + 1}</span>

                  {poster ? (
                    <Image
                      src={poster}
                      alt={`${movie.title} 포스터`}
                      width={72}
                      height={108}
                    />
                  ) : null}

                  <div>
                    <h2>{movie.title}</h2>
                    <p>{formatReleaseDate(movie.releaseDate)}</p>
                    <p>관심 등록 {movie.interestCount}명</p>
                  </div>

                  <button
                    type="button"
                    aria-pressed={interested}
                    disabled={toggling}
                    onClick={() => void handleInterestClick(movie.tmdbId)}
                  >
                    <Heart
                      width={18}
                      height={18}
                      strokeWidth={2}
                      fill={interested ? 'currentColor' : 'none'}
                      aria-hidden
                    />
                    {interested ? '관심 등록됨' : '보고 싶어요'}
                  </button>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
