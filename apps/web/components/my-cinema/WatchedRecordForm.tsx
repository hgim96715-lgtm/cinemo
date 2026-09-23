import { MapPin } from 'lucide-react';
import type { PlaceSearchResult } from '@cinemo/api-contract';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { CinemoSelect } from '@/components/common/CinemoSelect';
import {
  type WatchedRecordFormValues,
  VIEWING_PLATFORM_OPTIONS,
  VIEWING_TYPE_OPTIONS,
} from './watched-record-form';

type WatchedPlaceOption = PlaceSearchResult & {
  cinemaId?: string;
};

type WatchedRecordSubmitHandler = ReturnType<
  UseFormHandleSubmit<WatchedRecordFormValues>
>;

type WatchedRecordFormProps = {
  control: Control<WatchedRecordFormValues>;
  errors: FieldErrors<WatchedRecordFormValues>;
  register: UseFormRegister<WatchedRecordFormValues>;
  setValue: UseFormSetValue<WatchedRecordFormValues>;
  onSubmit: WatchedRecordSubmitHandler;
  todayKst: string;
  isSubmitting: boolean;
  selectedViewingType: WatchedRecordFormValues['viewingType'];
  viewingPlatformMode: WatchedRecordFormValues['viewingPlatformMode'];
  selectedViewingPlatform: string;
  viewingDetailsError: string | null;
  isPlaceFocused: boolean;
  onPlaceFocus: () => void;
  onPlaceBlur: () => void;
  visiblePlaceSuggestions: WatchedPlaceOption[];
  isSearchingPlaces: boolean;
  onPlaceSelect: (place: WatchedPlaceOption) => void;
};

export function WatchedRecordForm({
  control,
  errors,
  register,
  setValue,
  onSubmit,
  todayKst,
  isSubmitting,
  selectedViewingType,
  viewingPlatformMode,
  selectedViewingPlatform,
  viewingDetailsError,
  isPlaceFocused,
  onPlaceFocus,
  onPlaceBlur,
  visiblePlaceSuggestions,
  isSearchingPlaces,
  onPlaceSelect,
}: WatchedRecordFormProps) {
  return (
    <form
      className="movie-detail-screening"
      aria-label="관람 기록 입력"
      onSubmit={onSubmit}
    >
      <label>
        <span>관람일</span>
        <input
          type="date"
          max={todayKst}
          {...register('watchedAt')}
          disabled={isSubmitting}
        />
        {errors.watchedAt?.message ? (
          <small role="alert">{errors.watchedAt.message}</small>
        ) : null}
      </label>

      <label className="movie-detail-viewing-type-field">
        <span>관람 방식</span>
        <CinemoSelect
          value={selectedViewingType}
          options={VIEWING_TYPE_OPTIONS}
          ariaLabel="관람 방식 선택"
          disabled={isSubmitting}
          onChange={(value) => {
            setValue(
              'viewingType',
              value as WatchedRecordFormValues['viewingType'],
              {
                shouldDirty: true,
                shouldValidate: true,
              },
            );
            if (value !== 'other') {
              setValue('viewingTypeCustom', '', {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        />
        {selectedViewingType === 'other' ? (
          <input
            {...register('viewingTypeCustom')}
            placeholder="관람 방식을 직접 입력"
            maxLength={100}
            disabled={isSubmitting}
          />
        ) : null}
        {errors.viewingTypeCustom?.message ? (
          <small role="alert">{errors.viewingTypeCustom.message}</small>
        ) : null}
      </label>

      <label className="movie-detail-platform-field">
        <span>플랫폼</span>
        <CinemoSelect
          value={
            viewingPlatformMode === 'custom' ? 'other' : selectedViewingPlatform
          }
          options={[
            { value: '', label: '선택 안 함' },
            ...VIEWING_PLATFORM_OPTIONS.map((platform) => ({
              value: platform,
              label: platform,
            })),
            { value: 'other', label: '기타' },
          ]}
          ariaLabel="플랫폼 선택"
          disabled={isSubmitting}
          onChange={(value) => {
            if (value === 'other') {
              setValue('viewingPlatformMode', 'custom', {
                shouldDirty: true,
                shouldValidate: true,
              });
              return;
            }

            setValue('viewingPlatformMode', 'preset', {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue('viewingPlatform', value, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
        {viewingPlatformMode === 'custom' ? (
          <input
            {...register('customViewingPlatform')}
            placeholder="플랫폼을 직접 입력"
            maxLength={40}
            disabled={isSubmitting}
          />
        ) : null}
        {errors.customViewingPlatform?.message ? (
          <small role="alert">{errors.customViewingPlatform.message}</small>
        ) : null}
      </label>

      <label>
        <span>관람 장소</span>
        <MapPin size={16} strokeWidth={1.5} aria-hidden />
        <input
          {...register('viewingPlace')}
          placeholder="CGV,롯데시네마,메가박스 등"
          maxLength={100}
          disabled={isSubmitting}
          onFocus={onPlaceFocus}
          onBlur={onPlaceBlur}
        />
        {errors.viewingPlace?.message ? (
          <small role="alert">{errors.viewingPlace.message}</small>
        ) : null}
        {isSearchingPlaces ? (
          <small className="movie-detail-place-status">
            장소를 찾는 중…
          </small>
        ) : null}

        {!isSearchingPlaces &&
        isPlaceFocused &&
        visiblePlaceSuggestions.length > 0 ? (
          <div
            className="movie-detail-place-suggestions"
            role="listbox"
            aria-label="관람 장소 추천"
          >
            {visiblePlaceSuggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                role="option"
                aria-selected={false}
                className="movie-detail-place-option"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onPlaceSelect(place);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onPlaceSelect(place);
                  }
                }}
              >
                <strong>{place.name}</strong>
                <span>{place.roadAddress || place.address}</span>
              </button>
            ))}
          </div>
        ) : null}
      </label>

      <label>
        <span>후기</span>
        <textarea
          {...register('review')}
          placeholder="이 영화에 대한 짧은 기록을 남겨보세요"
          maxLength={1000}
          rows={4}
          disabled={isSubmitting}
        />
        {errors.review?.message ? (
          <small role="alert">{errors.review.message}</small>
        ) : null}
      </label>

      <Controller
        name="rating"
        control={control}
        render={({ field }) => (
          <div className="movie-detail-rating">
            <div className="movie-detail-rating-heading">
              <span>평점</span>
              <strong className="movie-detail-rating-value" aria-live="polite">
                {field.value ? `${field.value}점` : '—'}
              </strong>
            </div>

            <div className="movie-detail-rating-bar">
              {Array.from({ length: 10 }, (_, index) => {
                const score = index + 1;

                return (
                  <button
                    key={score}
                    type="button"
                    className={score <= (field.value ?? 0) ? 'is-filled' : ''}
                    onClick={() =>
                      field.onChange(field.value === score ? null : score)
                    }
                    aria-label={
                      field.value === score
                        ? `${score}점 선택 해제`
                        : `${score}점`
                    }
                    aria-pressed={score === field.value}
                    disabled={isSubmitting}
                  />
                );
              })}
            </div>
          </div>
        )}
      />
      {errors.rating?.message ? (
        <small role="alert">{errors.rating.message}</small>
      ) : null}

      {viewingDetailsError ? <p role="alert">{viewingDetailsError}</p> : null}

      <button
        type="submit"
        className="movie-detail-screening-save"
        disabled={isSubmitting}
      >
        {isSubmitting ? '저장 중…' : '관람 정보 저장'}
      </button>
    </form>
  );
}
