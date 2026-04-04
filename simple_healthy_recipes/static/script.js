let player = null;
let youtubeApiRequested = false;

const QUIZ_DURATION_SECONDS = 12;

function numberToLetter(num) {
  return String.fromCharCode(64 + Number.parseInt(num, 10));
}

function startTimer(duration, display, callback) {
  let timer = duration;

  const interval = setInterval(() => {
    const seconds = String(Math.max(timer, 0)).padStart(2, "0");
    display.textContent = `00:${seconds}`;
    display.style.color = timer <= 3 ? "#b91c1c" : "";

    if (timer <= 0) {
      clearInterval(interval);
      if (typeof callback === "function") callback();
      return;
    }

    timer -= 1;
  }, 1000);

  return interval;
}

function showAnswerFeedback(isCorrect, correctAnswer) {
  const feedback = document.querySelector("#quizFeedback .feedback-content");
  const feedbackBox = document.getElementById("quizFeedback");
  if (!feedback || !feedbackBox) return;

  feedback.innerHTML = isCorrect
    ? '<div class="feedback-correct"><i class="fas fa-check-circle"></i><h4>Correct!</h4></div>'
    : `<div class="feedback-wrong"><i class="fas fa-times-circle"></i><h4>Not quite</h4><p>Correct answer: <strong>${correctAnswer}</strong></p></div>`;

  if (window.jQuery && typeof window.jQuery(feedbackBox).slideDown === "function") {
    window.jQuery(feedbackBox).stop(true, true).slideDown(180);
  } else {
    feedbackBox.style.display = "block";
  }
}

function setSpeedButtonState(speedValue) {
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    const isActive = btn.dataset.speed === speedValue;
    btn.classList.toggle("active-speed", isActive);
  });
}

function onPlayerReady(event) {
  const availableRates = event.target.getAvailablePlaybackRates
    ? event.target.getAvailablePlaybackRates()
    : [1];

  const defaultRate = [1.5, 1.25, 1].find((rate) => availableRates.includes(rate)) || 1;
  event.target.setPlaybackRate(defaultRate);
  setSpeedButtonState(String(defaultRate));
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  const iframe = document.getElementById("lessonVideo");
  if (!iframe || iframe.src.includes("about:blank")) return;
  if (!(window.YT && typeof window.YT.Player === "function")) return;

  player = new window.YT.Player("lessonVideo", {
    events: {
      onReady: onPlayerReady
    }
  });
};

function ensureYouTubeAPI() {
  const iframe = document.getElementById("lessonVideo");
  if (!iframe || iframe.src.includes("about:blank")) return;

  if (window.YT && typeof window.YT.Player === "function") {
    window.onYouTubeIframeAPIReady();
    return;
  }

  if (youtubeApiRequested) return;
  youtubeApiRequested = true;

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function initializeSpeedControls() {
  const speedButtons = document.querySelectorAll(".speed-btn");
  if (!speedButtons.length) return;

  speedButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const speed = Number.parseFloat(btn.dataset.speed || "1");
      if (player && typeof player.setPlaybackRate === "function") {
        player.setPlaybackRate(speed);
      }
      setSpeedButtonState(btn.dataset.speed || "1");
    });
  });
}

function initializeQuizFunctions() {
  const nav = document.querySelector(".navbar");
  if (nav) {
    const handleShadow = () => {
      nav.style.boxShadow = window.scrollY > 20 ? "0 8px 20px rgba(15, 23, 42, 0.08)" : "";
    };

    handleShadow();
    window.addEventListener("scroll", handleShadow, { passive: true });
  }

  document.querySelectorAll(".option-letter").forEach((el) => {
    el.textContent = numberToLetter(el.textContent);
  });

  const timerElement = document.getElementById("quizTimer");
  const quizForm = document.getElementById("quizForm");
  const optionInputs = document.querySelectorAll(".quiz-option input");
  let quizTimer = null;
  let hasSubmitted = false;

  if (timerElement) {
    timerElement.textContent = `00:${String(QUIZ_DURATION_SECONDS).padStart(2, "0")}`;
  }

  const submitQuiz = (extraName, extraValue) => {
    if (!quizForm || hasSubmitted) return;
    hasSubmitted = true;

    if (extraName) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = extraName;
      hidden.value = extraValue || "1";
      quizForm.appendChild(hidden);
    }

    quizForm.submit();
  };

  if (timerElement && quizForm) {
    quizTimer = startTimer(QUIZ_DURATION_SECONDS, timerElement, () => {
      submitQuiz("timeout", "1");
    });
  }

  if (!optionInputs.length || !quizForm) return;

  optionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (quizTimer) clearInterval(quizTimer);

      optionInputs.forEach((optionInput) => {
        optionInput.disabled = true;
      });

      const selectedOption = input.closest(".quiz-option");
      const correctOptionText = document.querySelector(".quiz-option.correct .option-text");
      const correctAnswer = correctOptionText ? correctOptionText.textContent : "";
      const isCorrect = selectedOption ? selectedOption.classList.contains("correct") : false;

      showAnswerFeedback(isCorrect, correctAnswer);

      window.setTimeout(() => {
        submitQuiz(isCorrect ? "" : "show_feedback", "1");
      }, isCorrect ? 900 : 1400);
    });
  });
}

function openSuccessModal(modalElement) {
  if (window.bootstrap && typeof window.bootstrap.Modal === "function") {
    const modalInstance = new window.bootstrap.Modal(modalElement);
    modalInstance.show();
    return;
  }

  if (window.jQuery && typeof window.jQuery(modalElement).modal === "function") {
    window.jQuery(modalElement).modal("show");
    return;
  }

  modalElement.style.display = "block";
  modalElement.classList.add("show");
}

function initializePastaGame() {
  const dragItems = document.querySelectorAll(".drag-item");
  const dropArea = document.querySelector(".drop-area");
  const ingredientsAdded = document.querySelector(".ingredients-added");
  const steps = document.querySelectorAll(".steps-list li");
  const checkRecipeBtn = document.getElementById("checkRecipeBtn");
  const modalElement = document.getElementById("successModal");
  const modalButton = document.getElementById("successModalButton");

  if (!dragItems.length || !dropArea || !ingredientsAdded || !checkRecipeBtn) return;

  const addedSteps = [];

  const markStepCompleted = (stepNumber) => {
    steps.forEach((step) => {
      if (Number.parseInt(step.dataset.step, 10) === stepNumber) {
        step.classList.add("completed");
      }
    });
  };

  const showWrongStepMessage = (correctStep) => {
    const hints = {
      1: "Start with water first.",
      2: "Add salt after water.",
      3: "Pasta goes in last."
    };

    const existingAlert = dropArea.querySelector(".alert");
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-danger mt-3 mb-0";
    alertDiv.textContent = hints[correctStep] || "Follow the recipe order.";
    dropArea.appendChild(alertDiv);

    window.setTimeout(() => {
      alertDiv.remove();
    }, 2200);
  };

  const dragStart = function dragStart() {
    this.classList.add("dragging");
  };

  const dragEnd = function dragEnd() {
    this.classList.remove("dragging");
  };

  const dragOver = (event) => {
    event.preventDefault();
  };

  const dragEnter = (event) => {
    event.preventDefault();
    dropArea.classList.add("highlight");
  };

  const dragLeave = () => {
    dropArea.classList.remove("highlight");
  };

  const drop = (event) => {
    event.preventDefault();
    dropArea.classList.remove("highlight");

    const draggedItem = document.querySelector(".drag-item.dragging");
    if (!draggedItem) return;

    const stepNumber = Number.parseInt(draggedItem.dataset.step, 10);
    if (addedSteps.includes(stepNumber)) return;

    const expectedStep = addedSteps.length + 1;
    if (stepNumber !== expectedStep) {
      showWrongStepMessage(expectedStep);
      return;
    }

    addedSteps.push(stepNumber);

    const clonedItem = draggedItem.cloneNode(true);
    clonedItem.classList.remove("drag-item", "dragging");
    clonedItem.classList.add("ingredient-in-pot");
    clonedItem.draggable = false;
    ingredientsAdded.appendChild(clonedItem);

    markStepCompleted(stepNumber);

    if (addedSteps.length === 3) {
      checkRecipeBtn.disabled = false;
    }
  };

  const finishCooking = () => {
    const isCorrect = addedSteps.join(",") === "1,2,3";
    if (!isCorrect) return;

    if (modalElement) openSuccessModal(modalElement);
    document.querySelector(".drag-drop-container")?.classList.add("success-animation");

    window.setTimeout(() => {
      document.querySelector(".drag-drop-container")?.classList.remove("success-animation");
    }, 600);
  };

  dragItems.forEach((item) => {
    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragend", dragEnd);
  });

  dropArea.addEventListener("dragover", dragOver);
  dropArea.addEventListener("dragenter", dragEnter);
  dropArea.addEventListener("dragleave", dragLeave);
  dropArea.addEventListener("drop", drop);
  checkRecipeBtn.addEventListener("click", finishCooking);

  if (modalButton) {
    modalButton.addEventListener("click", () => {
      window.location.href = "/quiz/1";
    });
  }
}

function initializeFlipCardKeyboardSupport() {
  document.querySelectorAll(".flip-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      card.classList.toggle("flipped");
      event.preventDefault();
    });
  });
}

function initializeRevealAnimations() {
  const revealElements = document.querySelectorAll("[data-reveal]");
  revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-index", String(index));
  });

  window.requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeRevealAnimations();
  ensureYouTubeAPI();
  initializeSpeedControls();
  initializeQuizFunctions();
  initializePastaGame();
  initializeFlipCardKeyboardSupport();
});
