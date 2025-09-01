import { useMemo, useState, useEffect } from 'react'
import { Search, Star, Copy, Share2, Filter, ChevronDown, Flame, Swords } from 'lucide-react'
import { supabase } from './lib/supabaseClient.js'

/**
 * OW Custom Codes Explorer — Tailwind + lucide-react（改訂版）
 * 変更点:
 * - タグ行が多すぎる問題 → 横スクロール＋「すべて表示/折りたたむ」トグル、空タグ除外
 * - コピーのボタン撤去 → コード箱クリックでコピー（トースト＆コピー済表示）
 * - コピー数をLocalStorageに蓄積 → ソート「コピー数」追加、カードにカウント表示
 */

// ------------------------------ サンプルデータ（Supabase未設定時のフォールバック）
const ROLES = ['Any','Tank','DPS','Support']
const MODES = ['Aim','Movement','Scrim','Fun','VOD','Other']

const seedCodes = [
  {
    id: 'tracer-flick', code: 'ABCD12', title: 'Tracer フリック練習 (HS優先)',
    desc: 'HS優先の近距離フリック。距離可変・速度ランダム。',
    heroes: ['Tracer'], maps: ['Workshop Chamber'], role: 'DPS', mode: 'Aim',
    tags: ['flick','hs','close-range'], author: 'noon', updated: '2025-08-28'
  },
  {
    id: 'rein-shield', code: 'Z9Y8X7', title: 'ラインハルト 盾管理ドリル',
    desc: '盾割りと角待ちの判断反復。HP通知/音声キュー付き。',
    heroes: ['Reinhardt'], maps: ["King's Row"], role: 'Tank', mode: 'Scrim',
    tags: ['shield','corner','macro'], author: 'noon', updated: '2025-08-20'
  },
  {
    id: 'ana-nade', code: 'N4D3E2', title: 'アナ グレネード軌道練習 (Ilios)',
    desc: '固定セット＆自由投擲。命中評価とCD管理。',
    heroes: ['Ana'], maps: ['Ilios'], role: 'Support', mode: 'Aim',
    tags: ['nade','lineup','support'], author: 'suzu', updated: '2025-08-15'
  },
  {
    id: 'widow-parkour', code: 'QW12ER', title: 'ウィドウ移動+エイム複合',
    desc: 'グラップ移動ルートとHSチェックを同時に。',
    heroes: ['Widowmaker'], maps: ['Workshop Chamber'], role: 'DPS', mode: 'Movement',
    tags: ['grapple','routes','combo'], author: 'k', updated: '2025-07-30'
  },
]

// ------------------------------ ユーティリティ
// タグ一覧は実データから作成

function copy(text){
  navigator.clipboard?.writeText(text)
}

function toast(msg){
  const el = document.createElement('div')
  el.textContent = msg
  el.className = 'simple-toast'
  document.body.appendChild(el)
  setTimeout(()=> el.remove(), 1400)
}

// ひらがな・カタカナを区別しない検索用正規化
function normalizeKana(input){
  if(!input) return ''
  // NFKCで全角/半角等を正規化し、英数は小文字化
  const s = input.normalize('NFKC').toLowerCase()
  // カタカナ -> ひらがな（Unicode: 0x30A1-0x30F6 → 0x3041-0x3096）
  return Array.from(s).map(ch => {
    const code = ch.codePointAt(0)
    if(code>=0x30A1 && code<=0x30F6){
      return String.fromCodePoint(code - 0x60)
    }
    return ch
  }).join('')
}

function Meta({label, value}){
  return (
    <div className="d-flex align-items-center gap-2">
      <span className="text-secondary">{label}</span>
      <ChevronDown className="icon-12" style={{opacity:0.6, transform:'rotate(90deg)'}}/>
      <span className="text-truncate" title={value}>{value}</span>
    </div>
  )
}

// ------------------------------ アプリ本体（Tailwind UI）
export default function App(){
  // コピー回数の永続化
  const LS_COPY = 'copyCounts_v1'
  const LS_LIKES = 'likes_v1'
  const loadCopy = () => {
    try { return JSON.parse(localStorage.getItem(LS_COPY) || '{}') } catch { return {} }
  }
  const loadLikes = () => {
    try { return JSON.parse(localStorage.getItem(LS_LIKES) || '{}') } catch { return {} }
  }
  const saveCopy = (m) => localStorage.setItem(LS_COPY, JSON.stringify(m))
  const saveLikes = (m) => localStorage.setItem(LS_LIKES, JSON.stringify(m))

  const [copyCounts, setCopyCounts] = useState(loadCopy)
  useEffect(() => { saveCopy(copyCounts) }, [copyCounts])
  const [likedIds, setLikedIds] = useState(loadLikes)
  useEffect(() => { saveLikes(likedIds) }, [likedIds])

  // Supabase 認証・データ
  const [user, setUser] = useState(null)
  const [codes, setCodes] = useState(seedCodes)
  const [likeCounts, setLikeCounts] = useState({}) // {code_id: number}
  const [userLiked, setUserLiked] = useState({}) // {code_id: true}
  const supaReady = !!supabase

  useEffect(()=>{
    if(!supaReady) return
    supabase.auth.getSession().then(({ data })=> setUser(data?.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session)=>{
      setUser(session?.user ?? null)
    })
    return ()=> { sub?.subscription?.unsubscribe?.() }
  },[supaReady])

  // 初回ロード: コードといいね集計
  useEffect(()=>{
    if(!supaReady) return
    ;(async()=>{
      const { data: codeRows, error: e1 } = await supabase
        .from('codes')
        .select('id, code, title, desc, heroes, maps, role, mode, tags, author, updated')
        .order('updated', { ascending: false })
      if(!e1 && codeRows) setCodes(codeRows)

      const { data: allLikes, error: e2 } = await supabase
        .from('likes')
        .select('code_id')
      if(!e2 && allLikes){
        const cnt = {}
        for(const row of allLikes){ cnt[row.code_id] = (cnt[row.code_id]||0)+1 }
        setLikeCounts(cnt)
      }
    })()
  },[supaReady])

  // ユーザーのいいね
  useEffect(()=>{
    if(!supaReady || !user) return
    ;(async()=>{
      const { data, error } = await supabase
        .from('likes')
        .select('code_id')
        .eq('user_id', user.id)
      if(!error && data){
        const map = {}
        for(const r of data) map[r.code_id] = true
        setUserLiked(map)
      }
    })()
  },[supaReady, user])

  const [q, setQ]   = useState('')
  const [role, setRole] = useState('Any')
  const [mode, setMode] = useState('')
  const [tag, setTag]   = useState('')
  const [sort, setSort] = useState('copies') // 'updated' | 'likes' | 'copies'
  const [copiedId, setCopiedId] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)

  const allTags = useMemo(() => Array.from(new Set((codes||[]).flatMap(c => c.tags || []))).filter(Boolean).sort(), [codes])
  const tagsToShow = useMemo(() => showAllTags ? allTags : allTags.slice(0, 12), [showAllTags, allTags])

  const filtered = useMemo(()=>{
    const terms = normalizeKana(q.trim()).split(/\s+/).filter(Boolean)
    const base = codes
      .filter(i => role==='Any' ? true : i.role===role)
      .filter(i => !mode ? true : i.mode===mode)
      .filter(i => !tag ? true : i.tags.includes(tag))
      .filter(i => {
        if(terms.length===0) return true
        const hay = [i.title,i.desc,i.code,i.author,(i.tags||[]),(i.heroes||[]),(i.maps||[]),i.role,i.mode].flat().join(' ')
        const hayNorm = normalizeKana(hay)
        return terms.every(t => hayNorm.includes(t))
      })
    const likeCount = (x)=> supaReady ? (likeCounts[x.id]||0) : ((likedIds[x.id]?1:0))
    const byLikes = (a,b)=> likeCount(b) - likeCount(a)
    const byUpdated = (a,b)=> b.updated.localeCompare(a.updated)
    const byCopies = (a,b)=> (copyCounts[b.id]||0) - (copyCounts[a.id]||0)
    const sorter = sort==='likes'? byLikes : sort==='updated'? byUpdated : byCopies
    return [...base].sort(sorter)
  },[q,role,mode,tag,sort,copyCounts,likedIds, codes, supaReady, likeCounts])

  // 関連候補（検索語のいずれかを含む OR マッチ、フィルタ条件は緩める）
  const related = useMemo(()=>{
    const terms = normalizeKana(q.trim()).split(/\s+/).filter(Boolean)
    if(terms.length===0) return []
    const likeCount = (x)=> supaReady ? (likeCounts[x.id]||0) : ((likedIds[x.id]?1:0))
    const score = (x)=> likeCount(x)*2 + (copyCounts[x.id]||0)
    const matches = codes.filter(i => {
      const hayNorm = normalizeKana([i.title,i.desc,i.code,i.author,(i.tags||[]),(i.heroes||[]),(i.maps||[]),i.role,i.mode].flat().join(' '))
      return terms.some(t => hayNorm.includes(t))
    })
    return matches
      .sort((a,b)=> score(b)-score(a))
      .slice(0,6)
  },[q,copyCounts,likedIds, codes, supaReady, likeCounts])

  function handleCopy(id, text){
    copy(text)
    setCopiedId(id)
    setCopyCounts(m => ({ ...m, [id]: (m[id]||0) + 1 }))
    toast('コピーしました: ' + text)
    setTimeout(()=> setCopiedId(''), 1400)
  }

  async function toggleLike(id){
    if(!supaReady || !user){
      setLikedIds(m => ({ ...m, [id]: !m[id] }))
      return
    }
    const liked = !!userLiked[id]
    if(liked){
      const { error } = await supabase.from('likes').delete().match({ user_id: user.id, code_id: id })
      if(error){ toast('エラー: いいね解除失敗'); return }
      setUserLiked(m=>{ const n={...m}; delete n[id]; return n })
      setLikeCounts(m=> ({...m, [id]: Math.max(0, (m[id]||0)-1)}))
    } else {
      const { error } = await supabase.from('likes').insert({ user_id: user.id, code_id: id })
      if(error){
        if(error.code==='23505'){ /* duplicate */ }
        else { toast('エラー: いいね失敗'); }
        return
      }
      setUserLiked(m=> ({...m, [id]: true}))
      setLikeCounts(m=> ({...m, [id]: (m[id]||0)+1}))
    }
  }

  // コード登録（最小）
  const [newCode, setNewCode] = useState({ code:'', title:'' })
  async function addCode(){
    if(!supaReady || !user){ toast('ログインが必要です'); return }
    const payload = { code: newCode.code.trim(), title: newCode.title.trim(), desc: '', role:'Any', mode:'Other', tags: [], heroes: [], maps: [], author: user.email || 'user', updated: new Date().toISOString().slice(0,10) }
    if(!payload.code || !payload.title){ toast('コードとタイトルは必須'); return }
    const { data, error } = await supabase.from('codes').insert({ ...payload, created_by: user.id }).select().single()
    if(error){
      if(error.code==='23505') toast('既に登録済みのコードです')
      else toast('登録に失敗しました')
      return
    }
    setCodes(curr => [data, ...curr])
    setNewCode({ code:'', title:'' })
    toast('登録しました')
  }

  async function loginWithEmail(email){
    if(!supaReady){ toast('Supabase未設定です'); return }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if(error) toast('送信に失敗しました')
    else toast('ログインリンクを送信しました')
  }
  async function logout(){ if(supaReady){ await supabase.auth.signOut(); toast('ログアウトしました') } }

  return (
    <div className="min-vh-100 text-light app-gradient">
      {/* ナビゲーション */}
      <nav className="navbar navbar-dark bg-dark sticky-top border-bottom border-secondary-subtle">
        <div className="container py-2 d-flex align-items-center gap-2">
          <Swords className="icon-20" style={{color:'#38bdf8'}}/>
          <div className="fw-bolder">OW Custom Codes</div>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="d-none d-sm-inline small text-secondary">beta</span>
            {supaReady && (
              user ? (
                <>
                  <span className="small text-secondary d-none d-md-inline">{user.email}</span>
                  <button className="btn btn-sm btn-outline-light" onClick={logout}>ログアウト</button>
                </>
              ) : (
                <EmailLogin onSubmit={loginWithEmail} />
              )
            )}
          </div>
        </div>
      </nav>

      {/* コントロールバー */}
      <header className="container py-4 d-flex flex-column gap-3">
        <div className="d-flex flex-column flex-md-row gap-3">
          {/* search */}
          <label className="position-relative flex-1 w-100">
            <Search className="icon-16 position-absolute" style={{left:'12px', top:'50%', transform:'translateY(-50%)', opacity:0.6}}/>
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="検索：タイトル/説明/ヒーロー/マップ/タグ/コード"
              className="form-control ps-5"
            />
          </label>

          {/* role */}
          <div className="d-flex align-items-center gap-2">
            <span className="d-none d-md-inline text-secondary small"><Filter className="icon-16 me-1"/>Role</span>
            <select value={role} onChange={e=>setRole(e.target.value)} className="form-select">
              {ROLES.map(r=> <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* mode */}
          <div className="d-flex align-items-center gap-2">
            <span className="d-none d-md-inline text-secondary small">Mode</span>
            <select value={mode} onChange={e=>setMode(e.target.value)} className="form-select">
              <option value="">All</option>
              {MODES.map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* sort */}
          <div className="d-flex align-items-center gap-2">
            <span className="d-none d-md-inline text-secondary small">Sort</span>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="form-select">
              <option value="copies">コピー数</option>
              <option value="updated">新しい順</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </div>

        {/* tags: 横スクロール + トグル */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary small">Tags:</span>
          <div className="position-relative flex-1 overflow-auto text-nowrap no-scrollbar pe-2">
            <button onClick={()=>setTag('')}
             className={`btn btn-sm rounded-pill me-2 ${tag===''? 'btn-primary' : 'btn-outline-secondary'}`}
            >All</button>


            {tagsToShow.map(t=> (
              <button key={t} onClick={()=>setTag(t)}
                className={`btn btn-sm rounded-pill me-2 ${tag===t? 'btn-primary' : 'btn-outline-secondary'}`}>#{t}
              </button>
            ))}

          </div>
          {allTags.length>12 && (
            <button onClick={()=>setShowAllTags(v=>!v)} className="flex-shrink-0 btn btn-sm btn-outline-secondary">
              {showAllTags? '折りたたむ' : 'すべて表示'}
            </button>
          )}
        </div>
      </header>

      {/* グリッド */}
      <main className="container pb-4">
        {supaReady && user && (
          <div className="card bg-body-tertiary border-0 my-3">
            <div className="card-body d-flex gap-2 align-items-end">
              <div className="flex-grow-1">
                <label className="form-label mb-1">コード</label>
                <input className="form-control" value={newCode.code} onChange={e=> setNewCode(v=>({...v, code: e.target.value}))} placeholder="例: ABCD12"/>
              </div>
              <div className="flex-grow-1">
                <label className="form-label mb-1">タイトル</label>
                <input className="form-control" value={newCode.title} onChange={e=> setNewCode(v=>({...v, title: e.target.value}))} placeholder="タイトル"/>
              </div>
              <button className="btn btn-primary" onClick={addCode}>登録</button>
            </div>
          </div>
        )}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
        {filtered.map(item => (
          <article key={item.id} className="col">
            <div className="card h-100 bg-dark text-light border border-secondary-subtle">
              <div className="card-body d-flex flex-column gap-2">
                <div className="d-flex align-items-start gap-3">
                  <div className="flex-1 w-100">
                    <h3 className="h6 fw-semibold mb-1 line-clamp-2">
                    {item.title}
                    </h3>
                    <p className="mb-0 small text-secondary line-clamp-2">{item.desc}</p>
                  </div>
                  <div className="d-inline-flex align-items-center gap-3 flex-shrink-0">
                    <span title="コピー数" className="d-inline-flex align-items-center gap-1" style={{color:'#7dd3fc'}}>
                      <Copy className="icon-16"/> {(copyCounts[item.id]||0)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
                      aria-pressed={supaReady ? !!userLiked[item.id] : !!likedIds[item.id]}
                      aria-label={(supaReady ? !!userLiked[item.id] : !!likedIds[item.id]) ? 'いいね解除' : 'いいね'}
                      onClick={()=> toggleLike(item.id)}
                    >
                      <Star className="icon-16" style={{fill: (supaReady ? !!userLiked[item.id] : !!likedIds[item.id]) ? '#f7ce68' : 'transparent'}}/>
                      { supaReady ? (likeCounts[item.id]||0) : ((likedIds[item.id]?1:0)) }
                    </button>
                  </div>
                </div>

                <div className="row row-cols-2 g-2 small text-secondary">
                  <div><Meta label="Hero" value={item.heroes.join(', ')} /></div>
                  <div><Meta label="Map" value={item.maps.join(', ')} /></div>
                  <div><Meta label="Role" value={item.role} /></div>
                  <div><Meta label="Mode" value={item.mode} /></div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {item.tags.map(t=> <span key={t} className="badge rounded-pill bg-secondary-subtle text-dark">#{t}</span>)}
                </div>

                <div className="mt-1 small text-secondary">更新 {item.updated}{item.author? ` ・ by ${item.author}`:''}</div>

                <div className="mt-2 d-flex align-items-center gap-2">
                  {/* コードは箱をクリックでコピー（ボタンは撤去） */}
                  <button
                    onClick={()=> handleCopy(item.id, item.code)}
                    title="クリックでコードをコピー"
                    className={`btn btn-sm d-inline-flex align-items-center gap-2 ${copiedId===item.id? 'btn-outline-success' : 'btn-outline-light'}`}
                  >
                    <code className="me-1">{item.code}</code>
                    <span className="small opacity-75">{copiedId===item.id? 'コピー済' : 'クリックでコピー'}</span>
                  </button>

                  <button
                    onClick={()=>{
                      const url = location.href.split('#')[0] + '#' + item.id
                      navigator.clipboard?.writeText(url)
                      toast('共有リンクをコピー')
                    }}
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  >
                    <Share2 className="icon-16"/> 共有
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {filtered.length===0 && (
          <>
            <div className="col-12 text-center text-secondary py-4">該当するカスタムコードが見つかりませんでした。</div>
            {related.length>0 && (
              <>
                <div className="col-12 text-secondary">関連候補</div>
                {related.map(item => (
                  <article key={item.id} className="col">
                    <div className="card h-100 bg-dark text-light border border-secondary-subtle">
                      <div className="card-body d-flex flex-column gap-2">
                        <div className="d-flex align-items-start gap-3">
                          <div className="flex-1 w-100">
                            <h3 className="h6 fw-semibold mb-1 line-clamp-2">{item.title}</h3>
                            <p className="mb-0 small text-secondary line-clamp-2">{item.desc}</p>
                          </div>
                          <div className="d-inline-flex align-items-center gap-3 flex-shrink-0">
                            <span title="コピー数" className="d-inline-flex align-items-center gap-1" style={{color:'#7dd3fc'}}>
                              <Copy className="icon-16"/> {(copyCounts[item.id]||0)}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
                              aria-pressed={!!likedIds[item.id]}
                              aria-label={likedIds[item.id] ? 'いいね解除' : 'いいね'}
                              onClick={()=> toggleLike(item.id)}
                            >
                              <Star className="icon-16" style={{fill: likedIds[item.id] ? '#f7ce68' : 'transparent'}}/>
                              { (item.likes || 0) + (likedIds[item.id] ? 1 : 0) }
                            </button>
                          </div>
                        </div>
                        <div className="row row-cols-2 g-2 small text-secondary">
                          <div><Meta label="Hero" value={item.heroes.join(', ')} /></div>
                          <div><Meta label="Map" value={item.maps.join(', ')} /></div>
                          <div><Meta label="Role" value={item.role} /></div>
                          <div><Meta label="Mode" value={item.mode} /></div>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {item.tags.map(t=> <span key={t} className="badge rounded-pill bg-secondary-subtle text-dark">#{t}</span>)}
                        </div>
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <button
                            onClick={()=> handleCopy(item.id, item.code)}
                            title="クリックでコードをコピー"
                            className={`btn btn-sm d-inline-flex align-items-center gap-2 ${'btn-outline-light'}`}
                          >
                            <code className="me-1">{item.code}</code>
                            <span className="small opacity-75">クリックでコピー</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </>
            )}
          </>
        )}
        </div>
      </main>

      {/* フッター */}
      <footer className="container pb-4 small text-secondary d-flex align-items-center gap-2">
        <Flame className="icon-12"/> Overwatch™ fan-made content — use at your own risk.
      </footer>
    </div>
  )
}

// メールログインの簡易フォーム
function EmailLogin({ onSubmit }){
  const [email, setEmail] = useState('')
  return (
    <form className="d-flex gap-2" onSubmit={(e)=>{ e.preventDefault(); onSubmit?.(email) }}>
      <input type="email" required className="form-control form-control-sm" placeholder="メールアドレス" value={email} onChange={e=> setEmail(e.target.value)} />
      <button className="btn btn-sm btn-outline-light" type="submit">ログイン</button>
    </form>
  )
}
