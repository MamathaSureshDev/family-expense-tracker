import { useEffect, useMemo, useState } from 'react'
import { Download, Plus, Trash2, Wallet, Users, CalendarDays, RefreshCw, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { isConfigured, supabase } from './lib/supabase'

type Expense = {
  id: string
  title: string
  amount: number
  paid_by: string
  expense_date: string
  category: string
  split_between: string[]
  notes: string | null
  created_at: string
}
const PEOPLE = ['Manjula', 'Mamatha', 'Mahesh']
const CATEGORIES = ['Food', 'Groceries', 'Transport', 'Bills', 'Shopping', 'Health', 'Travel', 'Other']
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('Mamatha')
  const [date, setDate] = useState(today())
  const [category, setCategory] = useState('Food')
  const [splitBetween, setSplitBetween] = useState<string[]>([...PEOPLE])
  const [notes, setNotes] = useState('')
  const [month, setMonth] = useState(today().slice(0, 7))
  const [selectedPayer, setSelectedPayer] = useState('All')
  const [sortKey, setSortKey] = useState<'expense_date' | 'title' | 'category' | 'paid_by' | 'split_between' | 'amount'>('expense_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [saving, setSaving] = useState(false)

  async function loadExpenses() {
    if (!isConfigured) { setLoading(false); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setExpenses((data ?? []) as Expense[])
    setLoading(false)
  }
  useEffect(() => { void loadExpenses() }, [])

  const monthExpenses = useMemo(() => expenses.filter(e => e.expense_date.startsWith(month)), [expenses, month])
  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const selectedPayerTotal = selectedPayer === 'All' ? monthTotal : monthExpenses.filter(e => e.paid_by === selectedPayer).reduce((sum, e) => sum + Number(e.amount), 0)
  const selectedPayerCount = selectedPayer === 'All' ? monthExpenses.length : monthExpenses.filter(e => e.paid_by === selectedPayer).length
  const sortedMonthExpenses = useMemo(() => [...monthExpenses].sort((a, b) => {
    let comparison = 0
    if (sortKey === 'amount') comparison = Number(a.amount) - Number(b.amount)
    else if (sortKey === 'split_between') comparison = (a.split_between || []).join(', ').localeCompare((b.split_between || []).join(', '))
    else if (sortKey === 'expense_date') comparison = a.expense_date.localeCompare(b.expense_date)
    else comparison = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection === 'asc' ? comparison : -comparison
  }), [monthExpenses, sortKey, sortDirection])
  function changeSort(key: typeof sortKey) {
    if (sortKey === key) setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDirection(key === 'expense_date' || key === 'amount' ? 'desc' : 'asc') }
  }
  function sortIcon(key: typeof sortKey) {
    if (sortKey !== key) return <ArrowUpDown size={12} />
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }
  const totalAll = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const balances = useMemo(() => {
    const result: Record<string, number> = Object.fromEntries(PEOPLE.map(p => [p, 0]))
    for (const e of expenses) {
      const split = Array.isArray(e.split_between) && e.split_between.length ? e.split_between : [...PEOPLE]
      const share = Number(e.amount) / split.length
      result[e.paid_by] = (result[e.paid_by] ?? 0) + Number(e.amount)
      for (const p of split) result[p] = (result[p] ?? 0) - share
    }
    return result
  }, [expenses])

  async function addExpense(ev: React.FormEvent) {
    ev.preventDefault()
    setNotice('')
    const amountNum = Number(amount)
    if (!title.trim() || !Number.isFinite(amountNum) || amountNum <= 0 || splitBetween.length === 0) {
      setError('Enter a description, a valid amount, and at least one person to split with.')
      return
    }
    setSaving(true); setError('')
    const { error } = await supabase.from('expenses').insert({
      title: title.trim(), amount: amountNum, paid_by: paidBy, expense_date: date,
      category, split_between: splitBetween, notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setTitle(''); setAmount(''); setNotes(''); setDate(today()); setCategory('Food'); setSplitBetween([...PEOPLE])
    setNotice('Expense saved for everyone.')
    await loadExpenses()
  }

  async function deleteExpense(expense: Expense) {
    if (!window.confirm(`Delete "${expense.title}" (${money(Number(expense.amount))})?`)) return
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    if (error) setError(error.message)
    else { setNotice('Expense deleted.'); await loadExpenses() }
  }

  function exportCsv() {
    const rows = [['Date','Description','Category','Amount INR','Paid by','Split between','Notes'],
      ...expenses.map(e => [e.expense_date, e.title, e.category, String(e.amount), e.paid_by, (e.split_between || []).join('; '), e.notes || ''])]
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `family-expenses-${today()}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return <main className="page">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Wallet size={22} /></div><div><p className="eyebrow">HOUSEHOLD MONEY</p><h1>Family expenses</h1></div></div>
      <button className="button button-light" onClick={exportCsv} disabled={!expenses.length}><Download size={16}/> Export CSV</button>
    </header>

    {!isConfigured && <section className="setup-warning"><AlertTriangle size={19}/><div><strong>One-time setup needed</strong><p>Open <code>src/lib/supabase.ts</code> in your GitHub repository and add your Supabase Project URL and publishable key. Then commit the change.</p></div></section>}
    {error && <div className="message error">{error}</div>}
    {notice && <div className="message success">{notice}</div>}

    <section className="welcome"><div><p className="eyebrow">YOUR SHARED FAMILY LEDGER</p><h2>Simple spending, <em>clear balances.</em></h2><p>Track shared costs for Manjula, Mamatha and Mahesh in one place.</p></div><div className="people-chip"><Users size={17}/><span>3 family members</span></div></section>

    <section className="stats">
      <article className="stat-card"><span className="stat-icon"><Wallet size={18}/></span><p>Total recorded</p><strong>{money(totalAll)}</strong><small>All recorded expenses</small></article>
      <article className="stat-card"><span className="stat-icon peach"><CalendarDays size={18}/></span><p>This month</p><strong>{money(monthTotal)}</strong><small>{monthExpenses.length} expense{monthExpenses.length === 1 ? '' : 's'}</small></article>
      <article className="stat-card"><span className="stat-icon blue"><Users size={18}/></span><p>People sharing</p><strong>03</strong><small>Equal split by default</small></article>
    </section>

    <div className="content-grid">
      <section className="panel add-panel">
        <div className="section-heading"><div><p className="eyebrow">NEW ENTRY</p><h3>Add an expense</h3></div><span className="plus-mark"><Plus size={19}/></span></div>
        <form onSubmit={addExpense}>
          <label>Description<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monthly groceries" required maxLength={120}/></label>
          <div className="two-col">
            <label>Amount (₹)<input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required/></label>
            <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} required/></label>
          </div>
          <div className="two-col">
            <label>Paid by<select value={paidBy} onChange={e => setPaidBy(e.target.value)}>{PEOPLE.map(p => <option key={p}>{p}</option>)}</select></label>
            <label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <fieldset><legend>Split equally between</legend><div className="people-select">{PEOPLE.map(p => <label className="check-person" key={p}><input type="checkbox" checked={splitBetween.includes(p)} onChange={e => setSplitBetween(old => e.target.checked ? [...old, p] : old.filter(x => x !== p))}/><span>{p}</span></label>)}</div><small>Each selected person shares the expense equally.</small></fieldset>
          <label>Notes <span className="optional">(optional)</span><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything else to remember?"/></label>
          <button className="button button-primary full" type="submit" disabled={!isConfigured || saving}>{saving ? 'Saving…' : <><Plus size={17}/> Save expense</>}</button>
        </form>
      </section>

      <section className="panel history-panel">
        <div className="section-heading"><div><p className="eyebrow">OVERVIEW</p><h3>Expense history</h3></div><button className="icon-button" onClick={() => void loadExpenses()} title="Refresh"><RefreshCw size={17}/></button></div>
        <div className="filter-row table-filters"><label>Monthly view<input type="month" value={month} onChange={e => setMonth(e.target.value)}/></label><label>Show total paid by<select value={selectedPayer} onChange={e => setSelectedPayer(e.target.value)}><option value="All">All family members</option>{PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}</select></label><span>{monthExpenses.length} entries</span></div>
        <div className="payer-total-card"><div><span>{selectedPayer === 'All' ? 'Total paid by everyone' : `Total paid by ${selectedPayer}`}</span><strong>{money(selectedPayerTotal)}</strong><small>{selectedPayerCount} expense{selectedPayerCount === 1 ? '' : 's'} in the selected month</small></div><div className="payer-total-icon"><Wallet size={19}/></div></div>
        <p className="sort-hint">Click a column heading to sort the table.</p>
        <div className="expense-table-wrap">
          {loading ? <div className="empty-state">Loading shared expenses…</div> :
            monthExpenses.length === 0 ? <div className="empty-state"><div className="empty-icon"><CalendarDays size={22}/></div><strong>No expenses this month</strong><p>Add the first entry using the form.</p></div> :
            <table className="expense-table">
              <thead><tr>{([['expense_date','Date'],['title','Description'],['category','Category'],['paid_by','Paid by'],['split_between','Split between'],['amount','Amount']] as const).map(([key, label]) => <th key={key} className={key === 'amount' ? 'amount-cell' : undefined}><button className="sort-button" onClick={() => changeSort(key)}>{label}{sortIcon(key)}</button></th>)}<th>Action</th></tr></thead>
              <tbody>{sortedMonthExpenses.map(e => <tr key={e.id}>
                <td>{new Date(e.expense_date + 'T12:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td className="description-cell">{e.title}{e.notes && <small>{e.notes}</small>}</td>
                <td>{e.category}</td>
                <td>{e.paid_by}</td>
                <td>{(e.split_between || []).join(', ') || 'Manjula, Mamatha, Mahesh'}</td>
                <td className="amount-cell">{money(Number(e.amount))}</td>
                <td><button className="delete-button" onClick={() => void deleteExpense(e)} aria-label={`Delete ${e.title}`} title="Delete expense"><Trash2 size={15}/></button></td>
              </tr>)}</tbody>
            </table>
          }
        </div>
        <div className="list-footer"><span>Showing {monthExpenses.length} of {expenses.length} expenses</span><span>Stored online <span className="online-dot"></span></span></div>
      </section>
    </div>

    <section className="panel balances-panel"><div className="section-heading"><div><p className="eyebrow">FAIR SHARE</p><h3>Family balances</h3></div><span className="balance-note">Based on all recorded expenses</span></div>
      <div className="balance-grid">{PEOPLE.map(p => <div className="balance-person" key={p}><div className="avatar">{p[0]}</div><div className="balance-info"><strong>{p}</strong><span>Net balance</span></div><strong className={balances[p] > 0.005 ? 'positive' : balances[p] < -0.005 ? 'negative' : 'neutral'}>{balances[p] > 0.005 ? '+' : ''}{money(balances[p])}</strong></div>)}</div>
      <p className="balance-footnote">Positive means they paid more than their share; negative means they owe their share. These are net balances, not automatic transfers.</p>
    </section>
    <footer>Made for your family · Amounts in Indian Rupees (₹) · <button onClick={() => void loadExpenses()}>Refresh data</button></footer>
  </main>
}
