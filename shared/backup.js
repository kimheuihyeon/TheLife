// LifeGame 통합 백업 — 모든 페이지의 사용자 입력을 파일 하나로 내보내고 가져옴
// 새 기능(페이지)을 만들어 저장소가 늘어나면 아래 두 목록에 한 줄씩만 추가하면 돼요.
window.LifeGameBackup = (() => {
  const VERSION = 1;

  // localStorage에 저장되는 사용자 데이터
  const LOCAL_KEYS = [
    'lifegame.web.v1',       // 인생·오늘·만다라트·여행·소지품·트로피
    'lifegame.wardrobe.v1',  // 옷장 (옷·신발·소품, 착용 기록)
    'lifegame.home.v1',      // 집 (냉장고·찬장, 소모품, 살 것)
  ];
  // IndexedDB에 저장되는 사진
  const IMAGE_DBS = [
    { db: 'lifegame-wardrobe', store: 'images' },  // 옷장 사진
  ];
  // OpenAI 키 같은 비밀값(lifegame.wardrobe.openai)은 일부러 목록에 넣지 않음 → 파일에 절대 안 들어감

  const NOTICE = 'lifegame.backup.notice';

  /* ── IndexedDB ── */
  const openDb = ({ db, store }) => new Promise((res, rej) => {
    const r = indexedDB.open(db, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(store)) r.result.createObjectStore(store); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  async function readAll(spec) {
    const db = await openDb(spec);
    return new Promise((res, rej) => {
      const out = [], t = db.transaction(spec.store, 'readonly');
      t.objectStore(spec.store).openCursor().onsuccess = (e) => {
        const c = e.target.result;
        if (c) { out.push([c.key, c.value]); c.continue(); }
      };
      t.oncomplete = () => { db.close(); res(out); };
      t.onerror = () => rej(t.error);
    });
  }
  async function replaceAll(spec, entries) {
    const db = await openDb(spec);
    return new Promise((res, rej) => {
      const t = db.transaction(spec.store, 'readwrite'), s = t.objectStore(spec.store);
      s.clear();
      entries.forEach(([k, v]) => s.put(v, k));
      t.oncomplete = () => { db.close(); res(); };
      t.onerror = () => rej(t.error);
    });
  }
  const toDataURL = (blob) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  const fromDataURL = async (url) => (await fetch(url)).blob();

  /* ── 내보내기 ── */
  async function exportAll() {
    const data = { app: 'LifeGame', version: VERSION, exportedAt: new Date().toISOString(), local: {}, images: {} };
    for (const key of LOCAL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw != null) { try { data.local[key] = JSON.parse(raw); } catch (e) { data.local[key] = raw; } }
    }
    for (const spec of IMAGE_DBS) {
      try {
        const entries = await readAll(spec);
        data.images[spec.db] = {};
        for (const [k, v] of entries) if (v instanceof Blob) data.images[spec.db][k] = await toDataURL(v);
      } catch (e) { /* 이 브라우저에 아직 사진 저장소가 없으면 건너뜀 */ }
    }
    const d = new Date(), pad = (n) => String(n).padStart(2, '0');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = `lifegame-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    const n = Object.values(data.images).reduce((s, m) => s + Object.keys(m).length, 0);
    return `기록 ${Object.keys(data.local).length}종류와 사진 ${n}장을 파일 하나로 내보냈어요`;
  }

  /* ── 가져오기 ── */
  // 예전 형식(메인만 내보낸 파일, 옷장만 내보낸 파일)도 알아서 변환
  function toBackup(obj) {
    if (obj && obj.app === 'LifeGame' && obj.local) return { kind: '전체 백업', data: obj };
    if (obj && !Array.isArray(obj) && (obj.birth || Array.isArray(obj.goals) || Array.isArray(obj.quests)))
      return { kind: '예전 메인 기록', data: { local: { 'lifegame.web.v1': obj }, images: {} } };
    const list = Array.isArray(obj) ? obj : (obj && Array.isArray(obj.items) ? obj.items : null);
    if (list && list.every((x) => x && x.name && x.category && x.id)) {
      const imgs = {};
      const items = list.map((x) => {
        const it = { ...x };
        if (typeof it.image === 'string' && it.image.startsWith('data:image')) { imgs[it.id] = it.image; it.img = true; }
        delete it.image;
        return it;
      });
      let log = (obj && Array.isArray(obj.log)) ? obj.log : null;
      if (!log) try { log = (JSON.parse(localStorage.getItem('lifegame.wardrobe.v1')) || {}).log || []; } catch (e) { log = []; }
      let hair = (obj && Array.isArray(obj.hair)) ? obj.hair : null;
      if (!hair) try { hair = (JSON.parse(localStorage.getItem('lifegame.wardrobe.v1')) || {}).hair || []; } catch (e) { hair = []; }
      let bag = (obj && obj.bag && typeof obj.bag === 'object') ? obj.bag : null;
      if (!bag) try { bag = (JSON.parse(localStorage.getItem('lifegame.wardrobe.v1')) || {}).bag || {}; } catch (e) { bag = {}; }
      Object.entries((obj && obj.bagImages) || {}).forEach(([id, url]) => { if (String(url).startsWith('data:image')) imgs['bag-' + id] = url; });
      return { kind: '옷장 기록(closet.json)', data: { local: { 'lifegame.wardrobe.v1': { items, log, hair, bag } }, images: { 'lifegame-wardrobe': imgs } } };
    }
    return null;
  }

  async function importFile(file) {
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch (e) { throw new Error('JSON 파일을 읽을 수 없어요.'); }
    const b = toBackup(parsed);
    if (!b) throw new Error('LifeGame에서 내보낸 백업 파일이 아니에요.');
    const when = b.data.exportedAt ? ` (${new Date(b.data.exportedAt).toLocaleString('ko-KR')})` : '';
    if (!confirm(`${b.kind}${when}을 가져올까요?\n파일에 들어 있는 항목은 지금 이 브라우저의 기록을 덮어써요. 되돌릴 수 없어요.`)) return false;

    for (const [key, val] of Object.entries(b.data.local || {})) {
      if (!LOCAL_KEYS.includes(key)) continue;  // 모르는 키나 비밀값은 무시
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
    let n = 0;
    for (const spec of IMAGE_DBS) {
      const m = (b.data.images || {})[spec.db];
      if (!m) continue;
      const entries = [];
      for (const [k, url] of Object.entries(m)) { try { entries.push([k, await fromDataURL(url)]); n++; } catch (e) {} }
      await replaceAll(spec, entries);
    }
    sessionStorage.setItem(NOTICE, `${b.kind}을 가져왔어요${n ? ` (사진 ${n}장)` : ''}`);
    location.reload();  // 모든 페이지가 새 데이터로 다시 그려지게
    return true;
  }

  // 가져온 뒤 새로고침된 페이지에서 한 번 보여줄 안내
  function takeNotice() {
    const m = sessionStorage.getItem(NOTICE);
    if (m) sessionStorage.removeItem(NOTICE);
    return m;
  }

  return { exportAll, importFile, takeNotice };
})();
