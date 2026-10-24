// LifeGame 공통 화면 틀 — 머리글·히어로·탭·바닥글·대화상자를 모든 페이지에 넣음
// 탭을 추가하거나 순서를 바꿀 땐 아래 TABS만 고치면 모든 페이지에 반영돼요.
(() => {
const TABS = [
  ['life', '인생', '../life/life.html'],
  ['today', '오늘', '../today/today.html'],
  ['mandala', '만다라트', '../mandala/mandala.html'],
  ['travel', '여행', '../travel/travel.html'],
  ['inv', '소지품', '../inventory/inventory.html'],
  ['wardrobe', '옷장', '../wardrobe/wardrobe.html'],
  ['trophy', '트로피', '../trophy/trophy.html'],
];

const ONBOARD = `<div class="onboard" id="onboard" hidden>
  <div class="card">
    <div class="brand"><i></i>LifeGame</div>
    <h1>100년의 시간을<br>점으로 펼쳐 봅니다.</h1>
    <p>생년월일을 입력하세요. 입력한 정보는 이 브라우저에만 저장되고, 어디에도 전송되지 않습니다.</p>
    <form class="row" id="onboardForm">
      <input type="date" id="onboardBirth" value="1990-01-01" required>
      <button class="btn" type="submit">시작하기</button>
    </form>
  </div>
</div>`;

const HEADER_HERO = `  <header>
    <a class="brand" href="../life/life.html"><i></i>LifeGame</a>
    <a href="https://github.com/kimheuihyeon/TheLife" id="repoLink">GitHub ↗</a>
  </header>

  <section class="hero">
    <div class="eyebrow">100년 중 지나온 시간</div>
    <div class="big"><span id="pct">0.000000</span><small>%</small></div>
    <p class="lede">
      오늘은 당신 인생의 <b class="today" id="dayNo">–</b>번째 날입니다.<br>
      100세까지 <b id="daysLeft">–</b>일이 남아 있습니다.<br>
      <span id="gameLine"></span>
    </p>
  </section>`;

const FOOTER = `  <footer>
    <span>데이터는 이 브라우저에만 저장됩니다.</span>
    <span style="display:inline-flex;gap:12px;align-items:center;flex-wrap:wrap">
      <label>생년월일 <input type="date" id="birthInput"></label>
      <button class="btn ghost" id="settingsBtn" type="button">능력치·데이터</button>
      <button class="btn ghost" id="resetBtn" type="button">초기화</button>
    </span>
  </footer>`;

const DIALOGS = `<dialog id="cellDlg">
  <form method="dialog">
    <h3 id="dlgTitle">칸 작성</h3>
    <textarea id="dlgText" rows="3" maxlength="40"></textarea>
    <div id="dlgSkWrap" hidden>
      <span class="lbl">스킬 분야</span>
      <select id="dlgSk" aria-label="스킬 분야" style="width:100%"></select>
    </div>
    <div class="row">
      <button class="btn ghost" id="toQuest" type="button">매일 퀘스트로 추가</button>
      <button class="btn ghost" value="cancel">취소</button>
      <button class="btn" value="ok">저장</button>
    </div>
  </form>
</dialog>

<dialog id="setDlg">
  <form method="dialog">
    <h3>능력치·데이터</h3>
    <span class="lbl">능력치 (최대 8개)</span>
    <ul class="statedit" id="statEdit"></ul>
    <button class="btn ghost" type="button" id="addStat">능력치 추가</button>
    <span class="lbl">분야</span>
    <p class="sub" style="margin:0 0 8px;font-size:13px">능력치마다 분야를 둬요. 세부 분야가 많으면 묶음(예: 법 &gt; 민법)으로 만들 수 있어요. 이름을 바꿔도 쌓인 경험치는 그대로예요.</p>
    <div id="skEdit"></div>
    <span class="lbl">데이터 옮기기</span>
    <p class="sub" style="margin:0;font-size:13px">기록은 이 브라우저에만 있어요. 내보내기를 하면 모든 탭과 옷장(사진 포함)이 파일 하나에 담겨요. 기기나 브라우저를 바꿀 땐 그 파일을 가져오세요.</p>
    <div class="row left">
      <button class="btn ghost" type="button" id="exportBtn">전체 내보내기</button>
      <button class="btn ghost" type="button" id="importBtn">전체 가져오기</button>
      <input type="file" id="importFile" accept="application/json" hidden>
    </div>
    <div class="row">
      <button class="btn ghost" value="cancel">닫기</button>
      <button class="btn" value="ok">저장</button>
    </div>
  </form>
</dialog>

<dialog id="itemDlg">
  <form method="dialog">
    <h3 id="itemTitle">물건 추가</h3>
    <div class="irow">
      <input type="text" id="iIcon" class="icon-in" maxlength="4" aria-label="아이콘">
      <input type="text" id="iName" placeholder="이름 (예: 러닝화)" maxlength="40" aria-label="이름">
    </div>
    <div class="iquick" id="iQuick"></div>
    <div class="igrid">
      <label>종류<select id="iKind"></select></label>
      <label>등급<select id="iTier"><option value="common">일반</option><option value="rare">희귀</option><option value="legend">전설</option></select></label>
      <label>상태<select id="iStatus"><option value="use">사용 중</option><option value="keep">보관 중</option><option value="gone">처분·양도</option><option value="wish">위시리스트</option></select></label>
      <label id="iGotWrap">얻은 날<input type="date" id="iGot"></label>
      <label id="iGoneWrap">처분한 날<input type="date" id="iGone"></label>
      <label>가격 (선택)<input type="number" id="iPrice" min="0" step="1" inputmode="numeric"></label>
      <label>능력치<select id="iStat"></select></label>
      <label>분야<select id="iSk"></select></label>
    </div>
    <label class="icheck"><input type="checkbox" id="iEquip"> 이 능력치에 장착</label>
    <textarea id="iMemo" rows="2" maxlength="120" placeholder="한 줄 메모"></textarea>
    <div class="row">
      <button class="btn ghost" type="button" id="iDelete">삭제</button>
      <button class="btn ghost" type="button" id="iGotIt">얻었어요</button>
      <button class="btn ghost" value="cancel" formnovalidate>취소</button>
      <button class="btn" value="ok">저장</button>
    </div>
  </form>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const page = document.body.dataset.page;
const tabs = '<nav class="tabs" aria-label="화면 전환">' +
  TABS.map(([id, name, href]) => `<a class="tab" href="${href}"${id === page ? ' aria-current="page"' : ''}>${name}</a>`).join('') +
  '</nav>';
document.getElementById('chrome-top').outerHTML = HEADER_HERO + '\n' + tabs;
document.getElementById('chrome-bottom').outerHTML = FOOTER;
document.body.insertAdjacentHTML('afterbegin', ONBOARD);
document.body.insertAdjacentHTML('beforeend', DIALOGS);
})();
