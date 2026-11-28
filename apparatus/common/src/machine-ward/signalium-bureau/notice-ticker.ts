const NOTICE_TICKER_PIXELS_PER_SECOND = 75;

export const getNoticeTickerDuration = (distance: number): number =>
    distance * 1000 / NOTICE_TICKER_PIXELS_PER_SECOND;
