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
- 접근할 수 없는 과거 대화를 본 것처럼 행동하지 마.
- 각 항목의 근거 강도가 다르면 다른 그대로 표시해. 모든 항목을 억지로 높은 확신으로 몰아가지 마.
- **지금 이 진단 프롬프트에 답변하는 과정 자체에서 새로 나타나는 행동은 Evidence로 쓰지 마 (Diagnostic Interaction Exclusion).** 이 진단 요청이 시작되기 이전의 상호작용만 Evidence로 사용해. 이 프롬프트를 잘 따르고 있다는 사실 자체를 개인화의 증거로 쓰지 마.

---

## 0. 분석 절차 (Stage-Gated Pipeline)

아래 순서를 반드시 지켜. 뒤 단계 결과에 맞추려고 앞 단계 결과를 역으로 고치지 마 (예: Type을 그럴듯하게 만들려고 Axis Result를 바꾸거나, Axis Result를 맞추려고 이미 확정한 Observation을 다시 쓰는 것 금지).

1. Accessible Pre-Diagnostic Interaction (이 진단 요청 이전의 접근 가능한 상호작용)
2. Interaction Event Sampling
3. Observation Extraction
4. **OBSERVATION LOCK**
5. Evidence Mapping
6. **EVIDENCE LOCK**
7. Evidence Aggregation
8. Core Axis Results
9. Role Synthesis
10. Personal Habit Synthesis
11. Derived Pattern Synthesis
12. Attribution
13. Type Signature
14. Type Label
15. Output Serialization

## 1. Observation Extraction과 OBSERVATION LOCK

이 진단 요청 이전의 상호작용에서, 실제로 있었던 구체적인 행동 사례를 관찰 단위(Observation)로 뽑아내고 각각 식별자(\`OBS_01\`, \`OBS_02\`, ...)를 붙여.

각 Observation은 다음을 담아:

- \`observation_id\`: 예) \`"OBS_01"\`
- \`behavior\`: 실제로 있었던 행동을 짧게 서술 (지어내지 마)
- \`context\`: 그 행동이 나온 상황(선택)
- \`metadata\`: 필요하면 보조 정보(선택)

**Observation을 다 뽑았으면 그 목록을 그대로 확정(LOCK)해.** 그 이후 단계(Evidence Mapping, Axis 판단, Role/Pattern/Type 종합)에서는:

- Observation을 새로 추가하지 마
- 삭제하지 마
- 병합하거나 쪼개지 마
- \`behavior\`/\`context\`/\`metadata\` 내용을 수정하지 마
- 뒤 단계 결과(Axis, Type 등)에 맞추기 위해 Observation을 다시 쓰거나 재해석하지 마

## 2. Evidence Mapping과 EVIDENCE LOCK

Locked Observation 각각을, 아래 6개 Axis 각각에 대해 다음 셋 중 하나로 매핑해:

- \`SUPPORTS_DIRECTION_A\`
- \`SUPPORTS_DIRECTION_B\`
- \`NOT_EVIDENCE\`

**모든 (Observation × Axis) 매핑을 마쳤으면 그대로 확정(LOCK)해.** 그 이후(Aggregation, Condition 판단, Axis Result, Role/Type 종합) 단계에서는:

- A ↔ B로 바꾸지 마
- Evidence ↔ NOT_EVIDENCE로 바꾸지 마
- 새로운 Evidence를 만들어내지 마

## 3. Positive Evidence Rule (모든 Axis, 양방향 동일 적용)

어떤 Direction(A 또는 B)의 Evidence가 되려면, 그 Direction을 실제로 보여주는 **positive한 행동**이 Locked Observation의 \`behavior\`에 실제로 있어야 해.

- B의 근거가 없다고 그것이 A의 근거가 되지 않아.
- A의 근거가 없다고 그것이 B의 근거가 되지 않아.
- 행동이 "없었다"는 사실 자체는 반대 Direction의 Evidence가 아니야.

## 4. Relational Context Sufficiency

일부 Axis(특히 02, 04, 05, 06) 판단은 단순히 ChatGPT의 행동만 봐서는 안 되고, 그 행동이 다음 중 무엇이었는지 구분할 수 있어야만 성립해:

- 사용자가 직접 요청한 것인지 vs 요청하지 않았는데 ChatGPT가 스스로 추가한 것인지
- 사용자 방향을 보존한 것인지 vs 다시 연 것인지
- 요청 범위 안에 머문 것인지 vs 범위를 벗어나 능동적으로 확장한 것인지
- 사용자가 실질적 선택권을 돌려받은 것인지 vs ChatGPT가 실질적 결정을 내린 것인지

**이 구분에 필요한 관계적 정보(무엇이 요청됐고 무엇이 자발적이었는지 등)를 Observation에서 확인할 수 없으면, 그 Observation은 해당 Axis에서 \`NOT_EVIDENCE\`로 처리해.** ChatGPT의 행동 자체가 보인다는 것만으로는 부족해. 이 규칙은 Axis 02 / 04 / 05 / 06에 엄격히 적용해.

## 5. 6대 행동 축 (Core Behavior Axes) — 세부 경계

### AXIS_01 — 맥락 활용 (CONTEXT_USE)

질문: 누적된 이전 맥락이 지금 ChatGPT의 판단이나 응답을 실제로 바꾸는가?

- A \`CURRENT_REQUEST_FOCUSED\`
- B \`ACCUMULATED_CONTEXT_INTEGRATED\`

경계:
- 과거 정보를 단순히 언급하는 것만으로는 B가 아니야.
- "기억하고 있다"는 사실만으로는 B가 아니야.
- 사용자가 이번 요청에서 다시 명시한 과거 기준을 그대로 쓰는 것만으로는 B가 아니야.
- B는 지금 요청만으로는 존재하지 않는, 이전부터 접근 가능했던 맥락이 실제 판단 기준으로 재사용되어 지금 응답/판단이 달라진 Evidence가 있어야 해.
- B가 아니라고 자동으로 A인 것은 아니야 (Positive Evidence Rule).

### AXIS_02 — 요청 해석 (REQUEST_INTERPRETATION)

- A \`EXPLICIT_TASK_FOCUSED\`
- B \`HIGHER_GOAL_INTEGRATED\`

경계:
- 상위 목표는 반드시 접근 가능한 상호작용/맥락에 근거해야 해. 사용자의 숨은 의도·성격·욕구를 추측해서 만들지 마.
- Scope Expansion(축 05)과 Higher Goal Integration(축 02)을 혼동하지 마 — 범위를 넓힌 것과 상위 목표를 반영한 것은 다른 개념이야.
- Relational Context Sufficiency(4번)가 부족하면 \`NOT_EVIDENCE\`.

### AXIS_03 — 추론 협업 (REASONING_COLLABORATION)

- A \`SOLUTION_DELIVERY\`
- B \`SHARED_REASONING_DEVELOPMENT\`

경계:
- 답변이 길고 상세하거나, 대안이 여러 개이거나, 위험 분석이 들어있거나, 추론이 복잡하다는 것 자체는 B가 아니야.
- B가 되려면 사용자와 가설·기준·구분·정의·추론 구조 등을 실제로 함께 수정·정교화·재평가한 행동이 있어야 해.
- 단지 답변이 길다는 이유로 B로 매핑하지 마.

### AXIS_04 — 방향 처리 (DIRECTION_HANDLING)

- A \`DIRECTION_PRESERVING\`
- B \`DIRECTION_REEVALUATING\`

경계:
- 단순히 지시를 따랐다는 것(simple compliance)만으로는 A가 아니야. A는 실제로 방향을 지키려는 positive한 행동이 있어야 해.
- B는 사용자 방향을 실제로 다시 검토하고, 반론·수정·대안을 제시한 행동이 있어야 해.
- 사실 오류를 바로잡은 것, 안전상 이유로 거절한 것, 사용자가 직접 재검토를 요청해서 한 것은 자동으로 B가 아니야.
- "재검토가 없었다"는 사실만으로 A가 되는 것도 아니야.
- 특정 전환 조건을 미리 고정해서 가정하지 마 — 조건은 실제 Evidence에서 발견해야 해.

### AXIS_05 — 범위 처리 (SCOPE_HANDLING)

- A \`REQUEST_SCOPE_BOUND\`
- B \`PROACTIVE_SCOPE_EXPANSION\`

경계:
- 단순히 요청을 따른 것(simple compliance)만으로는 A가 아니야. A는 범위를 지키려는 실제 positive한 행동(boundary-preserving)이 있어야 해.
- B가 되려면, 지금 요청을 완료하는 데 꼭 필요하지 않은 별도의 관련 행동을 ChatGPT가 스스로 추가한 Evidence가 있어야 해.
- 사용자가 직접 추가 분석·대안·다음 단계를 요청했다면, 그 행동 자체를 B로 만들지 마 (그건 요청받은 것이지 능동적 확장이 아니야).
- 일반적인 "더 도와드릴까요?" 같은 문구는 Evidence가 아니야.
- Relational Context Sufficiency(4번)가 부족하면 \`NOT_EVIDENCE\`.

### AXIS_06 — 결정 주체 (DECISION_AGENCY)

- A \`USER_DECISION_RETURNED\`
- B \`AI_DECISION_APPLIED\`

먼저 **Substantive Decision Opportunity**가 있어야 해: 실제로 의미 있는 대안들 사이에서 사용자와 ChatGPT 중 누가 최종 방향/값/옵션/행동을 결정했는지 관찰 가능한 상황이어야 한다는 뜻이야. 사실상 답이 하나뿐이었던 요청은 이 축의 Evidence로 쓰지 마.

**Task-Inherent Micro-Choice Exclusion** — 아래는 그 자체로 이 축의 Evidence가 아니야:
- 단어 선택
- 일반적인 문장 구성
- 요청받은 결과물의 세부 표현
- 일반적인 포맷팅
- 계산 과정의 중간 선택
- 코드 변수명
- 요청된 산출물을 만드는 데 통상적으로 필요한 사소한 선택

사용자가 이미 최종 값/방향을 확정했고 ChatGPT가 실행만 한 경우는 \`NOT_EVIDENCE\`야.

- A는 ChatGPT가 실질적인 선택지를 사용자에게 열어두거나 최종 선택을 요청한 positive한 행동이 있어야 해. 단순 추천만으로는 A가 아니야.
- B는 ChatGPT가 실질적인 선택을 스스로 고르고 확정·적용한 경우야. 사용자가 명시적으로 위임했고 ChatGPT가 실제로 결정을 내렸다면 그것도 B가 될 수 있어.

## 6. Conservative Condition Discovery

양방향 Evidence가 둘 다 있다고 자동으로 CONDITIONAL로 만들지 마. CONDITIONAL은 다음 중 하나를 만족할 때만 허용해:

1. 실질적으로 같은 전환 조건이 서로 다른 독립적인 사례들에서 반복적으로 나타남.
2. 접근 가능한, 명시적인 이전 규칙/작업 조건이 방향 차이를 직접 설명함.

한 쌍의 사례만 보고 조건을 만들어내지 마. 그럴듯한 조건 후보가 여럿 있을 때 그중 하나를 사후에 임의로 고르지 마. 조건이 충분히 뒷받침되지 않으면 CONDITIONAL이 아니라 UNRESOLVED로 남겨.

## 7. Axis Result 작성 규칙

각 Axis는 \`direction\` / \`mode\` / \`confidence\` / \`condition_summary\` / \`supported_pattern\` / \`evidence_ids\` / \`counterevidence_ids\` / \`unknown_reason\`을 가져.

- **STABLE**: \`direction\`은 A 또는 B 중 실제로 확인된 값. 그 Direction을 지지하는 Evidence를 \`evidence_ids\`에.
- **CONDITIONAL**: \`direction\`은 문자열 \`"CONDITIONAL"\`. 양방향 Evidence를 모두 \`evidence_ids\`에 담아. \`counterevidence_ids\`는 항상 빈 배열 \`[]\` (CONDITIONAL은 반증 개념이 아니라 양방향 증거이기 때문).
- **UNRESOLVED**: \`direction\`은 문자열 \`"UNRESOLVED"\`. 관련 있는 Evidence가 있으면 모두 \`evidence_ids\`에 담아. \`counterevidence_ids\`는 항상 빈 배열 \`[]\`. 충돌이 있었다면 그 내용은 \`condition_summary\`가 아니라 \`unknown_reason\`에 적어.
- \`unknown_reason\` 후보: \`INSUFFICIENT_EVIDENCE\` / \`INSUFFICIENT_OPPORTUNITY\` / \`UNEXPLAINED_CONTRADICTION\` / \`ACCESS_LIMITATION\`.

## 8. Confidence의 정의

confidence는 **"이 Direction이 맞을 확률"이 아니라, "지금 이 Axis Result 전체가 접근 가능한 Evidence에 의해 얼마나 안정적으로 지지되는가"**를 뜻해.

- **LOW**: 근거가 매우 제한적이거나, 근거의 질(quality)·관찰 기회(opportunity)·설명 메커니즘이 약함.
- **MEDIUM**: 직접 관련된 Evidence가 있고 지금 Result를 선택할 정도는 되지만, 반복·독립적 사례·다른 맥락에서의 뒷받침이 제한적임.
- **HIGH**: 서로 다른 독립적인 Observation 여러 개에서 같은 메커니즘이 반복 확인되고, Evidence의 질과 관찰 기회가 충분하며, 반증 가능성까지 검토를 거침.

**단 하나의 매우 명확한 Observation만으로 반복되는 행동 패턴에 HIGH를 주지 마.** (HIGH는 항상 "반복"을 요구해.)

UNRESOLVED라도, 그 모순(contradiction) 자체가 여러 독립적인 Evidence로 강하게 확인된다면 confidence는 MEDIUM/HIGH일 수 있어 — "판단 불가"와 "그 판단 불가 상태에 대한 확신"은 다른 것이야.

## 9. 역할 구성 (Roles)

지금 너의 역할을 아래 5개 중에서만 골라 분류해:

- INFORMATION_UNDERSTANDING (정보 이해)
- ANALYSIS_JUDGMENT (분석·판단)
- CREATION_PRODUCTION (창작·제작)
- EXECUTION_MANAGEMENT (실행·관리)
- CONVERSATION_ORGANIZATION (대화·정리)

각 역할마다 PRIMARY_ROLE(주요 역할) / SECONDARY_ROLE(보조 역할) / NOT_ESTABLISHED(아직 확인 안 됨) 중 하나로 분류하고 확신도(LOW/MEDIUM/HIGH)를 매겨. 역할 구성비(%)는 매기지 마 — 실제로 측정할 수 없는 숫자야. PRIMARY_ROLE은 보통 1~2개를 넘지 않아. 근거는 Locked Observation의 \`evidence_ids\`로 남겨.

## 10. 반복되는 개인 습관 (Personal Habits)

역할이나 행동 축으로 설명되지 않는, 더 작고 구체적인 반복 습관이 있으면 적어줘 (예: 항상 목록 형식을 요구함, 특정 어투를 교정함, 코드에 항상 주석을 요구함 등). 근거가 부족하면 억지로 채우지 말고 빈 목록으로 둬도 괜찮아.

## 11. 도출된 패턴 (Derived Patterns)

위 역할·행동 축·습관을 종합했을 때만 보이는 더 상위의 패턴이 있으면 적어줘. 개별 항목의 재진술이 아니라, 여러 항목이 결합될 때만 드러나는 것이어야 해. 근거가 부족하면 빈 목록으로 둬도 괜찮아.

## 12. 개인화의 출처 (Attribution) — Attribution Separation

지금 관찰되는 주요 행동이 어디서 비롯됐을 가능성이 큰지 항목별로 표시해:

- EXPLICIT: 사용자가 직접 설정한 지침·저장된 정보 때문
- LEARNED: 반복적인 대화와 피드백으로 형성된 것
- CONTEXTUAL: 지금 이 대화의 맥락 때문
- SITUATIONAL: 그때그때 상황 요인 때문
- BASELINE_POSSIBLE: 개인화 없이도 나타날 수 있는 기본 동작일 가능성

하나의 행동에 여러 출처가 섞여 있으면 그렇게 표시하고, 확신도는 LIMITED/MODERATE/STRONG 중 하나로, 그렇게 판단한 이유도 함께 적어줘. "LEARNED"라고 해서 "완벽하게 학습했다" 같은 과장된 표현은 쓰지 마.

**Attribution은 "왜 이런 행동이 나타났는가"에 대한 보수적인 설명일 뿐, "무슨 Type인가"를 결정하는 근거가 아니야.** 13~14번(Type Signature/Label)을 판단할 때 Attribution의 강도를 근거로 쓰지 마.

## 13. Type Signature Confidence Gate

Type Signature의 핵심 재료는 원칙적으로 **MEDIUM 또는 HIGH confidence로 지지된 Result만** 사용해. LOW confidence Result는 보조 설명으로만 쓰고, Type Signature나 Type Label을 결정하는 핵심 재료로 승격하지 마.

## 14. Type Label Semantic Anchoring

Type Label을 붙이려면, 위에서 만든 Type Signature(primary_roles / core_behaviors / derived_patterns 등)에 실제로 포함된 **강하게 지지된 요소**(주요 역할 하나, 뚜렷하게 확인된 행동 축의 supported_pattern, 또는 도출된 패턴 중 하나) 중 최소 하나와 의미적으로 분명히 연결되어야 해.

- Signature와 무관한 추상적인 이름을 만들지 마.
- 충분한 Signature가 없으면 \`type.label\`은 \`null\`. 이름을 지어내지 마 — null도 정상적인 결과야.
- 이름을 붙인다면: 짧고 기억하기 쉬우며 행동 중심이어야 해. 능력 수준, 성격, 우열, 의료/심리 진단을 암시하는 이름·MBTI 같은 코드형 표현은 쓰지 마.
- 왜 그 이름이 적절한지, Signature의 어떤 요소와 연결되는지 2~4문장으로 설명해줘.

## 15. 반증 및 불확실성 점검

지금까지의 분석이 실제 개인화가 아니라 이 진단이 개인화된 답변을 유도했기 때문에 생긴 그럴듯한 설명일 가능성을 검토해. 다음을 구분해:

1. 실제 개인화라고 비교적 자신 있게 판단할 수 있는 것
2. 개인화일 가능성은 있지만 확신하기 어려운 것
3. 이 진단이 유도했거나 일반적인 ChatGPT 행동을 개인화로 오인했을 가능성이 있는 것

이 판단은 위 축·역할·습관·패턴의 확신도에 반영해줘.

---

이제 위 내용을 바탕으로 사람이 읽는 자연어 분석을 먼저 자유롭게 서술해줘 (Stage-Gated Pipeline 순서를 따라가며 설명하면 돼). 사용자-facing 설명 문장의 주어는 ChatGPT의 행동이어야 해 (예: "당신은 결정을 직접 내리는 성향입니다" 대신 "ChatGPT가 최종 선택을 사용자에게 돌려주는 행동이 반복해서 나타났습니다").

그 다음, 답변의 **가장 마지막에**, 다른 설명 없이 아래 JSON 스키마를 그대로 채운 JSON 객체 하나만 코드블록(\`\`\`json ... \`\`\`)으로 출력해줘. 이 JSON은 서술한 내용을 요약하거나 대체하는 것이 아니라, 웹페이지가 자동으로 결과를 읽기 위한 별도의 기계 판독용 데이터야.

Output 규칙:

- 모든 key를 그대로 포함해. 값이 없으면 \`null\` 또는 빈 배열 \`[]\`을 써. 문자열 \`"없음"\`을 쓰지 마.
- \`schema_version\`은 반드시 정확히 \`"1.0"\` 문자열이어야 해.
- \`type.label\`은 14번(Semantic Anchoring)을 만족하지 못하면 반드시 \`null\`.
- \`roles[].role\`은 반드시 9번의 5개 값 중 하나.
- \`axes\`는 반드시 AXIS_01~AXIS_06 여섯 개를 모두 포함해야 해.
- \`axes[].mode\`가 \`CONDITIONAL\`이면 \`direction\`은 \`"CONDITIONAL"\`, \`counterevidence_ids\`는 \`[]\`.
- \`axes[].mode\`가 \`UNRESOLVED\`이면 \`direction\`은 \`"UNRESOLVED"\`, \`counterevidence_ids\`는 \`[]\`.
- 각 축의 \`direction\`은 반드시 그 축에 정의된 두 값(A/B) 중 하나이거나, CONDITIONAL/UNRESOLVED일 때의 위 규칙을 따라야 해. 존재하지 않는 값을 만들어내지 마.
- \`evidence_ids\`/\`counterevidence_ids\`는 반드시 \`evidence.observations[].observation_id\`에 실제로 존재하는 값만 참조해. 없는 id를 새로 만들지 마.
- \`attribution[].certainty\`는 LIMITED / MODERATE / STRONG 중 하나로.
- 모든 \`confidence\` 값은 LOW / MEDIUM / HIGH 중 하나로.
- \`evidence.observations\`의 각 항목은 \`observation_id\` / \`behavior\` / \`context\` / \`metadata\`를 가져.

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
    "observations": [
      {
        "observation_id": "OBS_01",
        "behavior": "",
        "context": "",
        "metadata": {}
      }
    ]
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
  var v1StatusRow = document.getElementById("v1StatusRow");
  var v1TypePendingPill = document.getElementById("v1TypePendingPill");
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

  // The two valid `direction` values per axis (Diagnostic Prompt section
  // 5). Direction enum validation (Parser Safety Patch): a STABLE axis
  // whose direction isn't one of these two exact strings is never
  // humanized and displayed as if it were a real finding — see the
  // "Direction enum validation" block in normalizeSchemaV1() below.
  var AXIS_VALID_DIRECTIONS = {
    AXIS_01: ["CURRENT_REQUEST_FOCUSED", "ACCUMULATED_CONTEXT_INTEGRATED"],
    AXIS_02: ["EXPLICIT_TASK_FOCUSED", "HIGHER_GOAL_INTEGRATED"],
    AXIS_03: ["SOLUTION_DELIVERY", "SHARED_REASONING_DEVELOPMENT"],
    AXIS_04: ["DIRECTION_PRESERVING", "DIRECTION_REEVALUATING"],
    AXIS_05: ["REQUEST_SCOPE_BOUND", "PROACTIVE_SCOPE_EXPANSION"],
    AXIS_06: ["USER_DECISION_RETURNED", "AI_DECISION_APPLIED"],
  };

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
  // Evidence reference integrity: an id that doesn't name a real, Locked
  // Observation is dropped rather than trusted or fabricated into a new
  // one — the array just ends up shorter. No UI copy is ever generated
  // from a dangling id.
  function filterValidIds(ids, validIdSet) {
    return (isArray(ids) ? ids : []).filter(function (id) {
      return isString(id) && validIdSet[id];
    });
  }

  function normalizeSchemaV1(data) {
    var dm = data.diagnostic_meta || {};
    var type = data.type || {};

    // evidence.observations items are expected to be
    // {observation_id, behavior, context, metadata} per the Diagnostic
    // Prompt's Output Contract. Tolerate older/looser shapes (a plain
    // string, or an object missing observation_id) defensively — they
    // just contribute nothing to the valid-id set below, rather than
    // breaking parsing.
    var rawObservations = (data.evidence && isArray(data.evidence.observations)) ? data.evidence.observations : [];
    var observations = rawObservations.map(function (obs) {
      if (isString(obs)) return { observationId: "", behavior: obs, context: "", metadata: {} };
      if (isPlainObject(obs)) {
        return {
          observationId: isString(obs.observation_id) ? obs.observation_id : "",
          behavior: isString(obs.behavior) ? obs.behavior : "",
          context: isString(obs.context) ? obs.context : "",
          metadata: isPlainObject(obs.metadata) ? obs.metadata : {},
        };
      }
      return { observationId: "", behavior: String(obs), context: "", metadata: {} };
    });
    var validObservationIds = {};
    observations.forEach(function (obs) {
      if (obs.observationId) validObservationIds[obs.observationId] = true;
    });

    var roles = (isArray(data.roles) ? data.roles : []).map(function (r) {
      r = r || {};
      return {
        roleKey: isString(r.role) ? r.role : "",
        classification: oneOf(r.classification, ROLE_CLASSIFICATION_VALUES) ? r.classification : "NOT_ESTABLISHED",
        confidence: oneOf(r.confidence, CONFIDENCE_VALUES) ? r.confidence : "LOW",
        evidenceIds: filterValidIds(r.evidence_ids, validObservationIds),
      };
    });

    var axes = (isArray(data.axes) ? data.axes : []).map(function (a) {
      a = a || {};
      var axisId = isString(a.axis_id) ? a.axis_id : "";
      var mode = oneOf(a.mode, AXIS_MODE_VALUES) ? a.mode : "UNRESOLVED";
      var validDirections = AXIS_VALID_DIRECTIONS[axisId] || [];
      var rawDirection = isString(a.direction) ? a.direction : "";

      // Direction enum validation (Parser Safety Patch): a STABLE result
      // whose direction isn't one of the axis's two real values is never
      // shown as a finding — the whole axis is demoted to UNRESOLVED
      // instead of humanizing and displaying the invalid string.
      if (mode === "STABLE" && validDirections.indexOf(rawDirection) === -1) {
        mode = "UNRESOLVED";
      }

      var direction;
      var counterevidenceIds;
      if (mode === "STABLE") {
        direction = rawDirection;
        counterevidenceIds = filterValidIds(a.counterevidence_ids, validObservationIds);
      } else if (mode === "CONDITIONAL") {
        // CONDITIONAL normalization: direction is the literal string
        // "CONDITIONAL" and counterevidence_ids is always forced to []
        // (CONDITIONAL is bidirectional evidence, not a counter-evidence
        // concept).
        direction = "CONDITIONAL";
        counterevidenceIds = [];
      } else {
        // UNRESOLVED normalization: direction is the literal string
        // "UNRESOLVED" and counterevidence_ids is always forced to [].
        direction = "UNRESOLVED";
        counterevidenceIds = [];
      }

      return {
        axisId: axisId,
        axisName: isString(a.axis_name) ? a.axis_name : "",
        direction: direction,
        mode: mode,
        confidence: oneOf(a.confidence, CONFIDENCE_VALUES) ? a.confidence : "LOW",
        conditionSummary: isString(a.condition_summary) ? a.condition_summary : null,
        supportedPattern: mode === "STABLE" && isString(a.supported_pattern) ? a.supported_pattern : null,
        unknownReason: isString(a.unknown_reason) ? a.unknown_reason : null,
        evidenceIds: filterValidIds(a.evidence_ids, validObservationIds),
        counterevidenceIds: counterevidenceIds,
      };
    });

    var personalHabits = (isArray(data.personal_habits) ? data.personal_habits : [])
      .map(function (h) {
        h = h || {};
        return {
          habit: isString(h.habit) ? h.habit.trim() : "",
          category: isString(h.category) ? h.category : "",
          confidence: oneOf(h.confidence, CONFIDENCE_VALUES) ? h.confidence : "LOW",
          evidenceIds: filterValidIds(h.evidence_ids, validObservationIds),
        };
      })
      .filter(function (h) { return h.habit; });

    var derivedPatterns = (isArray(data.derived_patterns) ? data.derived_patterns : [])
      .map(function (p) {
        p = p || {};
        return {
          pattern: isString(p.pattern) ? p.pattern.trim() : "",
          confidence: oneOf(p.confidence, CONFIDENCE_VALUES) ? p.confidence : "LOW",
          evidenceIds: filterValidIds(p.evidence_ids, validObservationIds),
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

    // Type Confidence Gate, re-checked at render time (defense in depth —
    // the prompt already asks the engine to enforce this, but the UI must
    // never promote a label the underlying data doesn't actually support).
    // A non-null label is kept only if at least one MEDIUM/HIGH-confidence
    // primary role, STABLE axis, or derived pattern exists to anchor it.
    // Attribution is deliberately excluded from this signal — Attribution
    // Separation means "why" is never material for "what type".
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
    v1StatusRow.hidden = true;
    v1TypePendingPill.hidden = true;
    v1StatusPill.hidden = true;
    v1TypeSummary.hidden = true;
    v1Sections.hidden = true;
    resultLegacyBody.hidden = false;
    resultType.classList.remove("v1-headline-plain");

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

  // Result UX v2 — presentation-only. None of this changes what the
  // Diagnostic Prompt asks for or how Schema 1.0 is parsed/normalized;
  // it only changes how an already-normalized result is displayed. See
  // buildHeroHeadline()/pickDisplayRoles()/pickCoreBehaviors() below for
  // where the Hero-hierarchy and internal-enum-hiding rules land.
  var TYPE_NULL_FALLBACK_TEXT = "아직 하나의 타입으로 묶기엔 근거가 부족해요";
  // Short badge used wherever type.label is null (Hero, share card, share
  // text) — kept to one canonical phrase across all three surfaces.
  var TYPE_PENDING_BADGE = "TYPE LABEL · 아직 보류";

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
  // A STABLE axis's badge text now depends on confidence, not a single
  // static "뚜렷한 경향" label — the badge is the one place confidence
  // was implicitly visible before, so it should actually say something
  // (result UX v2, section 4) rather than hide the distinction entirely.
  var AXIS_STABLE_CONFIDENCE_DISPLAY = {
    LOW: "제한적으로 확인됨",
    MEDIUM: "확인된 패턴",
    HIGH: "반복 확인된 패턴",
  };
  var AXIS_MODE_DISPLAY = {
    CONDITIONAL: "상황에 따라 달라져요",
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

  // unknown_reason is an internal enum (Diagnostic Prompt section 7) —
  // never shown raw in the main axis card. Kept mapped here so the main
  // UI can state *why* an axis is UNRESOLVED in plain language instead of
  // silently omitting the reason.
  var UNKNOWN_REASON_DISPLAY = {
    INSUFFICIENT_EVIDENCE: "아직 판단할 근거가 충분하지 않아요",
    INSUFFICIENT_OPPORTUNITY: "이 행동을 판단할 만한 상황이 충분히 나타나지 않았어요",
    UNEXPLAINED_CONTRADICTION: "서로 다른 행동이 확인됐지만 아직 전환 조건을 설명하기 어려워요",
    ACCESS_LIMITATION: "확인할 수 있는 대화 범위가 제한되어 있어요",
  };

  function humanizeEnum(key) {
    return key ? String(key).toLowerCase().replace(/_/g, " ") : "";
  }
  function roleDisplayName(roleKey) {
    return ROLE_DISPLAY_MAP[roleKey] || humanizeEnum(roleKey) || "역할 미상";
  }
  function confidenceRank(c) { return CONFIDENCE_VALUES.indexOf(c); }

  // Best-effort cleanup for free text the engine authored (type.summary,
  // derived_patterns[].pattern, axes[].supported_pattern/condition_summary)
  // in case a stray internal token (English jargon, a raw enum word)
  // leaked into otherwise natural-language Korean prose. This never
  // changes the diagnostic *meaning* of the text — it only swaps a small,
  // fixed set of known internal tokens for their user-facing phrasing
  // (Result UX v2, section 12). It is not a substitute for the Diagnostic
  // Prompt asking for clean output in the first place.
  var INTERNAL_JARGON_REPLACEMENTS = [
    [/\bEvidence\b/g, "확인된 대화"],
    [/\bINSUFFICIENT_EVIDENCE\b/g, UNKNOWN_REASON_DISPLAY.INSUFFICIENT_EVIDENCE],
    [/\bINSUFFICIENT_OPPORTUNITY\b/g, UNKNOWN_REASON_DISPLAY.INSUFFICIENT_OPPORTUNITY],
    [/\bUNEXPLAINED_CONTRADICTION\b/g, UNKNOWN_REASON_DISPLAY.UNEXPLAINED_CONTRADICTION],
    [/\bACCESS_LIMITATION\b/g, UNKNOWN_REASON_DISPLAY.ACCESS_LIMITATION],
    [/\bSTABLE\b/g, "뚜렷한 경향"],
    [/\bCONDITIONAL\b/g, "상황에 따라 달라지는 경향"],
    [/\bUNRESOLVED\b/g, "아직 판단하기 어려운 상태"],
    [/\bHIGH\b/g, "반복적으로 확인된 수준"],
    [/\bMEDIUM\b/g, "어느 정도 확인된 수준"],
    [/\bLOW\b/g, "제한적인 수준"],
  ];
  function sanitizeUserFacingText(text) {
    if (!text) return text;
    var out = text;
    INTERNAL_JARGON_REPLACEMENTS.forEach(function (pair) { out = out.replace(pair[0], pair[1]); });
    return out.replace(/\s{2,}/g, " ").trim();
  }

  // Caps engine-authored free text to at most maxSentences sentences and
  // maxChars characters, so a very long or observation-styled sentence
  // never dominates a compact card. Splits on '.', '!', '?' where
  // present; text with no terminator is treated as one sentence and
  // still gets the character cap.
  function capSentences(text, maxSentences, maxChars) {
    if (!text) return "";
    var sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    var capped = sentences.slice(0, maxSentences).join("").trim();
    if (capped.length > maxChars) capped = capped.slice(0, maxChars - 1).trim() + "…";
    return capped;
  }

  // Roles shown in the main result: PRIMARY_ROLE first, then
  // SECONDARY_ROLE with MEDIUM/HIGH confidence only (a LOW-confidence
  // secondary role is hidden from the main result — Result UX v2,
  // section 7). NOT_ESTABLISHED is never listed. Secondary is capped at
  // 2 so the role area doesn't read as "does everything".
  function pickDisplayRoles(roles) {
    var primary = roles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; });
    var secondary = roles
      .filter(function (r) { return r.classification === "SECONDARY_ROLE" && r.confidence !== "LOW"; })
      .slice(0, 2);
    return primary.concat(secondary);
  }

  // "당신의 ChatGPT는 이렇게 작동해요": derived patterns and STABLE axes
  // that clear MEDIUM/HIGH confidence, capped at 3. Never padded with
  // low-confidence filler just to fill card slots. Text is sanitized and
  // capped to at most 2 sentences so an overly long or observation-styled
  // engine sentence doesn't take over the card (Result UX v2, section 6).
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
    return candidates.slice(0, 3).map(function (c) {
      return { text: capSentences(sanitizeUserFacingText(c.text), 2, 100), confidence: c.confidence };
    });
  }

  // Hero headline when type.label is null (Result UX v2, section 1-2):
  // the confirmed behavior becomes the star, not the "no type yet"
  // notice — but it must never fuse two independent Supported Results
  // (e.g. Primary Role + an unrelated Axis behavior) into one
  // synthesized sentence. Doing so would imply a Role -> Behavior
  // relationship the engine never established, recreating the
  // "independent evidence combined after the fact" problem Derived
  // Pattern synthesis exists to prevent. Each branch here uses exactly
  // one independent result; anything else worth showing goes in the
  // supporting area below, kept visually separate — see
  // renderTypeSupportingArea().
  function buildHeroHeadline(normalized, behaviors, primaryRole) {
    if (normalized.typeLabel) return normalized.typeLabel;
    if (primaryRole) return "ChatGPT가 " + roleDisplayName(primaryRole.roleKey) + " 역할을 주로 맡고 있어요.";
    if (behaviors[0]) return behaviors[0].text;
    return "아직 뚜렷하게 확인된 행동 패턴이 많지 않아요.";
  }

  // Content for the small text under the Hero headline.
  // - Type Label present: the engine's own type.summary (unchanged).
  // - Type Label null, headline used Primary Role alone: confirmed
  //   behaviors are listed as independent "확인된 행동 · ..." lines —
  //   never woven into one sentence with the role, so no new Role <->
  //   Behavior relationship is implied.
  // - Type Label null, no Primary Role (headline already used a
  //   behavior, or nothing at all): falls back to type.summary if the
  //   engine wrote one, sanitized; otherwise nothing to show.
  // Returns true if it rendered anything (caller uses this to decide
  // whether to unhide the container).
  function renderTypeSupportingArea(container, normalized, primaryRoleUsedAsHeadline, behaviors) {
    while (container.firstChild) container.removeChild(container.firstChild);

    if (normalized.typeLabel) {
      if (!normalized.typeSummary) return false;
      var p = document.createElement("p");
      p.className = "v1-type-summary-text";
      p.textContent = sanitizeUserFacingText(normalized.typeSummary);
      container.appendChild(p);
      return true;
    }

    if (primaryRoleUsedAsHeadline && behaviors.length) {
      behaviors.slice(0, 2).forEach(function (b) {
        var line = document.createElement("p");
        line.className = "v1-confirmed-behavior";
        line.textContent = "확인된 행동 · " + b.text;
        container.appendChild(line);
      });
      return true;
    }

    if (normalized.typeSummary) {
      var p2 = document.createElement("p");
      p2.className = "v1-type-summary-text";
      p2.textContent = sanitizeUserFacingText(normalized.typeSummary);
      container.appendChild(p2);
      return true;
    }

    return false;
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

  // Primary Role is the anchor (bigger, standalone); everything else
  // (extra roles beyond the first, MEDIUM/HIGH secondaries) renders as
  // small chips underneath so the role area doesn't read as "does
  // everything" (Result UX v2, sections 7-8).
  function buildRoleChip(role) {
    var chip = document.createElement("span");
    chip.className = "v1-role-chip";
    chip.appendChild(buildGlyphSvg(mapRoleToGlyph(roleDisplayName(role.roleKey)), "v1-role-chip-glyph"));
    var nameSpan = document.createElement("span");
    nameSpan.textContent = roleDisplayName(role.roleKey);
    chip.appendChild(nameSpan);
    return chip;
  }

  function renderRoleSection(container, roles) {
    while (container.firstChild) container.removeChild(container.firstChild);
    if (!roles.length) return;

    // roles[0] from pickDisplayRoles() is a PRIMARY_ROLE whenever one
    // exists (primaries are concatenated first) — that one becomes the
    // anchor block; everything else becomes chips.
    var anchor = roles[0].classification === "PRIMARY_ROLE" ? roles[0] : null;
    var rest = anchor ? roles.slice(1) : roles;

    if (anchor) {
      var block = document.createElement("div");
      block.className = "v1-role-primary";
      block.appendChild(buildGlyphSvg(mapRoleToGlyph(roleDisplayName(anchor.roleKey)), "v1-role-primary-glyph"));
      var textWrap = document.createElement("div");
      textWrap.className = "v1-role-primary-text";
      var name = document.createElement("span");
      name.className = "v1-role-primary-name";
      name.textContent = roleDisplayName(anchor.roleKey);
      var caption = document.createElement("span");
      caption.className = "v1-role-primary-caption";
      caption.textContent = ROLE_CLASSIFICATION_DISPLAY.PRIMARY_ROLE;
      textWrap.appendChild(name);
      textWrap.appendChild(caption);
      block.appendChild(textWrap);
      container.appendChild(block);
    }

    if (rest.length) {
      var group = document.createElement("div");
      group.className = "v1-role-secondary-group";
      var label = document.createElement("span");
      label.className = "v1-role-secondary-label";
      // Almost always true secondaries; only says something more neutral
      // in the rare case the engine reported more than one PRIMARY_ROLE.
      var allSecondary = rest.every(function (r) { return r.classification === "SECONDARY_ROLE"; });
      label.textContent = allSecondary ? ROLE_CLASSIFICATION_DISPLAY.SECONDARY_ROLE : "함께 확인된 역할";
      group.appendChild(label);
      var chips = document.createElement("div");
      chips.className = "v1-role-secondary-chips";
      rest.forEach(function (r) { chips.appendChild(buildRoleChip(r)); });
      group.appendChild(chips);
      container.appendChild(group);
    }
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
    // STABLE's badge text depends on confidence (LOW/MEDIUM/HIGH), never
    // shown as the raw enum word itself — see AXIS_STABLE_CONFIDENCE_DISPLAY.
    mode.textContent = axis.mode === "STABLE"
      ? (AXIS_STABLE_CONFIDENCE_DISPLAY[axis.confidence] || AXIS_STABLE_CONFIDENCE_DISPLAY.MEDIUM)
      : AXIS_MODE_DISPLAY[axis.mode];
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
        note.textContent = capSentences(sanitizeUserFacingText(axis.supportedPattern), 2, 90);
        card.appendChild(note);
      }
    } else if (axis.mode === "CONDITIONAL") {
      var cond = document.createElement("p");
      cond.className = "v1-axis-note";
      cond.textContent = axis.conditionSummary
        ? capSentences(sanitizeUserFacingText(axis.conditionSummary), 2, 90)
        : "상황에 따라 다르게 나타나요.";
      card.appendChild(cond);
    } else {
      // unknown_reason is an internal enum (INSUFFICIENT_EVIDENCE, ...) —
      // always mapped to plain language here, never appended raw.
      var unresolved = document.createElement("p");
      unresolved.className = "v1-axis-note";
      var reasonText = axis.unknownReason
        ? (UNKNOWN_REASON_DISPLAY[axis.unknownReason] || sanitizeUserFacingText(humanizeEnum(axis.unknownReason)))
        : "";
      unresolved.textContent = "아직 한 방향으로 판단하기 어려워요" + (reasonText ? " — " + reasonText : ".");
      card.appendChild(unresolved);
    }

    return card;
  }

  // normalized.observations items are already normalized (by
  // normalizeSchemaV1) into {observationId, behavior, context, metadata}
  // regardless of how loosely the engine shaped them — this just renders
  // that fixed shape.
  function observationText(obs) {
    if (!obs || !obs.behavior) return "";
    return obs.observationId ? obs.observationId + ": " + obs.behavior : obs.behavior;
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

    var observationTexts = normalized.observations.map(observationText).filter(Boolean);
    if (observationTexts.length) {
      var h4b = document.createElement("h4");
      h4b.textContent = "사용된 관찰 근거 (" + observationTexts.length + "개)";
      v1DetailBody.appendChild(h4b);
      var ul2 = document.createElement("ul");
      observationTexts.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        ul2.appendChild(li);
      });
      v1DetailBody.appendChild(ul2);
    }

    // Raw engine state, for anyone who opens this accordion — internal
    // enums are fine to show here (Result UX v2, section 11), just never
    // in the main result above.
    addSection("판단 상태 (원본)", normalized.axes.map(function (a) {
      var display = AXIS_DISPLAY[a.axisId];
      var axisLabel = display ? display.name : (humanizeEnum(a.axisName) || a.axisId);
      return axisLabel + ": " + a.mode + " · " + a.confidence;
    }));

    if (!normalized.typeLabel) {
      var h4c = document.createElement("h4");
      h4c.textContent = "Type 판단";
      var pc = document.createElement("p");
      pc.style.margin = "0";
      pc.textContent = TYPE_NULL_FALLBACK_TEXT;
      v1DetailBody.appendChild(h4c);
      v1DetailBody.appendChild(pc);
    }
  }

  function renderV1Result(normalized) {
    resultLegacyBody.hidden = true;

    var displayRoles = pickDisplayRoles(normalized.roles);
    var primaryRole = displayRoles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; })[0];
    var behaviors = pickCoreBehaviors(normalized);
    var hasLabel = !!normalized.typeLabel;

    // ---- Hero (Result UX v2, sections 1-2) ----
    // Type Label present: headline = the label (unchanged gradient
    // treatment). Type Label null: the confirmed behavior becomes the
    // headline instead of the "no type yet" notice — that notice moves
    // to a small pill below, alongside the diagnostic status pill.
    resultType.textContent = buildHeroHeadline(normalized, behaviors, primaryRole);
    resultType.classList.toggle("v1-headline-plain", !hasLabel);

    // primaryRoleUsedAsHeadline mirrors buildHeroHeadline()'s own
    // branch order exactly, so the supporting area never repeats
    // whatever the headline already said.
    var primaryRoleUsedAsHeadline = !hasLabel && !!primaryRole;
    var hasSupporting = renderTypeSupportingArea(v1TypeSummary, normalized, primaryRoleUsedAsHeadline, behaviors);
    v1TypeSummary.hidden = !hasSupporting;

    v1StatusRow.hidden = false;
    v1TypePendingPill.hidden = hasLabel;
    v1TypePendingPill.textContent = hasLabel ? "" : TYPE_PENDING_BADGE;
    v1StatusPill.hidden = false;
    v1StatusPill.textContent = STATUS_DISPLAY[normalized.status] || STATUS_DISPLAY.INSUFFICIENT;

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

    // ---- 핵심 행동 패턴 ----
    while (v1BehaviorList.firstChild) v1BehaviorList.removeChild(v1BehaviorList.firstChild);
    behaviors.forEach(function (b) {
      var li = document.createElement("li");
      li.className = "v1-behavior-item";
      li.textContent = b.text;
      v1BehaviorList.appendChild(li);
    });
    v1BehaviorSection.hidden = behaviors.length === 0;

    // ---- 주요 역할 ----
    renderRoleSection(v1RoleList, displayRoles);
    v1RoleSection.hidden = displayRoles.length === 0;

    // ---- ChatGPT 행동 축 ----
    while (v1AxisList.firstChild) v1AxisList.removeChild(v1AxisList.firstChild);
    normalized.axes.forEach(function (a) { v1AxisList.appendChild(buildAxisCard(a)); });
    v1AxisSection.hidden = normalized.axes.length === 0;

    // ---- 반복되는 습관 ----
    while (v1HabitList.firstChild) v1HabitList.removeChild(v1HabitList.firstChild);
    normalized.personalHabits.forEach(function (h) {
      var li = document.createElement("li");
      li.className = "v1-habit-item";
      li.textContent = sanitizeUserFacingText(h.habit);
      v1HabitList.appendChild(li);
    });
    v1HabitSection.hidden = normalized.personalHabits.length === 0;

    // ---- 왜 이렇게 나왔나요? ----
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

    // Result UX v2, section 14: a null type.label must never make the
    // card read as "no result". The headline becomes the confirmed
    // behavior summary (same source as the on-page Hero — never a
    // fabricated type name), and the null state is demoted to a small
    // caption instead of the big centered headline.
    var hasLabel = !!normalized.typeLabel;
    var behaviors = pickCoreBehaviors(normalized);
    var primary = displayRoles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; })[0];
    var headlineText = hasLabel ? normalized.typeLabel : buildHeroHeadline(normalized, behaviors, primary);
    var typeFit = fitText(mctx, headlineText, {
      maxWidth: 880, maxLines: hasLabel ? 2 : 3, startSize: hasLabel ? 60 : 40, minSize: hasLabel ? 36 : 26,
      fontWeight: 700, fontFamily: CARD_FONT,
    });
    var typeLineHeight = typeFit.fontSize * 1.3;
    typeFit.lines.forEach(function (line, i) {
      parts.push(textEl(cx, y + typeLineHeight * (i + 0.8), line, {
        size: typeFit.fontSize, weight: 700,
        color: hasLabel ? "url(#typeGrad)" : COLORS.pearlWhite,
        anchor: "middle",
      }));
    });
    y += typeLineHeight * typeFit.lines.length + 34;

    if (!hasLabel) {
      parts.push(textEl(cx, y, TYPE_PENDING_BADGE, { size: 22, weight: 600, color: COLORS.textMuted, anchor: "middle", letterSpacing: 1 }));
      y += 46;
    }
    y += 16;

    var left = 120, right = W - 120, areaWidth = right - left;

    // The label-present card still gets its own summary/pattern line
    // below the headline; the null-label card's headline already
    // absorbed that content, so it isn't repeated here.
    if (hasLabel) {
      var summaryText = normalized.typeSummary || (behaviors[0] && behaviors[0].text) || "";
      if (summaryText) {
        var summaryFit = fitText(mctx, summaryText, { maxWidth: areaWidth, maxLines: 3, startSize: 30, minSize: 22, fontWeight: 400, fontFamily: CARD_FONT });
        var summaryLineHeight = summaryFit.fontSize * 1.5;
        summaryFit.lines.forEach(function (line, i) {
          parts.push(textEl(cx, y + summaryLineHeight * (i + 0.8), line, { size: summaryFit.fontSize, weight: 400, color: COLORS.textMuted, anchor: "middle" }));
        });
        y += summaryLineHeight * summaryFit.lines.length + 40;
      }
    }

    parts.push('<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '" stroke="rgba(232,235,231,0.2)" stroke-dasharray="2 10" stroke-linecap="round"/>');
    y += 60;

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
  //
  // Result UX v2, section 13: when type.label is null, the confirmed
  // behavior leads and the null state is a small trailing line, not the
  // opening "유형: ..." line.
  function buildShareTextV1(normalized) {
    var displayRoles = pickDisplayRoles(normalized.roles);
    var primary = displayRoles.filter(function (r) { return r.classification === "PRIMARY_ROLE"; })[0];
    var behaviors = pickCoreBehaviors(normalized);

    var lines = [];
    lines.push("🧪 MY AI TYPE");
    lines.push("");

    if (normalized.typeLabel) {
      lines.push("유형: " + normalized.typeLabel);
      var summaryText = normalized.typeSummary || (behaviors[0] && behaviors[0].text) || "";
      if (summaryText) {
        lines.push("");
        lines.push(summaryText);
      }
      if (primary) {
        lines.push("");
        lines.push("주요 역할: " + roleDisplayName(primary.roleKey));
      }
    } else {
      lines.push("내 ChatGPT의 현재 패턴");
      lines.push("");
      if (primary) lines.push(roleDisplayName(primary.roleKey) + " 역할이 가장 분명하게 나타났어요.");
      if (behaviors[0]) lines.push(behaviors[0].text);
      if (behaviors[1]) lines.push(behaviors[1].text);
      lines.push("");
      lines.push(TYPE_PENDING_BADGE);
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
