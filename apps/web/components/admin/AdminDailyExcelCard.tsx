'use client';

import { useEffect, useState } from 'react';
import {
  downloadDailyExcelRequest,
  getDailyExcelStatusRequest,
  type AdminDailyReportStatus,
} from '@/lib/admin-api';
import {
  formatKstDateKey,
  kstPreviousDateKey,
} from '@/lib/date-kst';

type Props = {
  token: string | null;
};

export function AdminDailyExcelCard({ token }: Props) {
  const [report, setReport] = useState<AdminDailyReportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const accessToken = token;
    let cancelled = false;
    async function loadReport() {
      try {
        const result = await getDailyExcelStatusRequest(accessToken);
        if (!cancelled) {
          setReport(result);
          setError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '엑셀 상태를 불러오는데 실패했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function downloadReport() {
    if (!token || report?.status !== 'succeeded') return;
    setDownloading(true);
    try {
      await downloadDailyExcelRequest(token);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '엑셀 다운로드 실패했습니다.',
      );
    } finally {
      setDownloading(false);
    }
  }

  const statusLabel =
    report?.status === 'succeeded'
      ? '생성 완료'
      : report?.status === 'failed'
        ? '생성 실패'
        : report?.status === 'running'
          ? '생성 중'
          : '생성 기록 없음';
  const reportDate = report?.date ?? kstPreviousDateKey();

  return (
    <section className="admin-report-card">
      <div>
        <p className="admin-report-kicker">DAILY REPORT</p>
        <h2 className="admin-report-title">
          {formatKstDateKey(reportDate)} 하루 엑셀
        </h2>
      </div>

      {loading ? (
        <p className="admin-status">상태 확인 중…</p>
      ) : (
        <>
          <p className="admin-report-status">{statusLabel}</p>

          {report ? (
            <>
              <dl className="admin-report-counts">
                <div>
                  <dt>로비 입장</dt>
                  <dd>{report.visitRowCount.toLocaleString()}건</dd>
                </div>
                <div>
                  <dt>로그인</dt>
                  <dd>{report.loginRowCount.toLocaleString()}건</dd>
                </div>
                <div>
                  <dt>시간대 통계</dt>
                  <dd>{report.hourlyRowCount.toLocaleString()}건</dd>
                </div>
              </dl>

              {report.errorMessage ? (
                <p className="admin-error">{report.errorMessage}</p>
              ) : null}

              <button
                type="button"
                className="admin-report-download"
                onClick={() => void downloadReport()}
                disabled={report.status !== 'succeeded' || downloading}
              >
                {downloading ? '다운로드 중…' : '엑셀 다운로드'}
              </button>
            </>
          ) : (
            <p className="admin-sub">아직 생성된 리포트가 없음</p>
          )}

          {error ? <p className="admin-error">{error}</p> : null}
        </>
      )}
    </section>
  );
}
