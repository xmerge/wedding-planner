export type Mode = 'strict' | 'relaxed'

export interface RedFlagCheckResult {
  hasRedFlags: boolean
  flags: string[]
}

export interface DateScoreResult {
  rawScore: number
  score: number
  reasons: string[]
}

export interface RuleSet {
  redFlags: string[]
  scorer: 'strict' | 'relaxed'
}
