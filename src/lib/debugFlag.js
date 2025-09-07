export function isSupabaseDebugEnabled() {
  try {
    const params = new URLSearchParams(window.location.search)
    if ((params.get('debug') || '').toLowerCase() === 'supabase') return true
    if ((window.location.hash || '').toLowerCase().includes('debug')) return true
    if (localStorage.getItem('debugSupabase') === '1') return true
  } catch (_) { /* no-op in non-browser */ }
  return false
}

