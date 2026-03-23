// Periodic Labs 뉴스 앱

const CURATED_NEWS = [
  {
    id: 1,
    title: "Periodic Labs, AI 과학자 개발 위해 $300M 시드 투자 유치",
    summary: "전 OpenAI VP Liam Fedus와 Google DeepMind 출신 Ekin Cubuk이 공동 창립한 Periodic Labs가 a16z, Nvidia, Accel, Jeff Bezos 등으로부터 사상 최대 규모인 3억 달러 시드 투자를 유치했다. 기업가치는 $1.5B 이상으로 평가됐다.",
    source: "TechCrunch",
    date: "2025-09-30",
    category: "funding",
    url: "https://techcrunch.com/2025/09/30/former-openai-and-deepmind-researchers-raise-whopping-300m-seed-to-automate-science/"
  },
  {
    id: 2,
    title: "AI로 과학 연구를 자동화한다: Periodic Labs의 미션",
    summary: "Periodic Labs는 로봇이 물리적 실험을 수행하고 데이터를 수집하며 반복 학습하는 자율 실험실을 구축한다. 첫 번째 목표는 실온 초전도체 개발로, 이를 통해 더 효율적인 칩과 전력망 인프라 구현이 가능해질 것으로 전망된다.",
    source: "SiliconANGLE",
    date: "2025-10-01",
    category: "tech",
    url: "https://siliconangle.com/2025/10/01/periodic-labs-raises-300m-accelerate-scientific-research-with-ai/"
  },
  {
    id: 3,
    title: "Liam Fedus: ChatGPT 설계자에서 AI 과학자 창업자로",
    summary: "OpenAI에서 ChatGPT 개발을 이끌고 최초의 1조 파라미터 신경망을 만든 Liam Fedus가 Periodic Labs를 창립했다. 그는 OpenAI를 떠난 전직 임원들의 창업 열풍 중 가장 주목받는 인물 중 하나다.",
    source: "Tech Funding News",
    date: "2025-09-28",
    category: "people",
    url: "https://techfundingnews.com/ex-openai-execs-raise-200m-at-1b-valuation-for-ai-materials-science-startup-backed-by-a16z/"
  },
  {
    id: 4,
    title: "Periodic Labs, AI 소재 과학 플랫폼으로 $300M 유치 보도",
    summary: "MLQ.ai 보도에 따르면, Periodic Labs는 AI 기반 소재 과학 플랫폼 구축을 위해 $300M을 유치했다. 회사는 공개 웹이 아닌 자체 실험실 데이터로 AI 모델을 학습시켜 기존 알고리즘 대비 더 효과적인 연구 수행을 목표로 한다.",
    source: "MLQ.ai",
    date: "2025-10-02",
    category: "funding",
    url: "https://mlq.ai/news/periodic-labs-reportedly-raises-300m-for-ai-powered-materials-science-platform/"
  },
  {
    id: 5,
    title: "Ekin Cubuk: GNoME 공동 개발자가 Periodic Labs 합류",
    summary: "Google DeepMind에서 소재 및 화학 팀을 이끌며 AI 소재 발견 모델 GNoME를 공동 개발한 Ekin Cubuk가 Periodic Labs 공동창업자로 합류했다. Meta, Databricks, Samsung 출신의 20여 명 연구원들도 함께한다.",
    source: "TechBuzz.ai",
    date: "2025-09-30",
    category: "people",
    url: "https://www.techbuzz.ai/articles/periodic-labs-raises-record-300m-seed-to-build-ai-scientists"
  },
  {
    id: 6,
    title: "OpenAI 출신 스타트업 생태계: $42B 투자 유치",
    summary: "Periodic Labs는 전 OpenAI 임직원이 창업한 스타트업 물결의 일부다. Anthropic, Thinking Machines Lab 등 전 OpenAI 출신들이 설립한 회사들에는 현재까지 총 420억 달러 이상이 투자됐다.",
    source: "SalesTools AI",
    date: "2025-10-03",
    category: "general",
    url: "https://salestools.io/en/report/periodic-labs-raises-300m-series-a"
  },
  {
    id: 7,
    title: "Periodic Labs Series A: $300M, 기업가치 $2B",
    summary: "Periodic Labs가 Series A 라운드에서 $300M을 추가로 유치해 기업가치가 $2B에 달하는 것으로 보고됐다. 회사는 자율 분말 합성 실험실 운영에 필요한 로봇 인프라와 AI 모델 개발에 투자를 집중하고 있다.",
    source: "SalesTools AI",
    date: "2025-10-10",
    category: "funding",
    url: "https://salestools.io/en/report/periodic-labs-300m-series-a"
  },
  {
    id: 8,
    title: "AI 과학 자동화 경쟁 가열: Periodic Labs vs. 경쟁사",
    summary: "Tetsuwan Scientific, Future House, 토론토대학 가속 컨소시엄 등 유사한 목표를 가진 기업들이 늘어나고 있지만, Periodic Labs는 엘리트 인재와 대규모 자금을 결합한 유일한 조합을 갖추고 있다는 평가를 받는다.",
    source: "TechCrunch",
    date: "2025-10-01",
    category: "tech",
    url: "https://techcrunch.com/2025/09/30/former-openai-and-deepmind-researchers-raise-whopping-300m-seed-to-automate-science/"
  }
];

const CATEGORY_LABELS = {
  funding: '투자/펀딩',
  tech: '기술/연구',
  people: '인물',
  general: '일반'
};

let currentFilter = 'all';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderCuratedNews() {
  const feed = document.getElementById('newsFeed');
  feed.innerHTML = '';

  CURATED_NEWS.forEach(item => {
    const card = document.createElement('article');
    card.className = `news-card${currentFilter !== 'all' && item.category !== currentFilter ? ' hidden' : ''}`;
    card.dataset.category = item.category;

    card.innerHTML = `
      <div class="card-meta">
        <span class="card-source">${item.source}</span>
        <span class="card-dot">·</span>
        <span class="card-date">${formatDate(item.date)}</span>
        <span class="card-category cat-${item.category}">${CATEGORY_LABELS[item.category]}</span>
      </div>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-summary">${item.summary}</p>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link">원문 보기</a>
    `;

    feed.appendChild(card);
  });
}

async function fetchHackerNews() {
  const hnFeed = document.getElementById('hnFeed');

  try {
    const queries = ['Periodic Labs', 'Liam Fedus', 'materials science AI'];
    const results = [];

    for (const query of queries) {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`
      );
      if (!res.ok) continue;
      const data = await res.json();
      results.push(...data.hits);
    }

    // 중복 제거 및 점수 순 정렬
    const seen = new Set();
    const unique = results
      .filter(h => {
        if (seen.has(h.objectID)) return false;
        seen.add(h.objectID);
        return true;
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    if (unique.length === 0) {
      hnFeed.innerHTML = '<div class="empty-state">HackerNews에서 관련 토론을 찾을 수 없습니다.</div>';
      return;
    }

    hnFeed.innerHTML = '';
    unique.forEach((hit, i) => {
      const item = document.createElement('div');
      item.className = 'hn-item';

      const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const date = new Date(hit.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

      item.innerHTML = `
        <span class="hn-rank">${i + 1}</span>
        <div class="hn-content">
          <div class="hn-title"><a href="${url}" target="_blank" rel="noopener noreferrer">${hit.title}</a></div>
          <div class="hn-meta">
            <span class="hn-score">▲ ${hit.points || 0}점</span>
            <span>${hit.num_comments || 0}개 댓글</span>
            <span>${date}</span>
            <a href="https://news.ycombinator.com/item?id=${hit.objectID}" target="_blank" rel="noopener noreferrer">토론 보기</a>
          </div>
        </div>
      `;

      hnFeed.appendChild(item);
    });

  } catch (err) {
    hnFeed.innerHTML = '<div class="empty-state">HackerNews 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
  }
}

function setStatus(text, type = '') {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status-badge' + (type ? ` ${type}` : '');
}

function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  el.textContent = new Date().toLocaleString('ko-KR');
}

async function refresh() {
  const icon = document.querySelector('.refresh-icon');
  icon.classList.add('spinning');
  setStatus('업데이트 중...');

  document.getElementById('hnFeed').innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <span>HackerNews에서 검색 중...</span>
    </div>
  `;

  renderCuratedNews();
  await fetchHackerNews();

  icon.classList.remove('spinning');
  setStatus(`뉴스 ${CURATED_NEWS.length}건`, 'ok');
  updateLastUpdated();
}

// 필터 버튼 이벤트
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;

    document.querySelectorAll('.news-card').forEach(card => {
      if (currentFilter === 'all' || card.dataset.category === currentFilter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// 새로고침 버튼
document.getElementById('refreshBtn').addEventListener('click', refresh);

// 초기 로드
refresh();
