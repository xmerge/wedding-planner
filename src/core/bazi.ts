import { Solar } from 'lunar-javascript'

export interface FourPillars {
  year: string
  month: string
  day: string
  time: string
}

export function getBaZi(
  year: number,
  month: number,
  day: number,
  hour: number,
): FourPillars {
  const lunar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar()

  return {
    year: lunar.getYearInGanZhiExact(),
    month: lunar.getMonthInGanZhiExact(),
    day: lunar.getDayInGanZhiExact(),
    time: lunar.getTimeInGanZhi(),
  }
}
