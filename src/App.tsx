import { useMemo, useState } from 'react'
import About from './components/About'
import { getBaZi } from './core/bazi'
import { checkRedFlags } from './core/rules'
import { scoreDate } from './core/scorer'
import type { Mode } from './core/types'
import './App.css'

interface CandidateResult {
  date: string
  score: number
  reasons: string[]
  redFlags: string[]
}

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function eachDay(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function getModeLabel(mode: Mode): string {
  return mode === 'strict' ? '严格模式' : '非严格模式'
}

function App() {
  const [currentPage, setCurrentPage] = useState<'calculator' | 'about'>(
    'calculator',
  )
  const [mode, setMode] = useState<Mode>('relaxed')
  const [groomBirthday, setGroomBirthday] = useState('')
  const [brideBirthday, setBrideBirthday] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [results, setResults] = useState<CandidateResult[]>([])
  const [error, setError] = useState('')

  const groomBaZi = useMemo(() => {
    const date = parseDateInput(groomBirthday)
    return date
      ? getBaZi(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12)
      : null
  }, [groomBirthday])

  const brideBaZi = useMemo(() => {
    const date = parseDateInput(brideBirthday)
    return date
      ? getBaZi(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12)
      : null
  }, [brideBirthday])

  const handleCalculate = () => {
    const groomDate = parseDateInput(groomBirthday)
    const brideDate = parseDateInput(brideBirthday)
    const start = parseDateInput(rangeStart)
    const end = parseDateInput(rangeEnd)

    if (!groomDate || !brideDate || !start || !end) {
      setError('请完整选择新郎、新娘生日和择日范围')
      setResults([])
      return
    }

    if (start > end) {
      setError('开始日期不能晚于结束日期')
      setResults([])
      return
    }

    const days = eachDay(start, end)
    if (days.length > 366) {
      setError('日期范围请控制在 366 天以内')
      setResults([])
      return
    }

    const scored = days
      .map((date) => {
        const scoreResult = scoreDate(date, groomDate, brideDate, mode)
        const redFlag = checkRedFlags(date, groomDate, brideDate, mode)

        return {
          date: formatDate(date),
          score: scoreResult.score,
          reasons: scoreResult.reasons,
          redFlags: redFlag.flags,
        }
      })
      .filter((item) => item.redFlags.length === 0) // 过滤掉有红线的日期
      .sort((a, b) => b.score - a.score)

    setError('')
    setResults(scored)
  }

  return (
    <main className="app">
      <nav className="top-nav">
        <button
          type="button"
          className={currentPage === 'calculator' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentPage('calculator')}
        >
          择日计算
        </button>
        <button
          type="button"
          className={currentPage === 'about' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentPage('about')}
        >
          关于项目
        </button>
      </nav>

      {currentPage === 'about' ? <About /> : null}

      {currentPage === 'calculator' ? (
        <>
      <h1>婚礼择日助手</h1>

      <section className="panel mode-panel">
        <h2>择日模式</h2>
        <div className="mode-switch">
          <button
            type="button"
            className={mode === 'strict' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => setMode('strict')}
          >
            严格模式
          </button>
          <button
            type="button"
            className={mode === 'relaxed' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => setMode('relaxed')}
          >
            非严格模式
          </button>
        </div>
        <p className="mode-desc">
          {mode === 'strict' 
            ? '严格遵循传统择日规则，适合重视传统习俗的用户。需避开岁破、月破、四离四绝、杨公忌等凶日。'
            : '简化择日规则，适合追求便捷的现代用户。仅避开冲生肖和生日，侧重周末、节假日等实用因素。'
          }
        </p>
      </section>

      <section className="panel">
        <div className="field-grid">
          <label>
            新郎出生日期
            <input
              type="date"
              value={groomBirthday}
              onChange={(e) => setGroomBirthday(e.target.value)}
            />
          </label>

          <label>
            新娘出生日期
            <input
              type="date"
              value={brideBirthday}
              onChange={(e) => setBrideBirthday(e.target.value)}
            />
          </label>

          <label>
            择日开始
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
          </label>

          <label>
            择日结束
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />
          </label>
        </div>

        <button type="button" onClick={handleCalculate}>
          计算推荐日期
        </button>

        {error ? <p className="error">{error}</p> : null}
      </section>

      {(groomBaZi || brideBaZi) && (
        <section className="panel bazi-panel">
          <h2>生辰八字（默认按 12:00）</h2>
          {groomBaZi && (
            <p>
              新郎：{groomBaZi.year}年 {groomBaZi.month}月 {groomBaZi.day}日 {groomBaZi.time}时
            </p>
          )}
          {brideBaZi && (
            <p>
              新娘：{brideBaZi.year}年 {brideBaZi.month}月 {brideBaZi.day}日 {brideBaZi.time}时
            </p>
          )}
        </section>
      )}

      <section className="panel">
        <h2>推荐日期 <span className="mode-tag">{getModeLabel(mode)}</span></h2>
        {results.length === 0 ? (
          <p>点击"计算推荐日期"后显示候选日期评分。</p>
        ) : (
          <ul className="result-list">
            {results.slice(0, 20).map((item) => (
              <li key={item.date} className="result-item">
                <div className="row">
                  <strong>{item.date}</strong>
                  <span className="score">{item.score} 分</span>
                </div>
                <p className="reasons">✓ {item.reasons.join(' · ')}</p>
              </li>
            ))}
          </ul>
        )}
        {results.length > 20 && (
          <p className="more-hint">仅显示前 20 个推荐日期，共 {results.length} 个可选日期</p>
        )}
      </section>
        </>
      ) : null}
    </main>
  )
}

export default App
