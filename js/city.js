/* city.js: routes, districts, buildings and props for the static world. */
(function (global) {
  'use strict';

  var Iso = global.Iso;

  /* ---- routes ------------------------------------------------------------ */

  function makeRoute(raw) {
    var pts = raw.map(function (p) { return { x: p[0], y: p[1], z: p[2] || 0 }; });
    var segs = [], total = 0, cum = [0];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var len = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
      segs.push({ a: a, b: b, len: len, cum: total });
      total += len;
      cum.push(total);
    }
    return {
      pts: pts, segs: segs, total: total, cum: cum,
      at: function (d) {
        if (d <= 0) {
          var s0 = segs[0];
          return { x: s0.a.x, y: s0.a.y, z: s0.a.z, dx: (s0.b.x - s0.a.x) / s0.len, dy: (s0.b.y - s0.a.y) / s0.len };
        }
        if (d >= total) {
          var sn = segs[segs.length - 1];
          return { x: sn.b.x, y: sn.b.y, z: sn.b.z, dx: (sn.b.x - sn.a.x) / sn.len, dy: (sn.b.y - sn.a.y) / sn.len };
        }
        for (var i = 0; i < segs.length; i++) {
          var s = segs[i];
          if (d <= s.cum + s.len) {
            var t = (d - s.cum) / s.len;
            return {
              x: s.a.x + (s.b.x - s.a.x) * t,
              y: s.a.y + (s.b.y - s.a.y) * t,
              z: s.a.z + (s.b.z - s.a.z) * t,
              dx: (s.b.x - s.a.x) / s.len,
              dy: (s.b.y - s.a.y) / s.len
            };
          }
        }
      }
    };
  }

  /* Waypoints. Indices marked below are used as station anchors. */
  var INTAKE = makeRoute([
    [-3, 5],        // 0 spawn, just off the plate. The prompt arrives from
                    //   outside the city, but the default view starts close on
                    //   the convoy, so a long run-in would open on empty ground
    [6, 5],         // 1 tokenizer docks
    [17, 5],        // 2 embedding foundry
    [28, 5],        // 3 positional beacon
    [38, 5],        // 4 corner
    [38, 11]        // 5 loop entry
  ]);

  var LOOP = makeRoute([
    [38, 11],       // 0 entry
    [34, 11],       // 1 pre-norm gate I
    [24, 11],       // 2 attention plaza
    [14, 11],       // 3 residual bridge I
    [9, 11],        // 4
    [7, 13],        // 5
    [7, 19],        // 6
    [9, 21],        // 7
    [14, 21],       // 8 pre-norm gate II
    [23, 21],       // 9 feed-forward mill
    [32, 21],       // 10 residual bridge II
    [37, 21],       // 11
    [39, 19],       // 12
    [39, 16],       // 13 layer counter arch
    [39, 13],       // 14
    [38, 11]        // 15 back to entry
  ]);

  var EXIT = makeRoute([
    [39, 16],       // 0 off the arch
    [43, 19],
    [43, 25],
    [41, 27],
    [36, 27],       // 4 final norm
    [27, 27],       // 5 vocabulary stadium
    [15, 27],       // 6 sampler
    [6, 27]         // 7 output plaza
  ]);

  var FEEDBACK = makeRoute([
    [6, 27, 0],
    [2.5, 27, 0.5],
    [2.5, 24, 3],
    [2.5, 10, 3],
    [2.5, 7, 1.4],
    [4.2, 5, 0.3],
    [6, 5, 0]
  ]);

  /* `dwell` is how long the convoy waits once you have already read this
     district's explanation. The much longer first-visit stop is derived from
     the length of that explanation; see readSeconds() below. */
  function station(route, idx, id, dwell) {
    return { dist: route.cum[idx], id: id, dwell: dwell == null ? 0.8 : dwell };
  }

  var STATIONS = {
    intake: [
      station(INTAKE, 1, 'tokenize', 1.6),
      station(INTAKE, 2, 'embed', 1.4),
      station(INTAKE, 3, 'position', 1.2)
    ],
    loop: [
      station(LOOP, 1, 'norm1', 0.6),
      station(LOOP, 2, 'attn', 2.6),
      station(LOOP, 3, 'res1', 0.5),
      station(LOOP, 8, 'norm2', 0.5),
      station(LOOP, 9, 'ffn', 1.6),
      station(LOOP, 10, 'res2', 0.5),
      station(LOOP, 13, 'layer', 0.7)
    ],
    exit: [
      station(EXIT, 4, 'finalnorm', 1.0),
      station(EXIT, 5, 'logits', 2.6),
      station(EXIT, 6, 'sample', 2.8),
      station(EXIT, 7, 'emit', 2.0)
    ],
    feedback: [
      station(FEEDBACK, 3, 'feedback', 1.2)
    ]
  };

  /* ---- palette ----------------------------------------------------------- */

  /* A printed-diagram palette: muted, low-chroma hues that stay legible on a
     pale ground and read as ink rather than light. */
  var C = {
    steel:  '#4a7a9b',
    violet: '#6f63a8',
    ochre:  '#c2913c',
    stone:  '#7d8b96',
    rose:   '#b05470',
    sage:   '#6d9068',
    teal:   '#3f8a86',
    orange: '#c07a3c',
    brick:  '#a85a44',
    moss:   '#5f8a52',
    plum:   '#8b5f96',
    ink:    '#4a4540',
    paper:  '#e5e1d5',
    road:   '#c9c4b6',
    roadTop:'#d8d3c6'
  };

  /* ---- districts (clickable, narrated) ----------------------------------- */

  var DISTRICTS = [
    {
      id: 'tokenize', name: '토크나이저 독', x: 6, y: 5, r: 4.2, color: C.steel,
      tag: '텍스트 → 토큰',
      short: '프롬프트는 모델이 보기 전에 토큰으로 잘립니다.',
      body: '언어 모델은 글자나 단어를 보지 않습니다. 고정된 어휘 사전의 ID, 보통 5만~20만 개의 조각을 봅니다. 자주 쓰이는 단어는 토큰 하나이고, 드문 단어는 조각으로 부서집니다. 선행 공백도 토큰의 일부입니다(여기서는 ·로 표시). 여기 프롬프트는 도로로 도착해 번호가 찍힌 크레이트로 독을 떠납니다.'
    },
    {
      id: 'embed', name: '임베딩 주조소', x: 17, y: 5, r: 4.2, color: C.violet,
      tag: '토큰 → 벡터',
      short: '각 토큰 ID는 벡터, 즉 의미 공간의 한 점이 됩니다.',
      body: '토큰 ID는 거대한 임베딩 테이블의 한 행을 가리킵니다. 그 행이 곧 벡터입니다. 주조소를 지나면 철자 정보는 모두 사라지고, 모델은 숫자만 다루게 됩니다. 이 도시는 토큰당 12개 숫자를 쓰므로 여러분이 볼 수 있고, GPT급 모델은 4,000~16,000개를 씁니다.'
    },
    {
      id: 'position', name: '위치 신호등', x: 28, y: 5, r: 4.2, color: C.ochre,
      tag: '내가 어디인가',
      short: '어텐션에는 순서 감각이 없기 때문에 순서를 벡터에 stamp 합니다.',
      body: '어텐션은 순열에 둔합니다. 위치 신호가 없으면 "개가 사람을 물었다"와 "사람이 개를 물었다"가 문자 그대로 같은 입력이 됩니다. 신호등은 사인 위치 코드를 더합니다(실제 모델은 대신 벡터를 회전시키는 RoPE를 쓰기도 합니다). 서로 다른 주파수가 "바로 옆"과 "먼 거리"를 모두 읽게 해 줍니다.'
    },
    {
      id: 'norm', name: '사전 정규화 관문', x: 34, y: 11, r: 3.2, color: C.stone,
      tag: 'LayerNorm',
      short: '모든 서브 레이어에 들어가기 전에 벡터를 다시 중심화·재스케일합니다.',
      body: 'LayerNorm은 벡터 전체에서 평균을 빼고 표준편차로 나눈 다음 학습된 게인을 곱합니다. 다음 블록이 다룰 수 있는 범위로 활성값을 유지하고, 수십 층을 지나며 폭발하는 것을 막습니다. 최근 트랜스포머는 각 서브 레이어 *앞*에서 정규화하므로 "pre-norm"이라는 이름이 붙었습니다.'
    },
    {
      id: 'attn', name: '어텐션 광장', x: 24, y: 11, r: 5, color: C.rose,
      tag: '토큰이 토큰을 본다',
      short: '현재 토큰이 이전 모든 토큰에 질의하고, 찾은 것을 섞습니다.',
      body: '세 개의 하위 정류장이 벡터를 Query, Key, Value로 투영합니다. Query는 캐시의 모든 토큰 Key와 점수를 매기고, softmax는 그 점수를 합이 1인 가중치로 바꾸며, 출력은 Value의 가중 합입니다. 창고 위로 아치형으로 보이는 빛이 바로 지금 계산 중인 실제 가중치입니다. 여기서는 헤드 2개가 병렬로 돌아가고, 실제 모델은 32개 이상을 돌려 각자 다른 무언가를 찾습니다.'
    },
    {
      id: 'cache', name: 'KV 캐시 창고', x: 24, y: 16, r: 5, color: C.sage,
      tag: '과거의 기억',
      short: '지금까지의 모든 토큰에 대한 Key와 Value를, 다시 계산하지 않으려고 저장해 둡니다.',
      body: '토큰마다 사일로가 하나씩 있습니다. 이게 없으면 500번째 단어를 생성할 때 그 앞의 499개 토큰을 모든 층에서 다시 처리해야 합니다. 있으면 새 토큰은 자기 Key와 Value만 계산하고 나머지는 캐시에서 읽습니다. 그래서 긴 문맥이 점점 비싸지는 것입니다. 창고는 토큰 수와 층 수에 비례해 자라고, GPU 메모리에 올라가 있습니다.'
    },
    {
      id: 'res', name: '잔차 다리', x: 14, y: 11, r: 3.2, color: C.teal,
      tag: '우회 차선',
      short: '서브 레이어는 벡터를 대체하지 않고 더해 넣습니다.',
      body: '모든 서브 레이어 출력은 자기 입력에 *더해서* 되돌립니다. 그래서 독부터 출력까지 끊기지 않는 도로, 잔차 스트림이 흐릅니다. 각 블록은 그 흐름 위에 보정값을 적어 넣을 뿐, 흐름 자체를 새로 짓지 않습니다. 이것이 100층짜리 네트워크도 학습 가능한 이유입니다.'
    },
    {
      id: 'ffn', name: '피드포워드 공방', x: 23, y: 21, r: 4.6, color: C.orange,
      tag: '혼자 생각한다',
      short: '확장하고, 비선형을 적용하고, 다시 좁힙니다. 토큰끼리는 섞지 않습니다.',
      body: '중간에 GELU 하나가 낀 두 행렬입니다. 여기서는 12 → 24 → 12, 실제 모델은 보통 4배 확장입니다. 어텐션과 달리 이 단계는 다른 토큰을 보지 않습니다. 각 토큰이 고립되어 처리됩니다. 트랜스포머 파라미터의 약 3분의 2가 이런 공방 안에 있고, 모델이 "아는" 것의 상당 부분이 여기 저장됩니다.'
    },
    {
      id: 'layer', name: '층 계산 아치', x: 39, y: 16, r: 3, color: C.brick,
      tag: '×N 블록',
      short: '전체 링이 매번 다른 가중치로 반복됩니다.',
      body: '이것은 코드상의 루프가 아닙니다. 각자 다른 가중치를 가진 블록들의 스택입니다. 작은 모델은 12개, 큰 모델은 80개 이상을 쌓습니다. 대체로 앞쪽 층은 국소적·통사적 구조를 풀고 뒤쪽 층은 더 추상적이고 작업 수준의 특징을 다루며, 잔차 스트림이 그 사이를 계속 전달합니다.'
    },
    {
      id: 'finalnorm', name: '마지막 정규화', x: 36, y: 27, r: 3, color: C.stone,
      tag: '마지막 정리',
      short: '벡터를 점수로 바꾸기 전 정규화를 한 번 더 합니다.',
      body: '마지막 블록을 지나면 잔차 스트림이 마지막 LayerNorm을 거쳐, 출력 헤드가 잘 스케일된 벡터를 받습니다. 작은 단계지만 건너뛰면 분포가 망가지니 필수입니다.'
    },
    {
      id: 'logits', name: '어휘 스타디움', x: 27, y: 27, r: 5, color: C.moss,
      tag: '토큰별 점수',
      short: '벡터가 어휘 사전의 모든 토큰과 비교됩니다.',
      body: '마지막 벡터에 unembedding 행렬을 곱해 어휘의 모든 토큰에 대한 원점수, 즉 logit을 하나씩 만듭니다. Softmax는 그 행 전체를 확률 분포로 바꿉니다. 여기서 각 탑은 후보 하나이고 높이가 그 후보의 확률입니다. 모델이 만들어 내는 것은 답이 아니라 분포라는 점에 주목하세요.'
    },
    {
      id: 'sample', name: '샘플러', x: 15, y: 27, r: 4.4, color: C.plum,
      tag: '온도 & top-p',
      short: '분포를 다시 모양내리고 주사위를 굴립니다.',
      body: '온도는 softmax에 들어가기 전 logit을 나눕니다. 1 미만이면 가장 안전한 토큰 쪽으로 봉우리를 날카롭게 만들고, 1 초과면 봉우리를 평평하게 해 롱샷도 통과시킵니다. Top-p(핵 샘플링)는 확률이 이미 p에 도달할 때까지의 최단 후보만 남기고 꼬리를 잘라냅니다. 그다음 남은 것 중 하나를 무작위로 뽑기 때문에 같은 프롬프트도 답이 달라질 수 있습니다.'
    },
    {
      id: 'emit', name: '출력 광장', x: 6, y: 27, r: 4, color: C.steel,
      tag: '하나의 토큰이 나간다',
      short: '선택된 토큰이 텍스트에 이어 붙여지고 전광판에 표시됩니다.',
      body: '토큰 하나가 도시를 떠납니다. 흔히 단어의 한 조각일 뿐입니다. 여러분이 지켜본 모든 것, 도시 전체가 이 한 조각 하나를 만들기 위해 한 번 돌아간 것입니다. 스트리밍 출력은 정확히 이겁니다. 토큰이 한 번에 하나씩 도착하는 과정이요.'
    },
    {
      id: 'feedback', name: '되먹임 고속도로', x: 2.5, y: 16, r: 3.5, color: C.brick,
      tag: '자기회귀',
      short: '새 토큰이 다시 독으로 달려가고 도시 전체가 다시 돕니다.',
      body: '출력이 입력에 이어 붙여지고, 모델은 다음 토큰을 위해 처음부터 다시 돕니다. 이것이 "자기회귀"의 의미입니다. 그래서 생성은 엄격히 순차적이고, 속도는 초당 토큰 수로 따지며, 모델은 광장을 떠난 토큰을 다시 고칠 수 없습니다.'
    }
  ];

  /* The pre-norm gate and the residual bridge each appear twice per block, so
     clone their pick/zone targets onto the second location. */
  [['norm', 14, 21], ['res', 32, 21]].forEach(function (c) {
    var src = DISTRICTS.filter(function (d) { return d.id === c[0]; })[0];
    var clone = Object.create(src);
    clone.x = c[1]; clone.y = c[2];
    DISTRICTS.push(clone);
  });

  var DISTRICT_BY_ID = {};
  DISTRICTS.forEach(function (d) { DISTRICT_BY_ID[d.id] = d; });

  /* stage ids that map onto a shared district */
  var STAGE_TO_DISTRICT = {
    norm1: 'norm', norm2: 'norm', res1: 'res', res2: 'res'
  };

  /* How long to hold the convoy the first time you reach a district, so the
     panel copy can actually be read. ~230 words per minute, plus a beat to
     take in the city before starting and a beat after finishing. */
  function readSeconds(stageId) {
    var d = DISTRICT_BY_ID[STAGE_TO_DISTRICT[stageId] || stageId];
    if (!d) return 9;
    var words = (d.short + ' ' + d.body).split(/\s+/).length;
    return Math.min(26, Math.max(9, words / 3.8 + 3.5));
  }

  Object.keys(STATIONS).forEach(function (route) {
    STATIONS[route].forEach(function (st) { st.read = readSeconds(st.id); });
  });

  /* ---- geometry helpers -------------------------------------------------- */

  var ALL_ROUTES = [INTAKE, LOOP, EXIT, FEEDBACK];

  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function distToRoutes(x, y) {
    var best = 1e9;
    for (var r = 0; r < ALL_ROUTES.length; r++) {
      var segs = ALL_ROUTES[r].segs;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        var d = distToSegment(x, y, s.a.x, s.a.y, s.b.x, s.b.y);
        if (d < best) best = d;
      }
    }
    return best;
  }

  function distToDistricts(x, y) {
    var best = 1e9;
    for (var i = 0; i < DISTRICTS.length; i++) {
      var d = DISTRICTS[i];
      var v = Math.hypot(x - d.x, y - d.y) - d.r;
      if (v < best) best = v;
    }
    return best;
  }

  /* ---- landmark buildings ------------------------------------------------ */

  var buildings = [];

  function put(o) { buildings.push(o); return o; }

  function landmark(cx, cy, opts) {
    put({
      x: cx - opts.w / 2, y: cy - opts.d / 2, z: opts.z || 0,
      w: opts.w, d: opts.d, h: opts.h,
      color: opts.color, kind: opts.kind || 'box',
      windows: opts.windows !== false ? { cols: opts.cols || 3, rows: opts.rows || Math.max(2, Math.round(opts.h * 1.3)), seed: (cx * 31 + cy * 17) | 0, color: opts.lit || '#ffe1a3' } : null,
      accent: opts.accent, tag: opts.tag, glow: opts.glow
    });
  }

  function buildLandmarks() {
    /* Tokenizer Docks */
    landmark(4.2, 3.0, { w: 3.4, d: 2.2, h: 2.6, color: '#b9c9d4', cols: 4, lit: C.steel });
    landmark(8.0, 3.2, { w: 2.2, d: 2.0, h: 4.2, color: '#aabecd', cols: 2, lit: C.steel });
    landmark(4.6, 7.6, { w: 4.6, d: 2.4, h: 1.6, color: '#c3d0d9', cols: 5, lit: C.steel });
    landmark(8.6, 7.4, { w: 2.0, d: 2.0, h: 2.2, color: '#b9c9d4', cols: 2, lit: C.steel });
    /* gantry crane over the road */
    put({ kind: 'crane', x: 6, y: 5, color: C.steel });

    /* Embedding Foundry */
    landmark(15.4, 2.8, { w: 3.0, d: 2.6, h: 3.4, color: '#c4bedb', cols: 3, lit: C.violet });
    landmark(19.2, 3.0, { w: 2.4, d: 2.4, h: 2.2, color: '#b6afd0', cols: 2, lit: C.violet });
    landmark(16.0, 7.6, { w: 3.6, d: 2.2, h: 2.0, color: '#cec9e0', cols: 4, lit: C.violet });
    put({ kind: 'foundry', x: 19.4, y: 7.2, color: C.violet });

    /* Positional Beacon */
    put({ kind: 'beacon', x: 28, y: 2.6, color: C.ochre });
    landmark(25.0, 7.6, { w: 2.6, d: 2.2, h: 1.8, color: '#ddc79a', cols: 3, lit: C.ochre });
    landmark(30.6, 7.4, { w: 2.4, d: 2.2, h: 2.6, color: '#ddc79a', cols: 3, lit: C.ochre });
    landmark(31.6, 2.8, { w: 2.2, d: 2.2, h: 3.0, color: '#d3bb8b', cols: 2, lit: C.ochre });

    /* Pre-norm gates (two, same design) */
    /* Structures the road runs through are registered one piece at a time, so
       each pillar sorts on its own depth. A single key for the whole gate puts
       the near pillar behind a vehicle that should be passing under it. */
    function straddleGate(gx, gy) {
      put({ kind: 'gatePost', x: gx, y: gy - 1.7, color: C.stone });
      put({ kind: 'gateBeam', x: gx, y: gy, color: C.stone });
      put({ kind: 'gatePost', x: gx, y: gy + 1.7, color: C.stone });
    }

    straddleGate(34, 11);
    straddleGate(14, 21);

    /* Attention Plaza: Q / K / V substations around a roundabout */
    put({ kind: 'plaza', x: 24, y: 11, color: C.rose });
    landmark(21.4, 8.4, { w: 1.8, d: 1.8, h: 3.2, color: '#d6aebb', cols: 2, lit: C.rose, tag: 'Q' });
    landmark(24.0, 8.0, { w: 1.8, d: 1.8, h: 3.9, color: '#d6aebb', cols: 2, lit: C.rose, tag: 'K' });
    landmark(26.6, 8.4, { w: 1.8, d: 1.8, h: 3.2, color: '#d6aebb', cols: 2, lit: C.rose, tag: 'V' });

    /* Residual bridges */
    put({ kind: 'bridge', x: 14, y: 11, color: C.teal });
    put({ kind: 'bridge', x: 32, y: 21, color: C.teal });

    /* Feed-forward mill */
    put({ kind: 'mill', x: 23, y: 21, color: C.orange });
    landmark(19.6, 23.6, { w: 2.4, d: 2.0, h: 2.4, color: '#dcc6a0', cols: 3, lit: C.ochre });
    landmark(26.6, 23.6, { w: 2.6, d: 2.0, h: 2.0, color: '#dcc6a0', cols: 3, lit: C.ochre });

    /* Layer counter arch */
    put({ kind: 'archPillar', x: 37.35, y: 16, color: C.brick });
    put({ kind: 'archBeam',   x: 39.00, y: 16, color: C.brick });
    put({ kind: 'archPillar', x: 40.65, y: 16, color: C.brick });

    /* Final norm */
    straddleGate(36, 27);

    /* Vocabulary stadium */
    put({ kind: 'stadium', x: 27, y: 27, color: C.moss });

    /* Sampler */
    put({ kind: 'sampler', x: 15, y: 27, color: C.plum });

    /* Output plaza jumbotron */
    put({ kind: 'jumbotron', x: 6, y: 27, color: C.steel });
  }

  /* ---- filler city ------------------------------------------------------- */

  var FILLER_BLOCKS = [
    { x0: 12, y0: 7.6, x1: 33, y1: 9.2, density: 0.5, hMin: 0.8, hMax: 2.2 },
    { x0: 41, y0: 3, x1: 45, y1: 12, density: 0.55, hMin: 1.0, hMax: 4.5 },
    { x0: 6, y0: 23.2, x1: 38, y1: 25.6, density: 0.5, hMin: 0.9, hMax: 2.6 },
    { x0: 10, y0: 12.6, x1: 37, y1: 14.4, density: 0.35, hMin: 0.6, hMax: 1.6 },
    { x0: 10, y0: 17.8, x1: 37, y1: 19.6, density: 0.35, hMin: 0.6, hMax: 1.6 },
    { x0: 32, y0: 29.4, x1: 44, y1: 33, density: 0.5, hMin: 0.8, hMax: 3.0 },
    { x0: 8, y0: 30.0, x1: 20, y1: 33, density: 0.42, hMin: 0.8, hMax: 2.4 },
    { x0: 0.5, y0: 8, x1: 5.0, y1: 24, density: 0.3, hMin: 0.6, hMax: 1.8 },
    { x0: 0.5, y0: 0.5, x1: 10, y1: 2.0, density: 0.4, hMin: 0.8, hMax: 2.6 }
  ];

  /* Facades and roof tiles in the register the game uses: cream render, brick,
     stucco and painted board, with terracotta or slate on top. */
  var FILLER_COLORS = [
    '#e3d8bd', '#d3bb98', '#c08a72', '#b0c2d2', '#cdd3bb', '#e0cfae', '#a9b8a2', '#d8c3b0'
  ];
  var ROOF_COLORS = ['#a05340', '#6d737b', '#8c4636', '#57616d', '#7d6350', '#94503f'];

  function buildFiller() {
    for (var b = 0; b < FILLER_BLOCKS.length; b++) {
      var blk = FILLER_BLOCKS[b];
      for (var x = blk.x0; x < blk.x1 - 1; x += 1.9) {
        for (var y = blk.y0; y < blk.y1 - 1; y += 1.9) {
          var n = Iso.hash2(x * 10, y * 10, b + 5);
          if (n > blk.density) continue;
          var jx = x + Iso.hash2(x * 3, y * 7, 1) * 0.35;
          var jy = y + Iso.hash2(x * 5, y * 11, 2) * 0.35;
          if (distToRoutes(jx + 0.6, jy + 0.6) < 2.1) continue;
          if (distToDistricts(jx + 0.6, jy + 0.6) < 0.6) continue;
          var h = blk.hMin + Iso.hash2(x * 13, y * 3, 4) * (blk.hMax - blk.hMin);
          var w = 0.9 + Iso.hash2(x, y, 8) * 0.5;
          var d = 0.9 + Iso.hash2(x, y, 9) * 0.5;
          /* Low blocks get a pitched roof; anything tall enough to read as a
             tower gets a flat roof with plant on it. */
          var pitched = h < 2.0;
          buildings.push({
            x: jx, y: jy, z: 0, w: w, d: d, h: h, filler: true,
            color: FILLER_COLORS[Math.floor(Iso.hash2(x, y, 12) * FILLER_COLORS.length)],
            roof: pitched ? ROOF_COLORS[Math.floor(Iso.hash2(x, y, 31) * ROOF_COLORS.length)] : null,
            roofH: 0.34 + Iso.hash2(x, y, 33) * 0.3,
            rooftop: !pitched,
            windows: { cols: 2, rows: Math.max(1, Math.round(h * 1.6)), seed: (jx * 71 + jy * 37) | 0 }
          });
        }
      }
    }
  }

  /* ---- props ------------------------------------------------------------- */

  var props = [];

  function buildProps() {
    /* street lamps along the main routes */
    ALL_ROUTES.forEach(function (route, ri) {
      var step = 5.4;
      for (var d = step; d < route.total; d += step) {
        var p = route.at(d);
        if (p.x < 0 || p.x > 46) continue;
        var nx = -p.dy, ny = p.dx;
        props.push({ kind: 'lamp', x: p.x + nx * 1.35, y: p.y + ny * 1.35, z: p.z, side: 1, route: ri });
        props.push({ kind: 'lamp', x: p.x - nx * 1.35, y: p.y - ny * 1.35, z: p.z, side: -1, route: ri });
      }
    });

    /* trees in the leftover interior of the ring */
    for (var x = 9; x < 38; x += 1.5) {
      for (var y = 12.4; y < 20; y += 1.5) {
        if (Math.abs(y - 16) < 1.6) continue;            // silo row
        if (distToRoutes(x, y) < 2.0) continue;
        var n = Iso.hash2(x * 9, y * 9, 21);
        if (n > 0.22) continue;
        props.push({ kind: 'tree', x: x, y: y, z: 0, s: 0.75 + n });
      }
    }
    /* a few parks elsewhere */
    for (x = 20; x < 34; x += 1.4) {
      for (y = 29.6; y < 33; y += 1.4) {
        if (Iso.hash2(x * 4, y * 4, 33) > 0.3) continue;
        props.push({ kind: 'tree', x: x, y: y, z: 0, s: 0.8 });
      }
    }
  }

  /* ---- dynamic anchors --------------------------------------------------- */

  /* The cache row sits inside the layer ring and wraps onto further rows as
     the context grows; 3 rows × 18 silos covers the longest prompt we tokenize. */
  var SILO_X0 = 10.8, SILO_STEP = 1.55, SILO_MAX = 18, SILO_Y = 15.2, SILO_ROW = 1.75;

  function siloPos(i) {
    var row = Math.floor(i / SILO_MAX);
    return { x: SILO_X0 + (i % SILO_MAX) * SILO_STEP, y: SILO_Y + row * SILO_ROW };
  }

  var TOWER_X0 = 20.4, TOWER_STEP = 1.95, TOWER_Y = 30.6;

  function towerPos(i) {
    return { x: TOWER_X0 + i * TOWER_STEP, y: TOWER_Y };
  }

  /* ---- build ------------------------------------------------------------- */

  var built = false;
  function build() {
    if (built) return;
    built = true;
    buildLandmarks();
    buildFiller();
    buildProps();
    buildings.sort(function (a, b) {
      return (a.x + a.y + (a.w || 0) * 0.5 + (a.d || 0) * 0.5) - (b.x + b.y + (b.w || 0) * 0.5 + (b.d || 0) * 0.5);
    });
  }

  global.City = {
    GW: 46, GH: 34,
    routes: { intake: INTAKE, loop: LOOP, exit: EXIT, feedback: FEEDBACK },
    stations: STATIONS,
    districts: DISTRICTS,
    districtById: DISTRICT_BY_ID,
    stageToDistrict: STAGE_TO_DISTRICT,
    buildings: buildings,
    props: props,
    palette: C,
    siloPos: siloPos, SILO_MAX: SILO_MAX,
    towerPos: towerPos,
    distToRoutes: distToRoutes,
    build: build
  };
})(window);
