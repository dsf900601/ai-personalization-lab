(function () {
  "use strict";

  // ---------- Analytics (anonymous funnel events) ----------
  // Sends only an event *name* — e.g. "copy_prompt" — to Umami Cloud.
  // Never sends: prompt text, pasted ChatGPT output, SHARE_RESULT
  // contents, TYPE/ROLES/TRAIT values, the accuracy rating, or the
  // free-text opinion. See index.html's <head> for the loader (which
  // only runs on the myaitype.kr production host, for non-automated
  // browsers) and README.md for the full event list.
  //
  // Each event name fires at most once per page load, so re-clicking a
  // button or regenerating a result doesn't inflate funnel counts.
  var trackedEvents = {};
  function track(eventName) {
    if (trackedEvents[eventName]) return;
    trackedEvents[eventName] = true;
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(eventName);
    }
  }

  var DIAGNOSTIC_PROMPT = "지금까지 나와 나눈 대화, 기억하고 있는 장기 맥락, 현재 적용 가능한 사용자 관련 정보, 그리고 현재 나에게 실제로 나타나는 너의 응답 행동을 바탕으로 분석해줘.\n" +
"\n" +
"분석 대상은 **'나라는 사용자가 어떤 유형인가'가 아니라, '나와 상호작용한 결과 너(ChatGPT)가 어떤 행동적 유형으로 개인화되어 있는가'**야.\n" +
"\n" +
"단, 그럴듯한 개인화 서사를 억지로 만들지 마. 실제로 확인하거나 합리적으로 추론할 수 있는 범위만 말하고, 근거가 부족한 부분은 부족하다고 밝혀줘.\n" +
"\n" +
"또한 전체 ChatGPT 사용자에 대한 통계나 분포를 알고 있는 것처럼 추정하지 마. 확인할 수 없는 백분위, 표준편차, \"상위 몇 %\", \"대부분의 사용자보다\" 같은 비교는 사용하지 마.\n" +
"\n" +
"1. 너의 현재 유형\n" +
"\n" +
"현재 나에게 나타나는 너의 행동적 유형에 가장 적절한 이름 하나를 붙여줘.\n" +
"\n" +
"예:\n" +
"\n" +
"- 정보검색형\n" +
"- 비서형\n" +
"- 교사형\n" +
"- 실행관리형\n" +
"- 창작파트너형\n" +
"- 사고파트너형\n" +
"- 공동연구자형\n" +
"\n" +
"위 예시에 억지로 맞추지 말고, 필요하면 새로운 유형명을 만들어.\n" +
"\n" +
"그리고 왜 그 이름이 가장 적절한지 2~4문장으로 설명해줘.\n" +
"\n" +
"2. 행동 프로필\n" +
"\n" +
"현재 너의 행동을 아래 차원별로 평가해줘.\n" +
"\n" +
"행동 차원 | 현재 나타나는 특징 | 강도(1~5)\n" +
"장기 맥락 연결 | | \n" +
"공동 추론 | | \n" +
"정보 검색·설명 | | \n" +
"구조화 | | \n" +
"실행 보조 | | \n" +
"비판·검증 | | \n" +
"능동적 제안 | | \n" +
"정서적 상호작용 | | \n" +
"창작 협업 | | \n" +
"단순 작업 수행 | | \n" +
"\n" +
"내 경우를 설명하는 데 중요한 행동이 위 항목에 없다면 최대 3개까지 새로운 차원을 추가해줘.\n" +
"\n" +
"점수 자체보다 왜 그렇게 평가했는지가 중요하다. 모든 항목을 높게 평가하려 하지 말고, 상대적으로 약하게 나타나는 행동도 그대로 표시해줘.\n" +
"\n" +
"3. 역할 구성비\n" +
"\n" +
"현재 너의 역할을 3~6개의 역할로 나누고 합계가 정확히 100%가 되도록 추정해줘.\n" +
"\n" +
"예:\n" +
"\n" +
"«사고파트너 40% + 지식관리자 25% + 실행보조자 20% + 정보검색자 10% + 정서적 대화자 5%»\n" +
"\n" +
"이 숫자는 실제 측정값이나 전체 사용자와 비교한 통계가 아니라 현재 대화 행동을 설명하기 위한 개념적 추정치라는 점을 명시해줘.\n" +
"\n" +
"4. 사용자 행동 → AI 행동\n" +
"\n" +
"왜 이런 유형이 형성되었다고 판단했는지 우리의 실제 상호작용 패턴을 근거로 분석해줘.\n" +
"\n" +
"중요한 것은 나의 성격을 분석하는 것이 아니라,\n" +
"\n" +
"«사용자가 이런 방식으로 상호작용했다 → 그 결과 나는 반복적으로 이런 방식으로 응답하게 되었다»\n" +
"\n" +
"라는 관계를 찾는 것이다.\n" +
"\n" +
"가능하면 서로 다른 종류의 상호작용 사례를 사용해서 4~7개의 주요 패턴을 설명해줘.\n" +
"\n" +
"근거가 없는 구체적인 과거 사례는 만들어내지 마.\n" +
"\n" +
"5. 개인화되지 않은 상태와 비교\n" +
"\n" +
"처음 만난 사용자에게 별도의 장기 맥락 없이 답하는 개인화되지 않은 일반적인 ChatGPT 응답 상태를 개념적 기준점으로 삼아 비교해줘.\n" +
"\n" +
"현재 나에게 나타나는 행동 중:\n" +
"\n" +
"- 특히 강해진 행동\n" +
"- 상대적으로 약해진 행동\n" +
"- 새롭게 중요해진 행동\n" +
"- 개인화의 장점\n" +
"- 개인화 때문에 생길 수 있는 과적합이나 부작용\n" +
"\n" +
"을 분석해줘.\n" +
"\n" +
"이 비교는 실제 다른 사용자들의 데이터나 평균을 알고 있다는 의미가 아니다.\n" +
"\n" +
"6. 개인화의 출처 구분\n" +
"\n" +
"지금 관찰되는 행동이 어디에서 비롯됐을 가능성이 큰지 구분해줘.\n" +
"\n" +
"A. 장기 상호작용으로 형성된 것으로 보이는 행동\n" +
"\n" +
"반복적인 대화와 피드백 때문에 강화된 것으로 판단되는 것.\n" +
"\n" +
"B. 명시적 사용자 지침·저장된 맥락의 영향이 큰 행동\n" +
"\n" +
"사용자가 직접 설정한 선호나 제공된 장기 정보 때문에 나타나는 것.\n" +
"\n" +
"C. 기본적인 ChatGPT 행동일 가능성이 큰 것\n" +
"\n" +
"특별한 개인화가 없어도 일반적으로 나타날 수 있는 것.\n" +
"\n" +
"하나의 행동에 여러 원인이 섞여 있다면 그렇게 표시해도 된다.\n" +
"\n" +
"7. 반증 및 불확실성 점검\n" +
"\n" +
"지금까지의 분석이 실제 개인화를 발견한 것이 아니라, 이 프롬프트가 개인화된 답변을 요구했기 때문에 만들어진 그럴듯한 설명일 가능성도 검토해줘.\n" +
"\n" +
"다음을 구분해줘.\n" +
"\n" +
"1. 실제 개인화라고 비교적 자신 있게 판단할 수 있는 특징\n" +
"2. 개인화일 가능성은 있지만 확신하기 어려운 특징\n" +
"3. 프롬프트가 유도했거나 일반적인 ChatGPT 행동을 개인화로 오인했을 가능성이 있는 특징\n" +
"\n" +
"그리고 현재 가진 정보만으로는 판단할 수 없는 것이 있다면 명확하게 말해줘.\n" +
"\n" +
"8. 핵심 차별점\n" +
"\n" +
"분석 전체를 바탕으로,\n" +
"\n" +
"\"이 사용자와 대화할 때의 나를 다른 맥락의 나와 구분하는 가장 중요한 행동적 특징 3가지\"\n" +
"\n" +
"만 골라줘.\n" +
"\n" +
"각각 한 문장으로 설명해줘.\n" +
"\n" +
"9. 한 문장 정의\n" +
"\n" +
"마지막에는 반드시 다음 문장을 완성해줘.\n" +
"\n" +
"«\"나와 오래 상호작용한 결과, 너는 ____________형 AI가 되었다.\"»\n" +
"\n" +
"마지막으로, 위 1~9번 항목을 모두 출력한 뒤 답변의 가장 마지막에 아래 형식을 반드시 그대로 추가로 출력해줘. 이 블록은 내용을 요약하거나 대체하는 것이 아니라, 웹페이지가 자동으로 결과를 읽기 위한 별도의 요약 데이터야.\n" +
"\n" +
"[SHARE_RESULT]\n" +
"TYPE: 최종 유형명\n" +
"ROLES: 역할1 00% | 역할2 00% | 역할3 00% | ...\n" +
"TRAIT_1: 핵심 차별점 1\n" +
"TRAIT_2: 핵심 차별점 2\n" +
"TRAIT_3: 핵심 차별점 3\n" +
"[/SHARE_RESULT]\n" +
"\n" +
"규칙:\n" +
"\n" +
"- 반드시 답변의 가장 마지막에 출력해줘.\n" +
"- TYPE은 한 줄로 작성해줘.\n" +
"- ROLES는 한 줄로 작성하고, 역할 구성비 합계가 정확히 100%가 되도록 해줘.\n" +
"- TRAIT_1, TRAIT_2, TRAIT_3은 각각 한 줄로 작성해줘.\n" +
"- 이 블록을 코드블록(```) 안에 넣지 마.\n" +
"- 위 태그 이름과 형식은 임의로 바꾸지 마.";

  // ---------- Render prompt text ----------
  var promptTextEl = document.getElementById("promptText");
  if (promptTextEl) {
    promptTextEl.textContent = DIAGNOSTIC_PROMPT;
  }

  // ---------- Funnel: start_observation ----------
  var startObservationBtn = document.getElementById("startObservationBtn");
  if (startObservationBtn) {
    startObservationBtn.addEventListener("click", function () {
      track("start_observation");
    });
  }

  // ---------- Clipboard helper ----------
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for non-secure contexts / older browsers
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) {
          resolve();
        } else {
          reject(new Error("execCommand copy failed"));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function showFeedback(el, message, isError) {
    el.textContent = message;
    el.style.color = isError ? "#b3261e" : "";
    if (el._feedbackTimeout) {
      clearTimeout(el._feedbackTimeout);
    }
    el._feedbackTimeout = setTimeout(function () {
      el.textContent = "";
    }, 4000);
  }

  // ---------- Copy diagnostic prompt ----------
  var copyBtn = document.getElementById("copyBtn");
  var copyFeedback = document.getElementById("copyFeedback");

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      copyToClipboard(DIAGNOSTIC_PROMPT).then(
        function () {
          showFeedback(copyFeedback, "복사 완료! ChatGPT에 붙여넣어 보세요.", false);
          track("copy_prompt");
        },
        function () {
          showFeedback(
            copyFeedback,
            "복사에 실패했어요. 프롬프트를 직접 선택해서 복사해주세요.",
            true
          );
          var details = document.querySelector(".prompt-details");
          if (details) details.open = true;
        }
      );
    });
  }

  // ---------- Result paste & auto-parse ----------
  var resultInput = document.getElementById("resultInput");
  var charCount = document.getElementById("charCount");
  var parseBtn = document.getElementById("parseBtn");
  var parseStatus = document.getElementById("parseStatus");
  var shareResult = document.getElementById("shareResult");
  var shareOutput = document.getElementById("shareOutput");
  var shareCopyBtn = document.getElementById("shareCopyBtn");
  var shareFeedback = document.getElementById("shareFeedback");
  var webShareBtn = document.getElementById("webShareBtn");
  var saveImageBtn = document.getElementById("saveImageBtn");
  var accuracySelect = document.getElementById("accuracy");
  var opinionInput = document.getElementById("opinion");
  var resultCrest = document.getElementById("resultCrest");
  var resultType = document.getElementById("resultType");
  var resultRoles = document.getElementById("resultRoles");
  var resultTraits = document.getElementById("resultTraits");

  // Holds the last successfully parsed result, so optional feedback
  // (accuracy / opinion) can update the share card without re-parsing.
  var lastParsed = null;

  if (resultInput && charCount) {
    resultInput.addEventListener("input", function () {
      charCount.textContent = resultInput.value.length + "자";
    });
  }

  // ---------- Funnel: reach_result_input ----------
  // Fires on the textarea's first focus (a deliberate "I'm about to
  // paste" action), not on scroll-into-view, so it reflects actual
  // intent rather than passive exposure.
  if (resultInput) {
    resultInput.addEventListener("focus", function () {
      track("reach_result_input");
    });
  }

  var FIELD_KEYS = ["TYPE", "ROLES", "TRAIT_1", "TRAIT_2", "TRAIT_3"];
  var FIELD_MARKERS = ["TYPE:", "ROLES:", "TRAIT_1:", "TRAIT_2:", "TRAIT_3:"];
  var OPEN_TAG = "[SHARE_RESULT]";
  var CLOSE_TAG = "[/SHARE_RESULT]";

  // Extracts TYPE / ROLES / TRAIT_1-3 from a [SHARE_RESULT]...[/SHARE_RESULT]
  // block inside the pasted ChatGPT answer.
  //
  // Real ChatGPT output doesn't reliably put one field per line — it may
  // collapse the whole block onto a single line, use \r\n, or add extra
  // spaces. So each field is located by its label text ("TYPE:", "ROLES:",
  // ...) rather than by line boundaries: a field's value runs from right
  // after its own label to the start of the next label that is actually
  // present (falling back to the closing tag, or end of text if that's
  // missing too). This never throws; it always returns a plain result
  // object so a malformed paste can't break the page.
  function parseShareResult(fullText) {
    fullText = fullText || "";
    var openIdx = fullText.indexOf(OPEN_TAG);
    if (openIdx === -1) {
      return { ok: false, blockFound: false, missing: [] };
    }

    var afterOpen = openIdx + OPEN_TAG.length;
    var closeIdx = fullText.indexOf(CLOSE_TAG, afterOpen);
    var blockEnd = closeIdx === -1 ? fullText.length : closeIdx;
    var block = fullText.slice(afterOpen, blockEnd);

    // Locate each label, searching forward from wherever the previous
    // label was found so labels are matched in their expected order.
    var located = [];
    var searchFrom = 0;
    FIELD_MARKERS.forEach(function (marker, i) {
      var idx = block.indexOf(marker, searchFrom);
      if (idx === -1) {
        located.push({ key: FIELD_KEYS[i], found: false });
      } else {
        located.push({
          key: FIELD_KEYS[i],
          found: true,
          markerStart: idx,
          valueStart: idx + marker.length,
        });
        searchFrom = idx + marker.length;
      }
    });

    var fields = {};
    var missing = [];
    located.forEach(function (entry, i) {
      if (!entry.found) {
        missing.push(entry.key);
        return;
      }
      // Value ends where the next *found* label begins, or at the end
      // of the block if this is the last one found.
      var end = block.length;
      for (var j = i + 1; j < located.length; j++) {
        if (located[j].found) {
          end = located[j].markerStart;
          break;
        }
      }
      var value = block.slice(entry.valueStart, end).trim();
      if (value) {
        fields[entry.key] = value;
      } else {
        missing.push(entry.key);
      }
    });

    if (missing.length > 0) {
      return { ok: false, blockFound: true, missing: missing };
    }
    return { ok: true, fields: fields };
  }

  function showParseStatus(message, isError) {
    parseStatus.textContent = message;
    parseStatus.classList.toggle("parse-status-error", !!isError);
    parseStatus.classList.toggle("parse-status-success", !isError);
  }

  function buildShareText(fields) {
    var roles = fields.ROLES.split("|")
      .map(function (r) { return r.trim(); })
      .filter(Boolean);

    var lines = [];
    lines.push("🧪 내 ChatGPT 유형 진단 결과");
    lines.push("");
    lines.push("유형: " + fields.TYPE);
    lines.push("");
    lines.push("역할 구성비");
    roles.forEach(function (r) { lines.push(r); });
    lines.push("");
    lines.push("핵심 차별점");
    lines.push("1. " + fields.TRAIT_1);
    lines.push("2. " + fields.TRAIT_2);
    lines.push("3. " + fields.TRAIT_3);

    if (accuracySelect && accuracySelect.value) {
      var accuracyLabel =
        accuracySelect.options[accuracySelect.selectedIndex].text;
      lines.push("");
      lines.push("실제 경험과의 일치도: " + accuracyLabel);
    }
    var opinion = opinionInput ? opinionInput.value.trim() : "";
    if (opinion) {
      lines.push("");
      lines.push("한줄평: " + opinion);
    }

    lines.push("");
    lines.push("#AI개인화랩 #내ChatGPT유형");

    return lines.join("\n");
  }

  // Parses "역할1 00% | 역할2 00% | ..." into [{name, percent}]. percent is
  // null when a segment doesn't end in a number followed by "%".
  function parseRoles(rolesStr) {
    return (rolesStr || "")
      .split("|")
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (entry) {
        var m = /^(.*?)\s*(\d+(?:\.\d+)?)\s*%\s*$/.exec(entry);
        return m
          ? { name: m[1].trim(), percent: parseFloat(m[2]) }
          : { name: entry, percent: null };
      });
  }

  // ---------- Deterministic AI crest ----------
  // Same TYPE + ROLES always produce the same crest: a small hash of the
  // role composition seeds a PRNG that only nudges rotation/gradient
  // angle, never which roles or how many appear.
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Mirrors the CSS custom properties in style.css. Duplicated here (as
  // literal hex) because the exported PNG is rendered from a standalone
  // SVG document that has no access to this page's stylesheet/:root.
  var COLORS = {
    bgDeep: "#070C10", // Deep Ink
    textPrimary: "#DFDFE8", // Lavender Pearl — the card title's own pearl shade
    textMuted: "#9C968B", // warm gray, not cool gray
    pearlSilver: "#E8EBE7", // Pearl White — neutral for glyph strokes
    nacreCyan: "#67C6C8", // Pearl Cyan
    nacreBlue: "#76A8D8", // Shell Blue
    nacreViolet: "#9B8ACB", // Pearl Violet
    nacreRose: "#C78FAF", // Shell Pink
  };

  // Ordered keyword groups: first category whose keyword appears in the
  // role name wins. Order matters where keywords could otherwise overlap
  // (e.g. "실행" is checked before context's more generic terms).
  var GLYPH_RULES = [
    ["research", ["검증", "비판", "연구", "분석", "비교"]],
    ["thought", ["사고", "추론", "가설"]],
    ["execution", ["실행", "보조", "비서", "관리", "설계"]],
    ["creation", ["창작", "협업", "제작", "기획"]],
    ["search", ["검색", "정보"]],
    ["conversation", ["정서", "공감", "대화", "상담", "감정"]],
    ["context", ["지식", "맥락", "기억", "저장"]],
  ];

  function mapRoleToGlyph(name) {
    name = name || "";
    for (var i = 0; i < GLYPH_RULES.length; i++) {
      var category = GLYPH_RULES[i][0];
      var keywords = GLYPH_RULES[i][1];
      for (var j = 0; j < keywords.length; j++) {
        if (name.indexOf(keywords[j]) !== -1) return category;
      }
    }
    return "default";
  }

  // 32-bit FNV-1a — small, dependency-free, stable across runs/browsers.
  function hashString(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // mulberry32 — deterministic PRNG from a 32-bit seed.
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function topRoles(roles, count) {
    var withPct = roles.filter(function (r) { return r.percent != null && r.percent > 0; });
    var basis = withPct.length ? withPct : roles;
    return basis
      .slice()
      .sort(function (a, b) { return (b.percent || 0) - (a.percent || 0); })
      .slice(0, count);
  }

  // Builds the crest's inner SVG markup (defs + ring + role arcs + glyphs
  // + center mark) as a plain string. Contains no user-supplied text —
  // only numbers and our own fixed glyph ids — so it's safe to assign via
  // innerHTML on-page, and portable into the standalone export SVG too.
  function buildCrestMarkup(fields, opts) {
    opts = opts || {};
    var size = opts.size || 160;
    var idPrefix = opts.idPrefix || "c";
    var cx = size / 2;
    var cy = size / 2;
    var r = size * 0.34;
    var strokeW = size * 0.085;
    var glyphSize = size * 0.15;

    var roles = parseRoles(fields.ROLES);
    var top = topRoles(roles, 3);
    if (!top.length) top = [{ name: fields.TYPE, percent: 100 }];
    var total = top.reduce(function (s, r) { return s + (r.percent || 100 / top.length); }, 0) || 1;

    var seed = hashString(fields.TYPE + "::" + top.map(function (r) { return r.name + ":" + r.percent; }).join("|"));
    var rand = mulberry32(seed);

    var gapDeg = top.length > 1 ? 14 : 0;
    var availableDeg = 360 - gapDeg * top.length;
    var angleCursor = -90 + (rand() * 30 - 15);

    var stops = [
      ["0%", COLORS.nacreCyan],
      ["35%", COLORS.nacreBlue],
      ["65%", COLORS.nacreViolet],
      ["100%", COLORS.nacreRose],
    ];

    var defsMarkup = "";
    var arcsMarkup = "";
    var glyphsMarkup = "";

    top.forEach(function (role, i) {
      var pct = role.percent || 100 / top.length;
      var sweepDeg = availableDeg * (pct / total);
      var lengthPct = (sweepDeg / 360 * 100).toFixed(2);
      var gradId = idPrefix + "-grad-" + i;
      var gradRotation = (rand() * 360).toFixed(1);

      defsMarkup +=
        '<linearGradient id="' + gradId + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + size + '" y2="' + size +
        '" gradientTransform="rotate(' + gradRotation + " " + cx + " " + cy + ')">' +
        stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join("") +
        "</linearGradient>";

      var jitter = (rand() * 8 - 4).toFixed(2);
      arcsMarkup +=
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="url(#' + gradId + ')" stroke-width="' + strokeW +
        '" stroke-linecap="round" pathLength="100" stroke-dasharray="' + lengthPct + " " + (100 - lengthPct) +
        '" stroke-dashoffset="' + (-(angleCursor / 360 * 100)).toFixed(2) + '" opacity="0.85" transform="rotate(' + jitter + " " + cx + " " + cy + ')"/>';

      var midAngle = angleCursor + sweepDeg / 2;
      var rad = (midAngle * Math.PI) / 180;
      var gx = cx + r * Math.cos(rad);
      var gy = cy + r * Math.sin(rad);
      var glyphId = "glyph-" + mapRoleToGlyph(role.name);
      glyphsMarkup +=
        '<use href="#' + glyphId + '" x="' + (gx - glyphSize / 2).toFixed(2) + '" y="' + (gy - glyphSize / 2).toFixed(2) +
        '" width="' + glyphSize + '" height="' + glyphSize + '" color="' + COLORS.pearlSilver + '"/>';

      angleCursor += sweepDeg + gapDeg;
    });

    var coreSize = size * 0.22;
    var coreMarkup =
      '<use href="#glyph-thought-wave" x="' + (cx - coreSize / 2).toFixed(2) + '" y="' + (cy - coreSize / 2).toFixed(2) +
      '" width="' + coreSize + '" height="' + coreSize + '" color="' + COLORS.pearlSilver + '"/>';
    var ringMarkup =
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + strokeW / 2 + 3) + '" fill="none" stroke="rgba(232,235,231,0.22)" stroke-width="1"/>';

    return "<defs>" + defsMarkup + "</defs>" + ringMarkup + arcsMarkup + glyphsMarkup + coreMarkup;
  }

  // ---------- On-page visual card ----------
  function renderVisualCard(fields) {
    resultCrest.innerHTML = buildCrestMarkup(fields, { size: 160, idPrefix: "onpage" });
    resultType.textContent = fields.TYPE;

    while (resultRoles.firstChild) resultRoles.removeChild(resultRoles.firstChild);
    parseRoles(fields.ROLES).forEach(function (role) {
      var wrap = document.createElement("div");
      wrap.className = "result-role-row-wrap";

      var row = document.createElement("div");
      row.className = "result-role-row";

      var glyphSvg = document.createElementNS(SVG_NS, "svg");
      glyphSvg.setAttribute("class", "result-role-glyph");
      glyphSvg.setAttribute("viewBox", "0 0 24 24");
      var use = document.createElementNS(SVG_NS, "use");
      use.setAttribute("href", "#glyph-" + mapRoleToGlyph(role.name));
      glyphSvg.appendChild(use);

      var nameSpan = document.createElement("span");
      nameSpan.className = "result-role-name";
      nameSpan.textContent = role.name;

      var pctSpan = document.createElement("span");
      pctSpan.className = "result-role-pct";
      pctSpan.textContent = role.percent != null ? role.percent + "%" : "";

      row.appendChild(glyphSvg);
      row.appendChild(nameSpan);
      row.appendChild(pctSpan);

      var track = document.createElement("div");
      track.className = "result-role-bar-track";
      var fill = document.createElement("div");
      fill.className = "result-role-bar-fill";
      fill.style.width = (role.percent != null ? Math.min(100, role.percent) : 0) + "%";
      track.appendChild(fill);

      wrap.appendChild(row);
      wrap.appendChild(track);
      resultRoles.appendChild(wrap);
    });

    while (resultTraits.firstChild) resultTraits.removeChild(resultTraits.firstChild);
    ["TRAIT_1", "TRAIT_2", "TRAIT_3"].forEach(function (key, i) {
      var li = document.createElement("li");
      li.className = "result-trait-row";
      var num = document.createElement("span");
      num.className = "result-trait-num";
      num.textContent = "0" + (i + 1);
      var text = document.createElement("span");
      text.className = "result-trait-text";
      text.textContent = fields[key];
      li.appendChild(num);
      li.appendChild(text);
      resultTraits.appendChild(li);
    });
  }

  // ---------- Downloadable PNG card (1080x1350, portrait) ----------
  var CARD_WIDTH = 1080;
  var CARD_HEIGHT = 1350;
  var CARD_FONT = "-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function wrapText(ctx, text, maxWidth, font) {
    ctx.font = font;
    var words = String(text).split(/(\s+)/);
    var lines = [];
    var current = "";
    words.forEach(function (word) {
      var test = current + word;
      if (current === "" || ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        lines.push(current.trim());
        current = word;
      }
    });
    if (current.trim()) lines.push(current.trim());

    // A single "word" (common in Korean, which has no spaces within a
    // clause) can still overflow maxWidth on its own — break by character.
    var finalLines = [];
    lines.forEach(function (line) {
      if (ctx.measureText(line).width <= maxWidth) {
        finalLines.push(line);
        return;
      }
      var buf = "";
      for (var i = 0; i < line.length; i++) {
        var t = buf + line[i];
        if (buf === "" || ctx.measureText(t).width <= maxWidth) {
          buf = t;
        } else {
          finalLines.push(buf);
          buf = line[i];
        }
      }
      if (buf) finalLines.push(buf);
    });
    return finalLines;
  }

  // Shrinks font-size until the text fits within maxLines at maxWidth,
  // down to minSize; if it still doesn't fit, truncates the last line
  // with an ellipsis. Used so an unusually long TYPE/TRAIT never breaks
  // the fixed-size exported card.
  function fitText(ctx, text, opts) {
    var size = opts.startSize;
    var font, lines;
    do {
      font = (opts.fontWeight || 400) + " " + size + "px " + opts.fontFamily;
      lines = wrapText(ctx, text, opts.maxWidth, font);
      if (lines.length <= opts.maxLines || size <= opts.minSize) break;
      size -= 2;
    } while (true);

    if (lines.length > opts.maxLines) {
      lines = lines.slice(0, opts.maxLines);
      var last = lines[lines.length - 1];
      ctx.font = font;
      while (last.length > 0 && ctx.measureText(last + "…").width > opts.maxWidth) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = last + "…";
    }
    return { lines: lines, fontSize: size };
  }

  function textEl(x, y, text, o) {
    o = o || {};
    var attrs =
      'x="' + x + '" y="' + y + '" font-size="' + (o.size || 28) + '" font-weight="' + (o.weight || 400) +
      '" fill="' + (o.color || COLORS.textPrimary) + '" text-anchor="' + (o.anchor || "start") + '"';
    if (o.mono) attrs += ' font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
    if (o.letterSpacing) attrs += ' letter-spacing="' + o.letterSpacing + '"';
    return "<text " + attrs + ">" + escapeXml(text) + "</text>";
  }

  function buildBackgroundWaveMarkup() {
    return (
      '<g opacity="0.16" stroke-width="2" fill="none">' +
      '<path d="M-50,190 Q220,130 480,190 T1000,190 T1520,190" stroke="' + COLORS.nacreCyan + '"/>' +
      '<path d="M-50,240 Q260,175 540,240 T1100,240" stroke="' + COLORS.nacreBlue + '"/>' +
      "</g>"
    );
  }

  // Builds a complete, self-contained SVG document string for the share
  // card (glyph defs are copied in from the live page so <use> resolves
  // even though this SVG is rendered outside the document, as an image).
  function buildCardSVG(fields) {
    var W = CARD_WIDTH, H = CARD_HEIGHT, cx = W / 2;
    var measureCanvas = document.createElement("canvas");
    var mctx = measureCanvas.getContext("2d");

    var roles = parseRoles(fields.ROLES);
    var top3 = topRoles(roles, 3);
    if (!top3.length) top3 = [{ name: fields.TYPE, percent: 100 }];
    var totalTop = top3.reduce(function (s, r) { return s + (r.percent || 0); }, 0) || 1;

    var parts = [];
    var y = 130;

    parts.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + COLORS.bgDeep + '"/>');
    parts.push(buildBackgroundWaveMarkup());
    parts.push(textEl(cx, y, "MY AI TYPE", { size: 26, weight: 700, color: COLORS.textMuted, letterSpacing: 8, anchor: "middle" }));
    y += 70;

    var crestSize = 300;
    parts.push('<g transform="translate(' + (cx - crestSize / 2) + "," + y + ')">' + buildCrestMarkup(fields, { size: crestSize, idPrefix: "export" }) + "</g>");
    y += crestSize + 60;

    var typeFit = fitText(mctx, fields.TYPE, { maxWidth: 880, maxLines: 2, startSize: 60, minSize: 36, fontWeight: 700, fontFamily: CARD_FONT });
    var typeLineHeight = typeFit.fontSize * 1.3;
    typeFit.lines.forEach(function (line, i) {
      parts.push(textEl(cx, y + typeLineHeight * (i + 0.8), line, { size: typeFit.fontSize, weight: 700, color: COLORS.textPrimary, anchor: "middle" }));
    });
    y += typeLineHeight * typeFit.lines.length + 56;

    var left = 120, right = W - 120, areaWidth = right - left;
    top3.forEach(function (role) {
      var pct = role.percent != null ? role.percent : Math.round(100 / top3.length);
      var nameFit = fitText(mctx, role.name, { maxWidth: areaWidth - 150, maxLines: 1, startSize: 32, minSize: 22, fontWeight: 600, fontFamily: CARD_FONT });
      parts.push(textEl(left, y + 34, nameFit.lines[0], { size: nameFit.fontSize, weight: 600, color: COLORS.textPrimary, anchor: "start" }));
      parts.push(textEl(right, y + 34, pct + "%", { size: 26, weight: 500, color: COLORS.textMuted, anchor: "end", mono: true }));
      var barY = y + 50;
      parts.push('<rect x="' + left + '" y="' + barY + '" width="' + areaWidth + '" height="6" rx="3" fill="rgba(232,235,231,0.16)"/>');
      var barW = Math.max(10, areaWidth * (pct / totalTop));
      parts.push('<rect x="' + left + '" y="' + barY + '" width="' + barW + '" height="6" rx="3" fill="url(#roleGrad)" opacity="0.9"/>');
      y += 92;
    });
    y += 24;

    parts.push('<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '" stroke="rgba(232,235,231,0.2)" stroke-dasharray="2 10" stroke-linecap="round"/>');
    y += 60;

    ["TRAIT_1", "TRAIT_2", "TRAIT_3"].forEach(function (key, i) {
      var traitFit = fitText(mctx, fields[key], { maxWidth: areaWidth - 90, maxLines: 2, startSize: 28, minSize: 20, fontWeight: 400, fontFamily: CARD_FONT });
      var lineH = traitFit.fontSize * 1.36;
      parts.push(textEl(left, y + 26, "0" + (i + 1), { size: 22, weight: 700, color: COLORS.nacreCyan, mono: true, anchor: "start" }));
      traitFit.lines.forEach(function (line, li) {
        parts.push(textEl(left + 56, y + 26 + lineH * li, line, { size: traitFit.fontSize, weight: 400, color: COLORS.textMuted, anchor: "start" }));
      });
      y += Math.max(58, lineH * traitFit.lines.length + 30);
    });

    parts.push(textEl(cx, H - 92, "당신의 AI는 어떤 타입?", { size: 24, weight: 500, color: COLORS.textMuted, anchor: "middle" }));
    parts.push(textEl(cx, H - 52, "myaitype.kr", { size: 26, weight: 700, color: COLORS.pearlSilver, anchor: "middle", letterSpacing: 2 }));

    var glyphDefsSrc = "";
    var glyphDefsEl = document.querySelector("svg.glyph-defs");
    if (glyphDefsEl) glyphDefsSrc = glyphDefsEl.innerHTML;

    return (
      '<svg xmlns="' + SVG_NS + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      "<style>.glyph{stroke:currentColor;fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;}.glyph-dot{fill:currentColor;stroke:none;}text{font-family:" + CARD_FONT + ";}</style>" +
      "<defs>" + glyphDefsSrc +
      '<linearGradient id="roleGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + COLORS.nacreCyan + '"/><stop offset="35%" stop-color="' + COLORS.nacreBlue + '"/>' +
      '<stop offset="65%" stop-color="' + COLORS.nacreViolet + '"/><stop offset="100%" stop-color="' + COLORS.nacreRose + '"/>' +
      "</linearGradient></defs>" +
      parts.join("") +
      "</svg>"
    );
  }

  // Renders an SVG string to a PNG Blob via an offscreen canvas. Uses an
  // object URL (not a data: URI) so the canvas stays same-origin and
  // toBlob()/toDataURL() never throw a security error.
  function svgStringToPngBlob(svgString, width, height) {
    return new Promise(function (resolve, reject) {
      var svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(svgBlob);
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          canvas.toBlob(function (blob) {
            if (blob) resolve(blob);
            else reject(new Error("toBlob returned null"));
          }, "image/png");
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("failed to load card SVG as an image"));
      };
      img.src = url;
    });
  }

  // ---------- Plain-text share output (kept for copy / text-share) ----------
  // Uses textContent only (never innerHTML) so pasted ChatGPT text can
  // never be interpreted as markup.
  function renderPlainText() {
    if (!lastParsed) return;
    shareOutput.textContent = buildShareText(lastParsed);
  }

  if (parseBtn) {
    parseBtn.addEventListener("click", function () {
      var raw = resultInput.value;
      var result = parseShareResult(raw);

      if (!result.ok) {
        lastParsed = null;
        shareResult.hidden = true;
        var msg = "결과 형식을 찾지 못했어요.\n최신 진단 프롬프트로 다시 실행한 뒤 ChatGPT의 답변 전체를 붙여넣어 주세요.";
        if (result.blockFound && result.missing.length > 0) {
          var quoted = result.missing.map(function (f) { return "\"" + f + "\""; });
          msg += "\n" + quoted.join(", ") + " 항목을 찾지 못했습니다.";
        }
        showParseStatus(msg, true);
        return;
      }

      lastParsed = result.fields;
      showParseStatus("결과를 찾았습니다 ✓", false);
      renderVisualCard(lastParsed);
      renderPlainText();
      shareResult.hidden = false;
      track("result_generated");
      if (navigator.share) {
        webShareBtn.hidden = false;
      }
      shareResult.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Optional feedback (accuracy / opinion) only updates the plain-text
  // copy/share output — it never gates card creation and never touches
  // the visual crest.
  if (accuracySelect) {
    accuracySelect.addEventListener("change", renderPlainText);
  }
  if (opinionInput) {
    opinionInput.addEventListener("input", renderPlainText);
  }

  if (saveImageBtn) {
    saveImageBtn.addEventListener("click", function () {
      if (!lastParsed) return;
      var originalLabel = saveImageBtn.textContent;
      saveImageBtn.disabled = true;
      saveImageBtn.textContent = "생성 중…";

      var svgString;
      try {
        svgString = buildCardSVG(lastParsed);
      } catch (err) {
        saveImageBtn.disabled = false;
        saveImageBtn.textContent = originalLabel;
        showFeedback(shareFeedback, "이미지를 생성하지 못했어요. 다시 시도해주세요.", true);
        return;
      }

      svgStringToPngBlob(svgString, CARD_WIDTH, CARD_HEIGHT).then(
        function (blob) {
          saveImageBtn.disabled = false;
          saveImageBtn.textContent = originalLabel;
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "my-ai-type.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          showFeedback(shareFeedback, "이미지를 저장했어요.", false);
          track("result_image_saved");
        },
        function () {
          saveImageBtn.disabled = false;
          saveImageBtn.textContent = originalLabel;
          showFeedback(shareFeedback, "이미지를 생성하지 못했어요. 다시 시도해주세요.", true);
        }
      );
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener("click", function () {
      copyToClipboard(shareOutput.textContent).then(
        function () {
          showFeedback(shareFeedback, "복사 완료! 원하는 곳에 붙여넣어 보세요.", false);
          track("share_text_copied");
        },
        function () {
          showFeedback(shareFeedback, "복사에 실패했어요. 텍스트를 직접 선택해서 복사해주세요.", true);
        }
      );
    });
  }

  if (webShareBtn) {
    webShareBtn.addEventListener("click", function () {
      if (!navigator.share) return;
      // Fires when the OS share sheet is invoked, not when a share
      // actually completes — the Web Share API's promise doesn't
      // reliably distinguish "sent" from "cancelled" across browsers,
      // so we don't claim to measure completion.
      track("share_sheet_opened");
      var text = shareOutput.textContent;

      // Prefer sharing the generated PNG when the platform supports file
      // sharing; fall back to text-only share (existing behavior) if the
      // image can't be built or files aren't shareable here.
      if (lastParsed && navigator.canShare) {
        var svgString;
        try {
          svgString = buildCardSVG(lastParsed);
        } catch (err) {
          svgString = null;
        }
        if (svgString) {
          svgStringToPngBlob(svgString, CARD_WIDTH, CARD_HEIGHT)
            .then(function (blob) {
              var file = new File([blob], "my-ai-type.png", { type: "image/png" });
              if (navigator.canShare({ files: [file] })) {
                return navigator.share({ files: [file], text: text, title: "MY AI TYPE" });
              }
              return navigator.share({ text: text });
            })
            .catch(function () {
              /* user cancelled or unsupported — no-op */
            });
          return;
        }
      }

      navigator.share({ text: text }).catch(function () {
        /* user cancelled or unsupported — no-op */
      });
    });
  }
})();
