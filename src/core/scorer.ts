import { Solar } from 'lunar-javascript'

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

const SCORE_YI_MARRY = 30
const SCORE_HE_DAY = 20
const SCORE_WEEKEND_OR_HOLIDAY = 20
const SCORE_EVEN_DAY = 10
const RAW_MAX_SCORE =
  SCORE_YI_MARRY + SCORE_HE_DAY + SCORE_WEEKEND_OR_HOLIDAY + SCORE_EVEN_DAY

export interface DateScoreResult {
  rawScore: number
  score: number
  reasons: string[]
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

export function scoreDate(
  date: Date,
  groomBirthday: Date,
  brideBirthday: Date,
): DateScoreResult {
  const solar = toSolar(date)
  const lunar = solar.getLunar()
  const reasons: string[] = []
  let rawScore = 0

  const dayYi = lunar.getDayYi(2) as string[]
  if (dayYi.includes('嫁娶')) {
    rawScore += SCORE_YI_MARRY
    reasons.push('黄历宜嫁娶 +30')
  }

  const dayZhi = getZhi(lunar.getDayInGanZhiExact())
  const groomYearZhi = getZhi(toSolar(groomBirthday).getLunar().getYearInGanZhiExact())
  const brideYearZhi = getZhi(toSolar(brideBirthday).getLunar().getYearInGanZhiExact())

  if (isSanHeOrLiuHe(dayZhi, groomYearZhi) || isSanHeOrLiuHe(dayZhi, brideYearZhi)) {
    rawScore += SCORE_HE_DAY
    reasons.push('三合六合日 +20')
  }

  const isWeekend = solar.getWeek() === 0 || solar.getWeek() === 6
  const hasFestival =
    ((solar.getFestivals() as string[])?.length ?? 0) > 0 ||
    ((lunar.getFestivals() as string[])?.length ?? 0) > 0
  if (isWeekend || hasFestival) {
    rawScore += SCORE_WEEKEND_OR_HOLIDAY
    reasons.push('周末节假日 +20')
  }

  if (date.getDate() % 2 === 0) {
    rawScore += SCORE_EVEN_DAY
    reasons.push('双数日期 +10')
  }

  const normalizedScore = Math.round((rawScore / RAW_MAX_SCORE) * 100)

  return {
    rawScore,
    score: normalizedScore,
    reasons: reasons.length > 0 ? reasons : ['无加分项'],
  }
}
