import { Solar } from 'lunar-javascript'
import type { DateScoreResult, Mode } from './types'

const LIU_HE_MAP: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
}

const SAN_HE_GROUPS = [
  ['申', '子', '辰'],
  ['亥', '卯', '未'],
  ['寅', '午', '戌'],
  ['巳', '酉', '丑'],
]

// 严格模式评分权重
const STRICT_SCORES = {
  YI_MARRY: 25,
  HE_DAY: 30,
  AVOID_CHONG: 25,
  WEEKEND_HOLIDAY: 15,
  EVEN_DAY: 5,
}

// 非严格模式评分权重
const RELAXED_SCORES = {
  YI_MARRY: 30,
  WEEKEND: 30,
  HOLIDAY: 25,
  SPECIAL_DATE: 10,
  EVEN_DAY: 5,
}

// 特殊日期（520、七夕、纪念日等）
const SPECIAL_DATES: Record<string, string> = {
  '5-20': '520情人节',
  '2-14': '西方情人节',
  '7-7': '七夕节（农历）',
  '10-10': '十全十美',
}

function toSolar(date: Date) {
  return Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function getZhi(ganZhi: string): string {
  return ganZhi.charAt(1)
}

function isSanHeOrLiuHe(dayZhi: string, personYearZhi: string): boolean {
  if (LIU_HE_MAP[dayZhi] === personYearZhi) {
    return true
  }

  return SAN_HE_GROUPS.some(
    (group) => group.includes(dayZhi) && group.includes(personYearZhi),
  )
}

function isWeekend(date: Date): boolean {
  const solar = toSolar(date)
  return solar.getWeek() === 0 || solar.getWeek() === 6
}

function hasFestival(date: Date): boolean {
  const solar = toSolar(date)
  const lunar = solar.getLunar()
  return ((solar.getFestivals() as string[])?.length ?? 0) > 0 ||
         ((lunar.getFestivals() as string[])?.length ?? 0) > 0
}

function isSpecialDate(date: Date): string | null {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const key = `${month}-${day}`
  
  if (SPECIAL_DATES[key]) {
    return SPECIAL_DATES[key]
  }
  
  // 检查农历七夕
  const lunar = toSolar(date).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth())
  const lunarDay = lunar.getDay()
  if (lunarMonth === 7 && lunarDay === 7) {
    return '七夕节'
  }
  
  return null
}

// 严格模式评分
function scoreStrict(date: Date, groomBirthday: Date, brideBirthday: Date): DateScoreResult {
  const solar = toSolar(date)
  const lunar = solar.getLunar()
  const reasons: string[] = []
  let rawScore = 0

  // 黄历宜嫁娶
  const dayYi = lunar.getDayYi(2) as string[]
  if (dayYi.includes('嫁娶')) {
    rawScore += STRICT_SCORES.YI_MARRY
    reasons.push(`黄历宜嫁娶 +${STRICT_SCORES.YI_MARRY}`)
  }

  // 三合六合日
  const dayZhi = getZhi(lunar.getDayInGanZhiExact())
  const groomYearZhi = getZhi(toSolar(groomBirthday).getLunar().getYearInGanZhiExact())
  const brideYearZhi = getZhi(toSolar(brideBirthday).getLunar().getYearInGanZhiExact())

  if (isSanHeOrLiuHe(dayZhi, groomYearZhi) || isSanHeOrLiuHe(dayZhi, brideYearZhi)) {
    rawScore += STRICT_SCORES.HE_DAY
    reasons.push(`三合六合日 +${STRICT_SCORES.HE_DAY}`)
  }

  // 避开冲煞（在红线检测中处理，这里不加分）

  // 周末/节假日
  const isWknd = isWeekend(date)
  const hasFest = hasFestival(date)
  if (isWknd || hasFest) {
    rawScore += STRICT_SCORES.WEEKEND_HOLIDAY
    reasons.push(`${hasFest ? '节假日' : '周末'} +${STRICT_SCORES.WEEKEND_HOLIDAY}`)
  }

  // 双数日期
  if (date.getDate() % 2 === 0) {
    rawScore += STRICT_SCORES.EVEN_DAY
    reasons.push(`双数日期 +${STRICT_SCORES.EVEN_DAY}`)
  }

  const maxScore = STRICT_SCORES.YI_MARRY + STRICT_SCORES.HE_DAY + 
                   STRICT_SCORES.WEEKEND_HOLIDAY + STRICT_SCORES.EVEN_DAY
  const normalizedScore = Math.round((rawScore / maxScore) * 100)

  return {
    rawScore,
    score: normalizedScore,
    reasons: reasons.length > 0 ? reasons : ['无加分项'],
  }
}

// 非严格模式评分
function scoreRelaxed(date: Date, _groomBirthday: Date, _brideBirthday: Date): DateScoreResult {
  const solar = toSolar(date)
  const lunar = solar.getLunar()
  const reasons: string[] = []
  let rawScore = 0

  // 黄历宜嫁娶
  const dayYi = lunar.getDayYi(2) as string[]
  if (dayYi.includes('嫁娶')) {
    rawScore += RELAXED_SCORES.YI_MARRY
    reasons.push(`黄历宜嫁娶 +${RELAXED_SCORES.YI_MARRY}`)
  }

  // 周末
  if (isWeekend(date)) {
    rawScore += RELAXED_SCORES.WEEKEND
    reasons.push(`周末 +${RELAXED_SCORES.WEEKEND}`)
  }

  // 节假日
  if (hasFestival(date)) {
    rawScore += RELAXED_SCORES.HOLIDAY
    reasons.push(`节假日 +${RELAXED_SCORES.HOLIDAY}`)
  }

  // 特殊日期
  const special = isSpecialDate(date)
  if (special) {
    rawScore += RELAXED_SCORES.SPECIAL_DATE
    reasons.push(`${special} +${RELAXED_SCORES.SPECIAL_DATE}`)
  }

  // 双数日期
  if (date.getDate() % 2 === 0) {
    rawScore += RELAXED_SCORES.EVEN_DAY
    reasons.push(`双数日期 +${RELAXED_SCORES.EVEN_DAY}`)
  }

  const maxScore = RELAXED_SCORES.YI_MARRY + RELAXED_SCORES.WEEKEND + 
                   RELAXED_SCORES.HOLIDAY + RELAXED_SCORES.SPECIAL_DATE + RELAXED_SCORES.EVEN_DAY
  const normalizedScore = Math.round((rawScore / maxScore) * 100)

  return {
    rawScore,
    score: normalizedScore,
    reasons: reasons.length > 0 ? reasons : ['无加分项'],
  }
}

// 统一入口
export function scoreDate(
  date: Date,
  groomBirthday: Date,
  brideBirthday: Date,
  mode: Mode = 'strict',
): DateScoreResult {
  if (mode === 'strict') {
    return scoreStrict(date, groomBirthday, brideBirthday)
  }
  return scoreRelaxed(date, groomBirthday, brideBirthday)
}
