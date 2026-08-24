(function () {
  "use strict";

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
"«\"나와 오래 상호작용한 결과, 너는 ____________형 AI가 되었다.\"»";

  // ---------- Render prompt text ----------
  var promptTextEl = document.getElementById("promptText");
  if (promptTextEl) {
    promptTextEl.textContent = DIAGNOSTIC_PROMPT;
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

  // ---------- Share card generator ----------
  var generateBtn = document.getElementById("generateBtn");
  var shareResult = document.getElementById("shareResult");
  var shareOutput = document.getElementById("shareOutput");
  var shareCopyBtn = document.getElementById("shareCopyBtn");
  var shareFeedback = document.getElementById("shareFeedback");
  var webShareBtn = document.getElementById("webShareBtn");

  function buildShareText() {
    var typeName = (document.getElementById("typeName").value || "").trim();
    var roleMix = (document.getElementById("roleMix").value || "").trim();
    var traits = (document.getElementById("traits").value || "").trim();
    var accuracySelect = document.getElementById("accuracy");
    var accuracyLabel =
      accuracySelect.options[accuracySelect.selectedIndex].text;
    var opinion = (document.getElementById("opinion").value || "").trim();

    var lines = [];
    lines.push("🧪 내 ChatGPT 유형 진단 결과");
    lines.push("");
    lines.push("유형: " + (typeName || "(입력 안 함)"));
    if (roleMix) {
      lines.push("역할 구성비: " + roleMix);
    }
    if (traits) {
      lines.push("");
      lines.push("핵심 차별점:");
      traits.split("\n").forEach(function (line) {
        var t = line.trim();
        if (t) lines.push("- " + t);
      });
    }
    if (accuracySelect.value) {
      lines.push("");
      lines.push("실제 경험과의 일치도: " + accuracyLabel);
    }
    if (opinion) {
      lines.push("");
      lines.push("한줄평: " + opinion);
    }
    lines.push("");
    lines.push("#AI개인화랩 #내ChatGPT유형");

    return lines.join("\n");
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", function () {
      var typeName = document.getElementById("typeName").value.trim();
      if (!typeName) {
        document.getElementById("typeName").focus();
        return;
      }
      var text = buildShareText();
      shareOutput.textContent = text;
      shareResult.hidden = false;
      shareResult.scrollIntoView({ behavior: "smooth", block: "nearest" });

      if (navigator.share) {
        webShareBtn.hidden = false;
      }
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener("click", function () {
      copyToClipboard(shareOutput.textContent).then(
        function () {
          showFeedback(shareFeedback, "복사 완료! 원하는 곳에 붙여넣어 보세요.", false);
        },
        function () {
          showFeedback(shareFeedback, "복사에 실패했어요. 텍스트를 직접 선택해서 복사해주세요.", true);
        }
      );
    });
  }

  if (webShareBtn) {
    webShareBtn.addEventListener("click", function () {
      if (navigator.share) {
        navigator.share({ text: shareOutput.textContent }).catch(function () {
          /* user cancelled or unsupported — no-op */
        });
      }
    });
  }
})();
