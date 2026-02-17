(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }

  function createWidget() {
    var cfg = window.__diplodocFeedbackForm;
    if (!cfg || !cfg.endpoint) return null;

    var wrap = document.createElement("section");
    wrap.className = "dd-feedback";
    wrap.innerHTML = `
      <div class="dd-feedback__title">Была ли эта страница полезной?</div>
      <div class="dd-feedback__row">
        <button type="button" class="dd-feedback__btn" data-v="like" aria-pressed="false">Нравится</button>
        <button type="button" class="dd-feedback__btn" data-v="dislike" aria-pressed="false">Не нравится</button>
      </div>
      <textarea class="dd-feedback__comment" placeholder="Что можно улучшить? (появится при выборе «Не нравится»)" style="display:none"></textarea>
      <div class="dd-feedback__actions">
        <button type="button" class="dd-feedback__send" disabled>Отправить</button>
        <span class="dd-feedback__status"></span>
      </div>
    `;

    var likeBtn = $('.dd-feedback__btn[data-v="like"]', wrap);
    var dislikeBtn = $('.dd-feedback__btn[data-v="dislike"]', wrap);
    var comment = $(".dd-feedback__comment", wrap);
    var sendBtn = $(".dd-feedback__send", wrap);
    var status = $(".dd-feedback__status", wrap);

    var value = null;

    function setValue(v) {
      value = v;
      likeBtn.setAttribute("aria-pressed", v === "like" ? "true" : "false");
      dislikeBtn.setAttribute("aria-pressed", v === "dislike" ? "true" : "false");

      if (v === "dislike") {
        comment.style.display = "";
        comment.focus();
      } else {
        comment.style.display = "none";
        comment.value = "";
      }

      sendBtn.disabled = !value;
      status.textContent = "";
    }

    likeBtn.addEventListener("click", function () { setValue("like"); });
    dislikeBtn.addEventListener("click", function () { setValue("dislike"); });

    sendBtn.addEventListener("click", async function () {
      if (!value) return;

      sendBtn.disabled = true;
      status.textContent = "Отправка…";

      var payload = {
        rating: value,                       // like | dislike
        comment: value === "dislike" ? (comment.value || "") : "",
        page_url: location.href,
        page_path: location.pathname,
        page_title: document.title,
        user_agent: navigator.userAgent,
        ts: new Date().toISOString(),
      };

      try {
        var res = await fetch(window.__diplodocFeedbackForm.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        status.textContent = "Спасибо! Отправлено.";
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        comment.disabled = true;
      } catch (e) {
        console.error("Feedback send failed:", e);
        status.textContent = "Не удалось отправить. Попробуйте позже.";
        sendBtn.disabled = false;
      }
    });

    return wrap;
  }

  function mount() {
    var cfg = window.__diplodocFeedbackForm;
    if (!cfg) return;

    var widget = createWidget();
    if (!widget) return;

    // Пытаемся найти контейнер контента. Если не нашли — вставим в конец body.
    var content =
      document.querySelector("main") ||
      document.querySelector(".yfm") ||
      document.querySelector(".dc-doc-page__content") ||
      document.body;

    if (cfg.position === "content-top") {
      content.prepend(widget);
    } else {
      content.appendChild(widget);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();