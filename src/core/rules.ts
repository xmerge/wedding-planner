import { Solar } from 'lunar-javascript'
import type { RedFlagCheckResult, Mode } from './types'

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

// 阴差阳错日（特定干支组合）
const YIN_CHA_YANG_CUO = new Set([
  '丙子', '丙午', '丁丑', '丁未', '戊寅', '戊申',
  '辛卯', '辛酉', '壬辰', '壬戌', '癸巳', '癸亥'
])

// 十恶大败日
const SHI_E_DA_BAI = new Set([
  '甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'
])

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

export function isYinChaYangCuo(date: Date): boolean {
  const lunar = toSolar(date).getLunar()
  const dayGanZhi = lunar.getDayInGanZhiExact()
  return YIN_CHA_YANG_CUO.has(dayGanZhi)
}

export function isShiEDaBai(date: Date): boolean {
  const lunar = toSolar(date).getLunar()
  const dayGanZhi = lunar.getDayInGanZhiExact()
  return SHI_E_DA_BAI.has(dayGanZhi)
}

// 检查是否冲新人生肖（仅年支）
export function isChongShengXiao(date: Date, groomBirthday: Date, brideBirthday: Date): boolean {
  const dayZhi = getZhi(toSolar(date).getLunar().getDayInGanZhiExact())
  const groomYearZhi = getZhi(toSolar(groomBirthday).getLunar().getYearInGanZhiExact())
  const brideYearZhi = getZhi(toSolar(brideBirthday).getLunar().getYearInGanZhiExact())
  
  return ZHI_CHONG_MAP[dayZhi] === groomYearZhi || ZHI_CHONG_MAP[dayZhi] === brideYearZhi
}

// 检查是否冲新人日支（更严格）
export function isChongRiZhi(date: Date, groomBirthday: Date, brideBirthday: Date): boolean {
  const dayZhi = getZhi(toSolar(date).getLunar().getDayInGanZhiExact())
  const groomDayZhi = getZhi(toSolar(groomBirthday).getLunar().getDayInGanZhiExact())
  const brideDayZhi = getZhi(toSolar(brideBirthday).getLunar().getDayInGanZhiExact())
  
  return ZHI_CHONG_MAP[dayZhi] === groomDayZhi || ZHI_CHONG_MAP[dayZhi] === brideDayZhi
}

// 检查是否为生日
export function isBirthday(date: Date, groomBirthday: Date, brideBirthday: Date): boolean {
  const dateMonth = date.getMonth() + 1
  const dateDay = date.getDate()
  
  const groomMonth = groomBirthday.getMonth() + 1
  const groomDay = groomBirthday.getDate()
  
  const brideMonth = brideBirthday.getMonth() + 1
  const brideDay = brideBirthday.getDate()
  
  return (dateMonth === groomMonth && dateDay === groomDay) ||
         (dateMonth === brideMonth && dateDay === brideDay)
}

// 严格模式红线检测
export function checkStrictRedFlags(date: Date, groomBirthday: Date, brideBirthday: Date): RedFlagCheckResult {
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

  if (isYinChaYangCuo(date)) {
    flags.push('阴差阳错日')
  }

  if (isShiEDaBai(date)) {
    flags.push('十恶大败日')
  }

  if (isChongRiZhi(date, groomBirthday, brideBirthday)) {
    flags.push('冲新人日支')
  }

  return {
    hasRedFlags: flags.length > 0,
    flags,
  }
}

// 非严格模式红线检测
export function checkRelaxedRedFlags(date: Date, groomBirthday: Date, brideBirthday: Date): RedFlagCheckResult {
  const flags: string[] = []

  if (isChongShengXiao(date, groomBirthday, brideBirthday)) {
    flags.push('冲新人生肖')
  }

  if (isBirthday(date, groomBirthday, brideBirthday)) {
    flags.push('新人生日')
  }

  return {
    hasRedFlags: flags.length > 0,
    flags,
  }
}

// 统一入口
export function checkRedFlags(date: Date, groomBirthday: Date, brideBirthday: Date, mode: Mode = 'strict'): RedFlagCheckResult {
  if (mode === 'strict') {
    return checkStrictRedFlags(date, groomBirthday, brideBirthday)
  }
  return checkRelaxedRedFlags(date, groomBirthday, brideBirthday)
}
