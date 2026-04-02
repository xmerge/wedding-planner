import { Solar } from 'lunar-javascript'

const ZHI_CHONG_MAP: Record<string, string> = {
  子: '午',
  丑: '未',
  寅: '申',
  卯: '酉',
  辰: '戌',
  巳: '亥',
  午: '子',
  未: '丑',
  申: '寅',
  酉: '卯',
  戌: '辰',
  亥: '巳',
}

const SI_LI_TERMS = new Set(['春分', '夏至', '秋分', '冬至'])
const SI_JUE_TERMS = new Set(['立春', '立夏', '立秋', '立冬'])

const YANG_GONG_JI_TABLE: Record<number, number[]> = {
  1: [13],
  2: [11],
  3: [9],
  4: [7],
  5: [5],
  6: [3],
  7: [1, 29],
  8: [27],
  9: [25],
  10: [23],
  11: [21],
  12: [19],
}

export interface RedFlagCheckResult {
  hasRedFlags: boolean
  flags: string[]
}

function toSolar(date: Date) {
  return Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function getZhi(ganZhi: string): string {
  return ganZhi.charAt(1)
}

export function isSuiPoDay(date: Date): boolean {
  const lunar = toSolar(date).getLunar()
  const yearZhi = getZhi(lunar.getYearInGanZhiExact())
  const dayZhi = getZhi(lunar.getDayInGanZhiExact())
  return ZHI_CHONG_MAP[yearZhi] === dayZhi
}

export function isYuePoDay(date: Date): boolean {
  const lunar = toSolar(date).getLunar()
  const monthZhi = getZhi(lunar.getMonthInGanZhiExact())
  const dayZhi = getZhi(lunar.getDayInGanZhiExact())
  return ZHI_CHONG_MAP[monthZhi] === dayZhi
}

export function isSiLiSiJue(date: Date): boolean {
  const tomorrow = new Date(date)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tomorrowJieQi = toSolar(tomorrow).getLunar().getJieQi()
  return SI_LI_TERMS.has(tomorrowJieQi) || SI_JUE_TERMS.has(tomorrowJieQi)
}

export function isYangGongJi(date: Date): boolean {
  const lunar = toSolar(date).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth())
  const lunarDay = lunar.getDay()
  const badDays = YANG_GONG_JI_TABLE[lunarMonth] ?? []
  return badDays.includes(lunarDay)
}

export function checkRedFlags(date: Date): RedFlagCheckResult {
  const flags: string[] = []

  if (isSuiPoDay(date)) {
    flags.push('岁破日')
  }

  if (isYuePoDay(date)) {
    flags.push('月破日')
  }

  if (isSiLiSiJue(date)) {
    flags.push('四离四绝日')
  }

  if (isYangGongJi(date)) {
    flags.push('杨公忌日')
  }

  return {
    hasRedFlags: flags.length > 0,
    flags,
  }
}
