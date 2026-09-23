export function getUserFacingErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '서버와 연결할 수 없어요. 잠시 후 다시 시도해주세요.';
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
