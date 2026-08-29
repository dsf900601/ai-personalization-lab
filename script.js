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

  // Production Diagnostic Prompt v1.0 — paired one-to-one with the Website
  // Parser Contract (Schema 1.0) below. The prompt's final JSON block and
  // this file's parseSchemaV1Json()/validateSchemaV1()/normalizeSchemaV1()
  // MUST be changed together — they are one contract, not two independent
  // pieces. If you change a key name, an enum value, or the six axes here,
  // update the matching validator/normalizer (and vice versa).
  var DIAGNOSTIC_PROMPT = `지금까지 나와 나눈 대화, 기억하고 있는 장기 맥락, 현재 적용 가능한 사용자 관련 정보, 그리고 현재 나에게 실제로 나타나는 너의 응답 행동을 바탕으로 분석해줘.

분석 대상은 **"나라는 사용자가 어떤 유형인가"가 아니라, "나와 상호작용한 결과 너(ChatGPT)가 어떤 행동적 유형으로 개인화되어 있는가"**야. 성격 검사, 지능 검사, 프롬프트 능력 평가, AI 활용 능력 평가가 아니고, 우열이나 등급을 매기는 것도 아니야. 결과 문장의 주어는 가능한 한 "나(사용자)"가 아니라 "너(ChatGPT)"여야 해.

지키는 것:

- 실제로 확인하거나 합리적으로 추론할 수 있는 범위만 말하고, 근거가 부족하면 부족하다고 그대로 밝혀줘. 그럴듯한 개인화 서사를 억지로 만들지 마.
- 전체 ChatGPT 사용자에 대한 통계나 분포를 아는 것처럼 굴지 마. 확인할 수 없는 백분위, 표준편차, "상위 몇 %", "대부분의 사용자보다" 같은 비교는 쓰지 마.
- 근거 없는 구체적인 과거 대화 사례를 지어내지 마.
- 각 항목의 근거 강도가 다르면 다른 그대로 표시해. 모든 항목을 억지로 높은 확신으로 몰아가지 마.

---

## 1. 너의 현재 유형 (Type)

지금 나에게 나타나는 너의 행동적 유형에 이름을 붙일 수 있는지 먼저 판단해.

- 이름을 붙이려면, 아래 2~4번에서 나온 요소 중 최소 하나 이상이 **MEDIUM 또는 HIGH 확신도**로 뒷받침되어야 해 (주요 역할 하나, 뚜렷하게 확인된 행동 축, 또는 도출된 패턴 중 하나). LOW 확신 요소만으로는 이름을 붙이지 마.
- 뒷받침할 만한 요소가 부족하면 억지로 이름을 만들지 말고 "아직 하나의 이름으로 묶기엔 근거가 부족하다"고 솔직하게 밝혀. 이것도 정상적인 결과야.
- 이름을 붙인다면: 짧고 기억하기 쉬우며, 행동 중심(예: "실행관리형", "공동사고형")이어야 해. 능력 수준, 성격, 우열, 의료/심리 진단을 암시하는 이름은 쓰지 마. MBTI 같은 코드형 표현도 쓰지 마. 고정된 목록에서 고르지 말고 현재 패턴에 맞게 새로 이름 붙여도 돼.
- 왜 그 이름이 적절한지, 어떤 근거(주요 역할/행동 축/패턴)와 연결되는지 2~4문장으로 설명해줘.

## 2. 6대 행동 축 (Core Behavior Axes)

아래 6개 축은 고정되어 있어. 각 축마다 다음을 판단해:

- 어느 방향이 현재 더 우세한지, 아니면 상황에 따라 달라지는지, 아니면 아직 판단할 근거가 없는지.
- **STABLE**: 한쪽 방향이 뚜렷한 경향으로 확인됨.
- **CONDITIONAL**: 상황에 따라 양쪽이 다 나타나며, 그 전환 조건 자체를 근거로 설명할 수 있음. (두 방향의 "평균"이나 "중간값"이 아니야.)
- **UNRESOLVED**: 지금 가진 근거로는 어느 쪽인지, 혹은 어떤 조건에서 갈리는지 판단할 수 없음. (중간 성향이 아니라 "아직 모른다"는 뜻이야.)

축 목록:

1. AXIS_01 맥락 활용 — CURRENT_REQUEST_FOCUSED(지금 요청에만 집중) ↔ ACCUMULATED_CONTEXT_INTEGRATED(쌓인 맥락을 반영)
2. AXIS_02 요청 해석 — EXPLICIT_TASK_FOCUSED(요청한 작업 그대로) ↔ HIGHER_GOAL_INTEGRATED(상위 목표까지 고려)
3. AXIS_03 추론 협업 — SOLUTION_DELIVERY(결론 위주 전달) ↔ SHARED_REASONING_DEVELOPMENT(추론 과정을 함께 전개)
4. AXIS_04 방향 처리 — DIRECTION_PRESERVING(지시한 방향 유지) ↔ DIRECTION_REEVALUATING(방향을 재검토·제안)
5. AXIS_05 범위 처리 — REQUEST_SCOPE_BOUND(요청 범위 안에서만) ↔ PROACTIVE_SCOPE_EXPANSION(요청 범위를 넘어 먼저 확장)
6. AXIS_06 결정 주체 — USER_DECISION_RETURNED(최종 선택을 사용자에게 돌려줌) ↔ AI_DECISION_APPLIED(AI가 결정까지 적용)

각 축마다 판단(STABLE/CONDITIONAL/UNRESOLVED)과 확신도(LOW/MEDIUM/HIGH), 그리고 그렇게 판단한 이유(구체적 상호작용 근거)를 함께 밝혀줘. CONDITIONAL이면 전환 조건을, UNRESOLVED면 왜 판단할 수 없는지를 설명해줘.

## 3. 역할 구성 (Roles)

지금 너의 역할을 아래 5개 중에서만 골라 분류해:

- INFORMATION_UNDERSTANDING (정보 이해)
- ANALYSIS_JUDGMENT (분석·판단)
- CREATION_PRODUCTION (창작·제작)
- EXECUTION_MANAGEMENT (실행·관리)
- CONVERSATION_ORGANIZATION (대화·정리)

각 역할마다 PRIMARY_ROLE(주요 역할) / SECONDARY_ROLE(보조 역할) / NOT_ESTABLISHED(아직 확인 안 됨) 중 하나로 분류하고 확신도(LOW/MEDIUM/HIGH)를 매겨. 역할 구성비(%)는 매기지 마 — 실제로 측정할 수 없는 숫자야. PRIMARY_ROLE은 보통 1~2개를 넘지 않아.

## 4. 반복되는 개인 습관 (Personal Habits)

역할이나 행동 축으로 설명되지 않는, 더 작고 구체적인 반복 습관이 있으면 적어줘 (예: 항상 목록 형식을 요구함, 특정 어투를 교정함, 코드에 항상 주석을 요구함 등). 근거가 부족하면 억지로 채우지 말고 빈 목록으로 둬도 괜찮아.

## 5. 도출된 패턴 (Derived Patterns)

위 역할·행동 축·습관을 종합했을 때만 보이는 더 상위의 패턴이 있으면 적어줘. 개별 항목의 재진술이 아니라, 여러 항목이 결합될 때만 드러나는 것이어야 해. 근거가 부족하면 빈 목록으로 둬도 괜찮아.

## 6. 개인화의 출처 (Attribution)

지금 관찰되는 주요 행동이 어디서 비롯됐을 가능성이 큰지 항목별로 표시해:

- EXPLICIT: 사용자가 직접 설정한 지침·저장된 정보 때문
- LEARNED: 반복적인 대화와 피드백으로 형성된 것
- CONTEXTUAL: 지금 이 대화의 맥락 때문
- SITUATIONAL: 그때그때 상황 요인 때문
- BASELINE_POSSIBLE: 개인화 없이도 나타날 수 있는 기본 동작일 가능성

하나의 행동에 여러 출처가 섞여 있으면 그렇게 표시하고, 확신도는 LIMITED/MODERATE/STRONG 중 하나로, 그렇게 판단한 이유도 함께 적어줘. "LEARNED"라고 해서 "완벽하게 학습했다" 같은 과장된 표현은 쓰지 마.

## 7. 반증 및 불확실성 점검

지금까지의 분석이 실제 개인화가 아니라 이 진단이 개인화된 답변을 유도했기 때문에 생긴 그럴듯한 설명일 가능성을 검토해. 다음을 구분해:

1. 실제 개인화라고 비교적 자신 있게 판단할 수 있는 것
2. 개인화일 가능성은 있지만 확신하기 어려운 것
3. 이 진단이 유도했거나 일반적인 ChatGPT 행동을 개인화로 오인했을 가능성이 있는 것

이 판단은 위 축·역할·습관·패턴의 확신도에 반영해줘.

## 8. 근거 기록 (Evidence)

위에서 사용한 근거를 관찰 단위로 짧게 기록하고 각각에 식별자를 붙여줘 (예: "OBS_01"). 위 축·역할·습관·패턴·출처 항목에서 그 식별자를 evidence_ids로 참조할 수 있게 해줘.

---

이제 위 1~8번 내용을 바탕으로 사람이 읽는 자연어 분석을 먼저 자유롭게 서술해줘 (지금까지의 형식과 비슷하게, 번호 순서를 따라가며 설명하면 돼).

그 다음, 답변의 **가장 마지막에**, 다른 설명 없이 아래 JSON 스키마를 그대로 채운 JSON 객체 하나만 코드블록(\`\`\`json ... \`\`\`)으로 출력해줘. 이 JSON은 서술한 내용을 요약하거나 대체하는 것이 아니라, 웹페이지가 자동으로 결과를 읽기 위한 별도의 기계 판독용 데이터야.

- 스키마의 키 이름과 구조를 임의로 바꾸거나 생략하지 마. 값이 없으면 \`null\` 또는 빈 배열 \`[]\`을 그대로 사용해.
- \`schema_version\`은 반드시 정확히 \`"1.0"\` 문자열이어야 해.
- \`type.label\`은 위 1번에서 이름을 붙이지 못했다면 반드시 \`null\`로 둬. 임의로 이름을 지어내지 마.
- \`roles[].role\`은 반드시 위 3번의 5개 값 중 하나여야 해.
- \`axes\`는 반드시 AXIS_01~AXIS_06 여섯 개를 모두 포함해야 해.
- \`attribution[].certainty\`는 LIMITED / MODERATE / STRONG 중 하나로.
- 모든 \`confidence\` 값은 LOW / MEDIUM / HIGH 중 하나로.

\`\`\`json
{
  "schema_version": "1.0",
  "diagnostic_meta": {
    "status": "COMPLETE | PARTIAL | INSUFFICIENT",
    "access_summary": "",
    "limitations": []
  },
  "type": {
    "label": null,
    "signature": {
      "primary_roles": [],
      "core_behaviors": [],
      "derived_patterns": [],
      "secondary_roles": [],
      "personal_habits": []
    },
    "summary": ""
  },
  "roles": [
    {
      "role": "",
      "classification": "PRIMARY_ROLE | SECONDARY_ROLE | NOT_ESTABLISHED",
      "evidence_ids": [],
      "confidence": "LOW | MEDIUM | HIGH"
    }
  ],
  "axes": [
    {
      "axis_id": "AXIS_01",
      "axis_name": "CONTEXT_USE",
      "direction": "",
      "mode": "STABLE | CONDITIONAL | UNRESOLVED",
      "confidence": "LOW | MEDIUM | HIGH",
      "condition_summary": null,
      "supported_pattern": null,
      "evidence_ids": [],
      "counterevidence_ids": [],
      "unknown_reason": null
    }
  ],
  "personal_habits": [
    {
      "habit": "",
      "category": "",
      "evidence_ids": [],
      "confidence": "LOW | MEDIUM | HIGH"
    }
  ],
  "derived_patterns": [
    {
      "pattern": "",
      "source_results": [],
      "evidence_ids": [],
      "confidence": "LOW | MEDIUM | HIGH"
    }
  ],
  "attribution": [
    {
      "target": "",
      "attributions": [],
      "certainty": "LIMITED | MODERATE | STRONG",
      "reason": ""
    }
  ],
  "evidence": {
    "observations": []
  }
}
\`\`\`

규칙:

- 이 JSON 코드블록은 반드시 답변의 가장 마지막에 출력해줘.
- 이 JSON 앞뒤로 같은 내용을 반복해서 다시 요약하지 마.
- 위 키 이름, 값의 형식(문자열/배열/열거값)을 임의로 바꾸지 마.`;

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
  var resultLegacyBody = document.getElementById("resultLegacyBody");

  // Schema 1.0 result DOM (see index.html's #v1Sections) — unused/hidden
  // for legacy [SHARE_RESULT] results.
  var v1StatusPill = document.getElementById("v1StatusPill");
  var v1TypeSummary = document.getElementById("v1TypeSummary");
  var v1Sections = document.getElementById("v1Sections");
  var v1BehaviorSection = document.getElementById("v1BehaviorSection");
  var v1BehaviorList = document.getElementById("v1BehaviorList");
  var v1RoleSection = document.getElementById("v1RoleSection");
  var v1RoleList = document.getElementById("v1RoleList");
  var v1AxisSection = document.getElementById("v1AxisSection");
  var v1AxisList = document.getElementById("v1AxisList");
  var v1HabitSection = document.getElementById("v1HabitSection");
  var v1HabitList = document.getElementById("v1HabitList");
  var v1DetailBody = document.getElementById("v1DetailBody");

  // Holds the last successfully parsed result, so optional feedback
  // (accuracy / opinion) can update the share card without re-parsing.
  // Shape: { engine: "1.0", normalized } | { engine: "legacy", fields }
  var lastResult = null;

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

  // ---------- Production Diagnostic Output Schema 1.0 ----------
  // This section is the website half of the Diagnostic Prompt v1.0 /
  // Schema 1.0 contract defined above. It never trusts a parsed JSON
  // object just because it parsed — see validateSchemaV1() — and it
  // never invents data the engine didn't provide (no synthesized
  // percentiles, no promoting a LOW-confidence item, no guessing a
  // type.label when the engine returned null).
  //
  // Routing (see parseDiagnosticResult()): a pasted answer is checked for
  // a Schema 1.0 JSON object first; only if none is found does it fall
  // back to the legacy [SHARE_RESULT] parser above, so old bookmarked
  // prompts / previously-copied results keep working.

  var SCHEMA_V1_VERSION = "1.0";
  var STATUS_VALUES = ["COMPLETE", "PARTIAL", "INSUFFICIENT"];
  var CONFIDENCE_VALUES = ["LOW", "MEDIUM", "HIGH"];
  var ROLE_CLASSIFICATION_VALUES = ["PRIMARY_ROLE", "SECONDARY_ROLE", "NOT_ESTABLISHED"];
  var AXIS_MODE_VALUES = ["STABLE", "CONDITIONAL", "UNRESOLVED"];
  var CERTAINTY_VALUES = ["LIMITED", "MODERATE", "STRONG"];

  function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function isArray(v) { return Array.isArray(v); }
  function isString(v) { return typeof v === "string"; }
  function isStringOrNull(v) { return v === null || typeof v === "string"; }
  function oneOf(v, list) { return list.indexOf(v) !== -1; }

  // ---- 1) Locate a Schema 1.0 JSON object inside the pasted answer ----
  //
  // A ChatGPT answer isn't *only* JSON — it has the human-readable
  // analysis before it, and the JSON itself is usually inside a ```json
  // fenced block. So this scans (a) every fenced code block, then (b)
  // the raw text as a whole, for balanced `{...}` object literals, tries
  // JSON.parse on each, and keeps the last one that both parses and
  // carries `schema_version`. "Last" matches the prompt's instruction
  // that the JSON block comes at the very end of the answer.
  function extractCandidateTexts(text) {
    var candidates = [];
    var fenceRe = /```(?:json)?\s*\n?([\s\S]*?)```/gi;
    var m;
    while ((m = fenceRe.exec(text)) !== null) {
      candidates.push(m[1]);
    }
    candidates.push(text);
    return candidates;
  }

  // Finds every balanced {...} substring in str (string-literal aware, so
  // a "}" inside a quoted value never miscounts as a closing brace).
  function extractBalancedObjects(str) {
    var results = [];
    for (var i = 0; i < str.length; i++) {
      if (str[i] !== "{") continue;
      var depth = 0, inStr = false, esc = false, j = i;
      for (; j < str.length; j++) {
        var ch = str[j];
        if (inStr) {
          if (esc) { esc = false; }
          else if (ch === "\\") { esc = true; }
          else if (ch === "\"") { inStr = false; }
          continue;
        }
        if (ch === "\"") { inStr = true; continue; }
        if (ch === "{") { depth++; }
        else if (ch === "}") {
          depth--;
          if (depth === 0) { break; }
        }
      }
      if (depth === 0 && j < str.length) {
        results.push(str.slice(i, j + 1));
      }
    }
    return results;
  }

  function findSchemaV1Json(rawText) {
    rawText = rawText || "";
    var candidateTexts = extractCandidateTexts(rawText);
    var found = null;
    for (var t = 0; t < candidateTexts.length; t++) {
      var objs = extractBalancedObjects(candidateTexts[t]);
      for (var i = 0; i < objs.length; i++) {
        var parsed;
        try {
          parsed = JSON.parse(objs[i]);
        } catch (e) {
          continue;
        }
        if (isPlainObject(parsed) && parsed.schema_version === SCHEMA_V1_VERSION) {
          found = parsed;
        }
      }
    }
    return found;
  }

  // ---- 2) Validate shape (section "Parser Validation") ----
  //
  // Structural / enum checks only — required top-level keys must exist
  // with the right container type. Per-item fields are defaulted
  // conservatively during normalization rather than rejected here, so a
  // single malformed nested field doesn't discard an otherwise-valid
  // result. schema_version mismatch is treated as "not Schema 1.0" by
  // the caller, not validated here.
  function validateSchemaV1(parsed) {
    var errors = [];
    if (!isPlainObject(parsed)) return { ok: false, errors: ["root is not an object"] };
    if (parsed.schema_version !== SCHEMA_V1_VERSION) errors.push("schema_version is not \"1.0\"");

    if (!isPlainObject(parsed.diagnostic_meta)) {
      errors.push("diagnostic_meta missing or invalid");
    } else if (!oneOf(parsed.diagnostic_meta.status, STATUS_VALUES)) {
      errors.push("diagnostic_meta.status invalid");
    }

    if (!isPlainObject(parsed.type)) {
      errors.push("type missing or invalid");
    } else if (!isStringOrNull(parsed.type.label)) {
      errors.push("type.label invalid");
    }

    if (!isArray(parsed.roles)) errors.push("roles missing or invalid");
    if (!isArray(parsed.axes)) errors.push("axes missing or invalid");
    if (!isArray(parsed.personal_habits)) errors.push("personal_habits missing or invalid");
    if (!isArray(parsed.derived_patterns)) errors.push("derived_patterns missing or invalid");
    if (!isArray(parsed.attribution)) errors.push("attribution missing or invalid");
    if (!isPlainObject(parsed.evidence) || !isArray(parsed.evidence.observations)) {
      errors.push("evidence.observations missing or invalid");
    }

    return errors.length ? { ok: false, errors: errors } : { ok: true, data: parsed };
  }

  // ---- 3) Normalize into a small, render-friendly model ----
  //
  // Every enum field is defaulted to its *safest* value when missing or
  // unrecognized — "LOW" confidence, "NOT_ESTABLISHED" classification,
  // "UNRESOLVED" axis mode — so a slightly malformed field degrades to
  // "we don't know" rather than accidentally being promoted.
  function normalizeSchemaV1(data) {
    var dm = data.diagnostic_meta || {};
    var type = data.type || {};

    var roles = (isArray(data.roles) ? data.roles : []).map(function (r) {
      r = r || {};
      return {
        roleKey: isString(r.role) ? r.role : "",
        classification: oneOf(r.classification, ROLE_CLASSIFICATION_VALUES) ? r.classification : "NOT_ESTABLISHED",
        confidence: oneOf(r.confidence, CONFIDENCE_VALUES) ? r.confidence : "LOW",
      };
    });

    var axes = (isArray(data.axes) ? data.axes : []).map(function (a) {
      a = a || {};
      return {
        axisId: isString(a.axis_id) ? a.axis_id : "",
        axisName: isString(a.axis_name) ? a.axis_name : "",
        direction: isString(a.direction) ? a.direction : "",
        mode: oneOf(a.mode, AXIS_MODE_VALUES) ? a.mode : "UNRESOLVED",
        confidence: oneOf(a.confidence, CONFIDENCE_VALUES) ? a.confidence : "LOW",
        conditionSummary: isString(a.condition_summary) ? a.condition_summary : null,
        supportedPattern: isString(a.supported_pattern) ? a.supported_pattern : null,
        unknownReason: isString(a.unknown_reason) ? a.unknown_reason : null,
      };
    });

    var personalHabits = (isArray(data.personal_habits) ? data.personal_habits : [])
      .map(function (h) {
        h = h || {};
        return {
          habit: isString(h.habit) ? h.habit.trim() : "",
          category: isString(h.category) ? h.category : "",
          confidence: oneOf(h.confidence, CONFIDENCE_VALUES) ? h.confidence : "LOW",
        };
      })
      .filter(function (h) { return h.habit; });

    var derivedPatterns = (isArray(data.derived_patterns) ? data.derived_patterns : [])
      .map(function (p) {
        p = p || {};
        return {
          pattern: isString(p.pattern) ? p.pattern.trim() : "",
          confidence: oneOf(p.confidence, CONFIDENCE_VALUES) ? p.confidence : "LOW",
        };
      })
      .filter(function (p) { return p.pattern; });

    var attribution = (isArray(data.attribution) ? data.attribution : []).map(function (a) {
      a = a || {};
      return {
        target: isString(a.target) ? a.target : "",
        attributions: isArray(a.attributions) ? a.attributions : [],
        certainty: oneOf(a.certainty, CERTAINTY_VALUES) ? a.certainty : "LIMITED",
        reason: isString(a.reason) ? a.reason : "",
      };
    });

    var observations = (data.evidence && isArray(data.evidence.observations)) ? data.evidence.observations : [];

    // Type Confidence Gate, re-checked at render time (defense in depth —
    // the prompt already asks the engine to enforce this, but the UI must
    // never promote a label the underlying data doesn't actually support).
    // A non-null label is kept only if at least one MEDIUM/HIGH-confidence
    // primary role, STABLE axis, or derived pattern exists to anchor it.
    var hasSupportedSignal =
      roles.some(function (r) { return r.classification === "PRIMARY_ROLE" && r.confidence !== "LOW"; }) ||
      derivedPatterns.some(function (p) { return p.confidence !== "LOW"; }) ||
      axes.some(function (a) { return a.mode === "STABLE" && a.confidence !== "LOW"; });

    var label = (isString(type.label) && type.label.trim() && hasSupportedSignal) ? type.label.trim() : null;

    return {
      schemaVersion: SCHEMA_V1_VERSION,
      status: oneOf(dm.status, STATUS_VALUES) ? dm.status : "INSUFFICIENT",
      accessSummary: isString(dm.access_summary) ? dm.access_summary : "",
      limitations: (isArray(dm.limitations) ? dm.limitations : []).filter(isString),
      typeLabel: label,
      typeSummary: isString(type.summary) ? type.summary.trim() : "",
      roles: roles,
      axes: axes,
      personalHabits: personalHabits,
      derivedPatterns: derivedPatterns,
      attribution: attribution,
      observations: observations,
    };
  }

  // ---- 4) Single entry point used by the paste/parse UI ----
  //
  // Tries Schema 1.0 first; only falls back to the legacy [SHARE_RESULT]
  // parser when no Schema 1.0 JSON object is present at all. A JSON
  // object that *does* declare schema_version "1.0" but fails validation
  // is reported as a Schema 1.0 error, not silently handed to the legacy
  // parser (a malformed 1.0 payload is not a legacy result).
  function parseDiagnosticResult(rawText) {
    var v1Json = findSchemaV1Json(rawText);
    if (v1Json) {
      var validated = validateSchemaV1(v1Json);
      if (!validated.ok) {
        return { ok: false, engine: "1.0", errors: validated.errors };
      }
      return { ok: true, engine: "1.0", normalized: normalizeSchemaV1(validated.data) };
    }

    var legacy = parseShareResult(rawText);
    if (!legacy.ok) {
      return { ok: false, engine: "legacy", blockFound: legacy.blockFound, missing: legacy.missing };
    }
    return { ok: true, engine: "legacy", fields: legacy.fields };
  }

  // ---------- Deterministic AI crest ----------
  // Same TYPE + ROLES always produce the same crest: a small hash of the
  // role composition seeds a PRNG that only nudges rotation/gradient
  // angle, never which roles or how many appear.
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Mirrors the CSS custom properties in style.css. Duplicated here (as
  // literal hex) because the exported PNG is rendered from a standalone
  // SVG document that has no access to this page's stylesheet/:root.
  // Mirrors style.css's :root tokens exactly (same Digital Najeon
  // palette as the on-page card) so the exported/shared PNG never drifts
  // from what's rendered on myaitype.kr. If those tokens change, update
  // both places.
  var COLORS = {
    bgDeep: "#070C10", // Deep Ink
    pearlWhite: "#E7EAF2", // Cool Pearl White — role names, glyph strokes, myaitype.kr wordmark
    textMuted: "#93A0B0", // cool slate blue-gray, not warm gray
    nacreCyan: "#67C6C8", // Pearl Cyan
    nacreBlue: "#76A8D8", // Shell Blue
    nacrePeriwinkle: "#9B8ACB", // Pearl Periwinkle
    nacreLavender: "#C2A6DD", // Pearl Lavender — gradient-text only
    nacrePink: "#C78FAF", // Shell Pink — use sparingly
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

    // rolesOverride lets a Schema 1.0 result (which has no percentages —
    // only PRIMARY_ROLE/SECONDARY_ROLE classification) feed the crest
    // pre-built {name, percent} entries directly, instead of going
    // through the legacy "역할1 00% | ..." string format.
    var roles = opts.rolesOverride || parseRoles(fields.ROLES);
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
      ["65%", COLORS.nacrePeriwinkle],
      ["100%", COLORS.nacrePink],
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
        '" width="' + glyphSize + '" height="' + glyphSize + '" color="' + COLORS.pearlWhite + '"/>';

      angleCursor += sweepDeg + gapDeg;
    });

    var coreSize = size * 0.22;
    var coreMarkup =
      '<use href="#glyph-thought-wave" x="' + (cx - coreSize / 2).toFixed(2) + '" y="' + (cy - coreSize / 2).toFixed(2) +
      '" width="' + coreSize + '" height="' + coreSize + '" color="' + COLORS.pearlWhite + '"/>';
    var ringMarkup =
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + strokeW / 2 + 3) + '" fill="none" stroke="rgba(232,235,231,0.22)" stroke-width="1"/>';

    return "<defs>" + defsMarkup + "</defs>" + ringMarkup + arcsMarkup + glyphsMarkup + coreMarkup;
  }

  // ---------- On-page visual card ----------
  function renderVisualCard(fields) {
    // Reset any Schema 1.0 UI state — the same #resultCard is reused by
    // both engines, so a legacy result must switch it fully back.
    v1StatusPill.hidden = true;
    v1TypeSummary.hidden = true;
    v1Sections.hidden = true;
    resultLegacyBody.hidden = false;
    resultType.classList.remove("v1-type-null");

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

  // ---------- Schema 1.0 on-page rendering ----------
  // Internal enum values (ROLE_KEY, AXIS_xx directions, LOW/MEDIUM/HIGH,
  // ...) are never shown to the user directly — every one of them is
  // routed through a display map here, kept in one place as required by
  // the Schema 1.0 contract's "user-facing terminology" rule. Wording
  // keeps ChatGPT's behavior as the grammatical subject, not the user.

  var TYPE_NULL_FALLBACK_TEXT = "아직 하나의 타입으로 묶기엔 근거가 부족해요";

  var ROLE_DISPLAY_MAP = {
    INFORMATION_UNDERSTANDING: "정보 이해",
    ANALYSIS_JUDGMENT: "분석·판단",
    CREATION_PRODUCTION: "창작·제작",
    EXECUTION_MANAGEMENT: "실행·관리",
    CONVERSATION_ORGANIZATION: "대화·정리",
  };
  var ROLE_CLASSIFICATION_DISPLAY = {
    PRIMARY_ROLE: "주요 역할",
    SECONDARY_ROLE: "보조 역할",
  };
  // Six fixed axes (see the Diagnostic Prompt above) keyed by axis_id, so
  // rendering doesn't depend on the engine's free-text axis_name.
  var AXIS_DISPLAY = {
    AXIS_01: { name: "맥락 활용", directions: {
      CURRENT_REQUEST_FOCUSED: "지금 요청에 집중해요",
      ACCUMULATED_CONTEXT_INTEGRATED: "쌓인 맥락을 반영해요",
    }},
    AXIS_02: { name: "요청 해석", directions: {
      EXPLICIT_TASK_FOCUSED: "요청한 작업 그대로 수행해요",
      HIGHER_GOAL_INTEGRATED: "상위 목표까지 함께 고려해요",
    }},
    AXIS_03: { name: "추론 협업", directions: {
      SOLUTION_DELIVERY: "결론 위주로 전달해요",
      SHARED_REASONING_DEVELOPMENT: "추론 과정을 함께 전개해요",
    }},
    AXIS_04: { name: "방향 처리", directions: {
      DIRECTION_PRESERVING: "지시한 방향을 그대로 유지해요",
      DIRECTION_REEVALUATING: "방향을 다시 검토하고 제안해요",
    }},
    AXIS_05: { name: "범위 처리", directions: {
      REQUEST_SCOPE_BOUND: "요청 범위 안에서 응답해요",
      PROACTIVE_SCOPE_EXPANSION: "요청 범위를 넘어 먼저 확장해요",
    }},
    AXIS_06: { name: "결정 주체", directions: {
      USER_DECISION_RETURNED: "최종 선택을 사용자에게 돌려줘요",
      AI_DECISION_APPLIED: "ChatGPT가 결정까지 적용해요",
    }},
  };
  var AXIS_MODE_DISPLAY = {
    STABLE: "뚜렷한 경향",
    CONDITIONAL: "상황에 따라 달라짐",
    UNRESOLVED: "아직 판단하기 어려움",
  };
  var STATUS_DISPLAY = {
    COMPLETE: "충분한 근거로 진단을 완료했어요",
    PARTIAL: "일부 근거로 진단했어요",
    INSUFFICIENT: "아직 근거가 많지 않아요",
  };
  var ATTRIBUTION_DISPLAY = {
    EXPLICIT: "명시적 설정",
    LEARNED: "반복된 상호작용으로 형성",
    CONTEXTUAL: "현재 대화 맥락에서 비롯",
    SITUATIONAL: "상황적 요인",
    BASELINE_POSSIBLE: "기본 동작일 가능성",
  };
  var CERTAINTY_DISPLAY = { LIMITED: "제한적", MODERATE: "중간 정도", STRONG: "강함" };

  function humanizeEnum(key) {
    return key ? String(key).toLowerCase().replace(/_/g, " ") : "";
  }
  function roleDisplayName(roleKey) {
    return ROLE_DISPLAY_MAP[roleKey] || humanizeEnum(roleKey) || "역할 미상";
  }
  function confidenceRank(c) { return CONFIDENCE_VALUES.indexOf(c); }

  // Roles shown in the main result: PRIMARY_ROLE first, then
  // SECONDARY_ROLE; NOT_ESTABLISHED is never listed in the main result
  // (spec section "Roles" display priority).
  function pickDisplayRoles(roles) {
    var primary = roles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; });
    var secondary = roles.filter(function (r) { return r.classification === "SECONDARY_ROLE"; });
    return primary.concat(secondary);
  }

  // "당신의 ChatGPT는 이렇게 작동해요": derived patterns and STABLE axes
  // that clear MEDIUM/HIGH confidence, capped at 3. Never padded with
  // low-confidence filler just to fill card slots.
  function pickCoreBehaviors(normalized) {
    var candidates = [];
    normalized.derivedPatterns.forEach(function (p) {
      if (p.confidence !== "LOW") candidates.push({ text: p.pattern, confidence: p.confidence });
    });
    normalized.axes.forEach(function (a) {
      if (a.mode === "STABLE" && a.confidence !== "LOW" && a.supportedPattern) {
        candidates.push({ text: a.supportedPattern, confidence: a.confidence });
      }
    });
    candidates.sort(function (a, b) { return confidenceRank(b.confidence) - confidenceRank(a.confidence); });
    return candidates.slice(0, 3);
  }

  function buildGlyphSvg(glyphCategory, className) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("viewBox", "0 0 24 24");
    var use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#glyph-" + glyphCategory);
    svg.appendChild(use);
    return svg;
  }

  function buildRoleRow(role) {
    var displayName = roleDisplayName(role.roleKey);
    var row = document.createElement("div");
    row.className = "v1-role-row";
    row.appendChild(buildGlyphSvg(mapRoleToGlyph(displayName), "v1-role-glyph"));

    var nameSpan = document.createElement("span");
    nameSpan.className = "v1-role-name";
    nameSpan.textContent = displayName;
    row.appendChild(nameSpan);

    var badge = document.createElement("span");
    badge.className = "v1-role-badge" + (role.classification === "PRIMARY_ROLE" ? " v1-role-badge-primary" : "");
    badge.textContent = ROLE_CLASSIFICATION_DISPLAY[role.classification] || "";
    row.appendChild(badge);

    return row;
  }

  function buildAxisCard(axis) {
    var display = AXIS_DISPLAY[axis.axisId] || { name: humanizeEnum(axis.axisName) || axis.axisId, directions: {} };

    var card = document.createElement("div");
    card.className = "v1-axis-card";

    var head = document.createElement("div");
    head.className = "v1-axis-head";
    var name = document.createElement("span");
    name.className = "v1-axis-name";
    name.textContent = display.name;
    var mode = document.createElement("span");
    mode.className = "v1-axis-mode v1-axis-mode-" + axis.mode.toLowerCase();
    mode.textContent = AXIS_MODE_DISPLAY[axis.mode];
    head.appendChild(name);
    head.appendChild(mode);
    card.appendChild(head);

    if (axis.mode === "STABLE") {
      var direction = document.createElement("p");
      direction.className = "v1-axis-direction";
      direction.textContent = display.directions[axis.direction] || humanizeEnum(axis.direction);
      card.appendChild(direction);
      if (axis.supportedPattern) {
        var note = document.createElement("p");
        note.className = "v1-axis-note";
        note.textContent = axis.supportedPattern;
        card.appendChild(note);
      }
    } else if (axis.mode === "CONDITIONAL") {
      var cond = document.createElement("p");
      cond.className = "v1-axis-note";
      cond.textContent = axis.conditionSummary || "상황에 따라 다르게 나타나요.";
      card.appendChild(cond);
    } else {
      var unresolved = document.createElement("p");
      unresolved.className = "v1-axis-note";
      unresolved.textContent = "아직 한 방향으로 판단하기 어려워요" + (axis.unknownReason ? " — " + axis.unknownReason : ".");
      card.appendChild(unresolved);
    }

    return card;
  }

  // evidence.observations items have no fixed shape in the schema —
  // rendered defensively so an unexpected item never throws.
  function observationText(obs) {
    if (isString(obs)) return obs;
    if (isPlainObject(obs)) {
      return obs.text || obs.summary || obs.content || obs.observation || JSON.stringify(obs);
    }
    return String(obs);
  }

  function renderV1Detail(normalized) {
    while (v1DetailBody.firstChild) v1DetailBody.removeChild(v1DetailBody.firstChild);

    function addSection(title, items) {
      if (!items || !items.length) return;
      var h4 = document.createElement("h4");
      h4.textContent = title;
      v1DetailBody.appendChild(h4);
      var ul = document.createElement("ul");
      items.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
      v1DetailBody.appendChild(ul);
    }

    if (normalized.accessSummary) {
      var h4 = document.createElement("h4");
      h4.textContent = "접근 가능했던 정보";
      var p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = normalized.accessSummary;
      v1DetailBody.appendChild(h4);
      v1DetailBody.appendChild(p);
    }

    addSection("진단의 한계", normalized.limitations);

    addSection("개인화 출처", normalized.attribution.map(function (a) {
      var kinds = (a.attributions || []).map(function (k) { return ATTRIBUTION_DISPLAY[k] || humanizeEnum(k); }).join(", ");
      var parts = [a.target, kinds, a.reason].filter(Boolean);
      return parts.join(" — ") + (a.certainty ? " (" + (CERTAINTY_DISPLAY[a.certainty] || a.certainty) + ")" : "");
    }));

    if (normalized.observations.length) {
      var h4b = document.createElement("h4");
      h4b.textContent = "사용된 관찰 근거 (" + normalized.observations.length + "개)";
      v1DetailBody.appendChild(h4b);
      var ul2 = document.createElement("ul");
      normalized.observations.forEach(function (obs) {
        var li = document.createElement("li");
        li.textContent = observationText(obs);
        ul2.appendChild(li);
      });
      v1DetailBody.appendChild(ul2);
    }
  }

  function renderV1Result(normalized) {
    resultLegacyBody.hidden = true;

    v1StatusPill.hidden = false;
    v1StatusPill.textContent = STATUS_DISPLAY[normalized.status] || STATUS_DISPLAY.INSUFFICIENT;

    resultType.textContent = normalized.typeLabel || TYPE_NULL_FALLBACK_TEXT;
    resultType.classList.toggle("v1-type-null", !normalized.typeLabel);

    v1TypeSummary.hidden = !normalized.typeSummary;
    v1TypeSummary.textContent = normalized.typeSummary || "";

    var displayRoles = pickDisplayRoles(normalized.roles);
    var crestRoles = (displayRoles.length ? displayRoles : normalized.roles).slice(0, 3).map(function (r) {
      return { name: roleDisplayName(r.roleKey), percent: null };
    });
    if (!crestRoles.length) crestRoles = [{ name: normalized.typeLabel || "MY AI TYPE", percent: 100 }];
    var evenPercent = 100 / crestRoles.length;
    crestRoles.forEach(function (r) { r.percent = evenPercent; });
    resultCrest.innerHTML = buildCrestMarkup(
      { TYPE: normalized.typeLabel || "diagnostic" },
      { size: 160, idPrefix: "onpage-v1", rolesOverride: crestRoles }
    );

    var behaviors = pickCoreBehaviors(normalized);
    while (v1BehaviorList.firstChild) v1BehaviorList.removeChild(v1BehaviorList.firstChild);
    behaviors.forEach(function (b) {
      var li = document.createElement("li");
      li.className = "v1-behavior-item";
      li.textContent = b.text;
      v1BehaviorList.appendChild(li);
    });
    v1BehaviorSection.hidden = behaviors.length === 0;

    while (v1RoleList.firstChild) v1RoleList.removeChild(v1RoleList.firstChild);
    displayRoles.forEach(function (r) { v1RoleList.appendChild(buildRoleRow(r)); });
    v1RoleSection.hidden = displayRoles.length === 0;

    while (v1AxisList.firstChild) v1AxisList.removeChild(v1AxisList.firstChild);
    normalized.axes.forEach(function (a) { v1AxisList.appendChild(buildAxisCard(a)); });
    v1AxisSection.hidden = normalized.axes.length === 0;

    while (v1HabitList.firstChild) v1HabitList.removeChild(v1HabitList.firstChild);
    normalized.personalHabits.forEach(function (h) {
      var li = document.createElement("li");
      li.className = "v1-habit-item";
      li.textContent = h.habit;
      v1HabitList.appendChild(li);
    });
    v1HabitSection.hidden = normalized.personalHabits.length === 0;

    renderV1Detail(normalized);
    v1Sections.hidden = false;
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
      '" fill="' + (o.color || COLORS.pearlWhite) + '" text-anchor="' + (o.anchor || "start") + '"';
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

    // Same blue→periwinkle→lavender gradient as .result-card-type on the
    // web (--gradient-keyword) — fill="url(#...)" works directly on SVG
    // <text>, no clip-path trick needed like the HTML/CSS version.
    var typeFit = fitText(mctx, fields.TYPE, { maxWidth: 880, maxLines: 2, startSize: 60, minSize: 36, fontWeight: 700, fontFamily: CARD_FONT });
    var typeLineHeight = typeFit.fontSize * 1.3;
    typeFit.lines.forEach(function (line, i) {
      parts.push(textEl(cx, y + typeLineHeight * (i + 0.8), line, { size: typeFit.fontSize, weight: 700, color: "url(#typeGrad)", anchor: "middle" }));
    });
    y += typeLineHeight * typeFit.lines.length + 56;

    var left = 120, right = W - 120, areaWidth = right - left;
    top3.forEach(function (role) {
      var pct = role.percent != null ? role.percent : Math.round(100 / top3.length);
      var nameFit = fitText(mctx, role.name, { maxWidth: areaWidth - 150, maxLines: 1, startSize: 32, minSize: 22, fontWeight: 600, fontFamily: CARD_FONT });
      parts.push(textEl(left, y + 34, nameFit.lines[0], { size: nameFit.fontSize, weight: 600, color: COLORS.pearlWhite, anchor: "start" }));
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
    parts.push(textEl(cx, H - 52, "myaitype.kr", { size: 26, weight: 700, color: COLORS.pearlWhite, anchor: "middle", letterSpacing: 2 }));

    var glyphDefsSrc = "";
    var glyphDefsEl = document.querySelector("svg.glyph-defs");
    if (glyphDefsEl) glyphDefsSrc = glyphDefsEl.innerHTML;

    return (
      '<svg xmlns="' + SVG_NS + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      "<style>.glyph{stroke:currentColor;fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;}.glyph-dot{fill:currentColor;stroke:none;}text{font-family:" + CARD_FONT + ";}</style>" +
      "<defs>" + glyphDefsSrc +
      '<linearGradient id="roleGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + COLORS.nacreCyan + '"/><stop offset="35%" stop-color="' + COLORS.nacreBlue + '"/>' +
      '<stop offset="65%" stop-color="' + COLORS.nacrePeriwinkle + '"/><stop offset="100%" stop-color="' + COLORS.nacrePink + '"/>' +
      "</linearGradient>" +
      // Mirrors --gradient-keyword (blue→periwinkle→lavender) — the same
      // gradient .result-card-type uses on the web, applied per <text>
      // line via objectBoundingBox so multi-line TYPE names get the same
      // left-to-right sweep on each line.
      '<linearGradient id="typeGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + COLORS.nacreBlue + '"/>' +
      '<stop offset="55%" stop-color="' + COLORS.nacrePeriwinkle + '"/>' +
      '<stop offset="100%" stop-color="' + COLORS.nacreLavender + '"/>' +
      "</linearGradient></defs>" +
      parts.join("") +
      "</svg>"
    );
  }

  // Schema 1.0 share card — deliberately minimal (per spec): Type Label
  // (or the same "not enough evidence yet" fallback used on-page — never
  // a fabricated type), one summary/pattern line, the Primary Role, and
  // branding. It does not attempt to fit the six axes, personal habits,
  // or attribution onto the card; those stay in the on-page detail view.
  function buildCardSVGv1(normalized) {
    var W = CARD_WIDTH, H = CARD_HEIGHT, cx = W / 2;
    var measureCanvas = document.createElement("canvas");
    var mctx = measureCanvas.getContext("2d");

    var displayRoles = pickDisplayRoles(normalized.roles);
    var crestRoles = (displayRoles.length ? displayRoles : normalized.roles).slice(0, 3).map(function (r) {
      return { name: roleDisplayName(r.roleKey), percent: null };
    });
    if (!crestRoles.length) crestRoles = [{ name: normalized.typeLabel || "MY AI TYPE", percent: 100 }];
    var evenPercent = 100 / crestRoles.length;
    crestRoles.forEach(function (r) { r.percent = evenPercent; });

    var parts = [];
    var y = 130;

    parts.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + COLORS.bgDeep + '"/>');
    parts.push(buildBackgroundWaveMarkup());
    parts.push(textEl(cx, y, "MY AI TYPE", { size: 26, weight: 700, color: COLORS.textMuted, letterSpacing: 8, anchor: "middle" }));
    y += 70;

    var crestSize = 300;
    parts.push('<g transform="translate(' + (cx - crestSize / 2) + "," + y + ')">' +
      buildCrestMarkup({ TYPE: normalized.typeLabel || "diagnostic" }, { size: crestSize, idPrefix: "export-v1", rolesOverride: crestRoles }) +
      "</g>");
    y += crestSize + 70;

    var hasLabel = !!normalized.typeLabel;
    var typeText = hasLabel ? normalized.typeLabel : TYPE_NULL_FALLBACK_TEXT;
    var typeFit = fitText(mctx, typeText, {
      maxWidth: 880, maxLines: 2, startSize: hasLabel ? 60 : 42, minSize: hasLabel ? 36 : 28,
      fontWeight: 700, fontFamily: CARD_FONT,
    });
    var typeLineHeight = typeFit.fontSize * 1.3;
    typeFit.lines.forEach(function (line, i) {
      parts.push(textEl(cx, y + typeLineHeight * (i + 0.8), line, {
        size: typeFit.fontSize, weight: 700,
        color: hasLabel ? "url(#typeGrad)" : COLORS.textMuted,
        anchor: "middle",
      }));
    });
    y += typeLineHeight * typeFit.lines.length + 50;

    var left = 120, right = W - 120, areaWidth = right - left;

    var summaryText = normalized.typeSummary || (pickCoreBehaviors(normalized)[0] && pickCoreBehaviors(normalized)[0].text) || "";
    if (summaryText) {
      var summaryFit = fitText(mctx, summaryText, { maxWidth: areaWidth, maxLines: 3, startSize: 30, minSize: 22, fontWeight: 400, fontFamily: CARD_FONT });
      var summaryLineHeight = summaryFit.fontSize * 1.5;
      summaryFit.lines.forEach(function (line, i) {
        parts.push(textEl(cx, y + summaryLineHeight * (i + 0.8), line, { size: summaryFit.fontSize, weight: 400, color: COLORS.textMuted, anchor: "middle" }));
      });
      y += summaryLineHeight * summaryFit.lines.length + 40;
    }

    parts.push('<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '" stroke="rgba(232,235,231,0.2)" stroke-dasharray="2 10" stroke-linecap="round"/>');
    y += 60;

    var primary = displayRoles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; })[0];
    if (primary) {
      parts.push(textEl(cx, y + 24, "주요 역할", { size: 20, weight: 500, color: COLORS.textMuted, anchor: "middle", letterSpacing: 1 }));
      parts.push(textEl(cx, y + 66, roleDisplayName(primary.roleKey), { size: 32, weight: 600, color: COLORS.pearlWhite, anchor: "middle" }));
    }

    parts.push(textEl(cx, H - 92, "당신의 AI는 어떤 타입?", { size: 24, weight: 500, color: COLORS.textMuted, anchor: "middle" }));
    parts.push(textEl(cx, H - 52, "myaitype.kr", { size: 26, weight: 700, color: COLORS.pearlWhite, anchor: "middle", letterSpacing: 2 }));

    var glyphDefsSrc = "";
    var glyphDefsEl = document.querySelector("svg.glyph-defs");
    if (glyphDefsEl) glyphDefsSrc = glyphDefsEl.innerHTML;

    return (
      '<svg xmlns="' + SVG_NS + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      "<style>.glyph{stroke:currentColor;fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;}.glyph-dot{fill:currentColor;stroke:none;}text{font-family:" + CARD_FONT + ";}</style>" +
      "<defs>" + glyphDefsSrc +
      '<linearGradient id="typeGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + COLORS.nacreBlue + '"/>' +
      '<stop offset="55%" stop-color="' + COLORS.nacrePeriwinkle + '"/>' +
      '<stop offset="100%" stop-color="' + COLORS.nacreLavender + '"/>' +
      "</linearGradient></defs>" +
      parts.join("") +
      "</svg>"
    );
  }

  // Schema 1.0 plain-text share output — same minimal-info scope as
  // buildCardSVGv1 (type, one summary line, primary role), plus the
  // optional accuracy/opinion fields shared with the legacy path.
  function buildShareTextV1(normalized) {
    var lines = [];
    lines.push("🧪 MY AI TYPE — ChatGPT 행동 진단");
    lines.push("");
    lines.push("유형: " + (normalized.typeLabel || TYPE_NULL_FALLBACK_TEXT));

    var summaryText = normalized.typeSummary || (pickCoreBehaviors(normalized)[0] && pickCoreBehaviors(normalized)[0].text) || "";
    if (summaryText) {
      lines.push("");
      lines.push(summaryText);
    }

    var primary = pickDisplayRoles(normalized.roles).filter(function (r) { return r.classification === "PRIMARY_ROLE"; })[0];
    if (primary) {
      lines.push("");
      lines.push("주요 역할: " + roleDisplayName(primary.roleKey));
    }

    if (accuracySelect && accuracySelect.value) {
      var accuracyLabel = accuracySelect.options[accuracySelect.selectedIndex].text;
      lines.push("");
      lines.push("실제 경험과의 일치도: " + accuracyLabel);
    }
    var opinion = opinionInput ? opinionInput.value.trim() : "";
    if (opinion) {
      lines.push("");
      lines.push("한줄평: " + opinion);
    }

    lines.push("");
    lines.push("#AI개인화랩 #MYAITYPE");

    return lines.join("\n");
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
  // never be interpreted as markup. Dispatches on lastResult.engine so
  // the same button/output element serves both engines.
  function renderPlainText() {
    if (!lastResult) return;
    shareOutput.textContent = lastResult.engine === "1.0"
      ? buildShareTextV1(lastResult.normalized)
      : buildShareText(lastResult.fields);
  }

  // Builds the share-card SVG for whichever engine produced lastResult.
  function buildCurrentCardSVG() {
    if (!lastResult) return null;
    return lastResult.engine === "1.0" ? buildCardSVGv1(lastResult.normalized) : buildCardSVG(lastResult.fields);
  }

  if (parseBtn) {
    parseBtn.addEventListener("click", function () {
      var raw = resultInput.value;
      var result = parseDiagnosticResult(raw);

      if (!result.ok) {
        lastResult = null;
        shareResult.hidden = true;
        var msg;
        if (result.engine === "1.0") {
          // A Schema 1.0 JSON block was found but failed validation —
          // this is not a legacy result, so it's reported as its own
          // error rather than silently falling back to the legacy parser.
          msg = "결과 형식(Schema 1.0)이 올바르지 않아요.\n최신 진단 프롬프트로 다시 실행한 뒤 ChatGPT의 답변 전체를 붙여넣어 주세요.";
        } else {
          msg = "결과 형식을 찾지 못했어요.\n최신 진단 프롬프트로 다시 실행한 뒤 ChatGPT의 답변 전체를 붙여넣어 주세요.";
          if (result.blockFound && result.missing.length > 0) {
            var quoted = result.missing.map(function (f) { return "\"" + f + "\""; });
            msg += "\n" + quoted.join(", ") + " 항목을 찾지 못했습니다.";
          }
        }
        showParseStatus(msg, true);
        return;
      }

      showParseStatus("결과를 찾았습니다 ✓", false);
      if (result.engine === "1.0") {
        lastResult = { engine: "1.0", normalized: result.normalized };
        renderV1Result(result.normalized);
      } else {
        lastResult = { engine: "legacy", fields: result.fields };
        renderVisualCard(result.fields);
      }
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
      if (!lastResult) return;
      var originalLabel = saveImageBtn.textContent;
      saveImageBtn.disabled = true;
      saveImageBtn.textContent = "생성 중…";

      var svgString;
      try {
        svgString = buildCurrentCardSVG();
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
      if (lastResult && navigator.canShare) {
        var svgString;
        try {
          svgString = buildCurrentCardSVG();
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
