/* One clock. --p is the pinned travel. Video and frames use the
   stage's whole visible life, so the picture is already moving as it
   arrives and still moving as it leaves. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  document.documentElement.classList.add("is-motion");

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  const studies = [...document.querySelectorAll(".study")];
  const clamp = (n) => Math.min(1, Math.max(0, n));

  function dwell(t, k) {
    const s = t * t * (3 - 2 * t);
    return clamp(t * (1 - k) + s * k);
  }

  function progress(study) {
    const top = study.offsetTop;
    const height = study.offsetHeight;
    const view = window.innerHeight;
    const y = window.scrollY;
    const pinSpan = Math.max(1, height - view);
    const pin = clamp((y - top) / pinSpan);
    const visSpan = height + view;
    const clip = clamp((y - (top - view)) / visSpan);
    return { pin, clip };
  }

  function pickSrc(el) {
    if (narrow && el.dataset.srcMobile) return el.dataset.srcMobile;
    return el.dataset.src;
  }

  function bindVideo(video, map) {
    let target = 0;
    let shown = 0;
    let seeking = false;
    let seekTimer = 0;
    let ready = false;
    let armed = false;
    function release() { seeking = false; }
    function arm() {
      if (armed) return;
      armed = true;
      requestPaint();
    }
    function bufferedEnd() {
      const span = video.buffered;
      return span && span.length ? span.end(span.length - 1) : 0;
    }
    function maySeek() {
      const dur = video.duration;
      const need = Number.isFinite(dur) ? Math.min(1, Math.max(0.35, dur * 0.12)) : 1;
      return bufferedEnd() >= need;
    }
    video.addEventListener("loadeddata", () => {
      ready = true;
      video.closest(".plate, .stage")?.classList.add("is-live");
      const watchBuffer = () => { if (maySeek()) arm(); };
      video.addEventListener("progress", watchBuffer);
      watchBuffer();
      requestPaint();
    });
    video.addEventListener("seeked", () => {
      clearTimeout(seekTimer);
      release();
    });
    return {
      load() {
        if (video.getAttribute("src")) return;
        const src = pickSrc(video);
        if (!src) return;
        video.preload = "auto";
        video.src = src;
        video.load();
      },
      set(p) {
        if (!ready || !Number.isFinite(video.duration)) return;
        target = map(p) * video.duration;
      },
      tick() {
        if (!ready || !Number.isFinite(video.duration) || !armed) return;
        shown += (target - shown) * 0.18;
        if (Math.abs(video.currentTime - shown) < 0.06) {
          release();
          return;
        }
        if (seeking) return;
        seeking = true;
        clearTimeout(seekTimer);
        seekTimer = setTimeout(() => {
          release();
          requestPaint();
        }, 4000);
        try {
          video.currentTime = shown;
        } catch {
          release();
        }
      },
      gap() {
        if (ready && !armed) return 1;
        const drift = ready ? Math.abs(video.currentTime - shown) : 0;
        return Math.max(Math.abs(target - shown), drift > 0.12 ? drift : 0);
      }
    };
  }

  function bindFrames(root) {
    const count = Number(root.dataset.count) || 0;
    const base = root.dataset.frames;
    const canvas = root.querySelector("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });
    const images = new Array(count);
    let drawn = -1;

    function size() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawn = -1;
      }
    }

    function load(index) {
      if (index < 0 || index >= count || images[index]) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => requestPaint();
      img.src = `${base}/f-${String(index + 1).padStart(3, "0")}.jpg`;
      images[index] = img;
    }

    return {
      load() {
        size();
        load(0);
        load(1);
        load(2);
      },
      set(p) {
        if (!count) return;
        size();
        const index = Math.round(p * (count - 1));
        for (let i = index - 1; i <= index + 8; i += 1) load(i);
        const img = images[index];
        if (!img || !img.complete || !img.naturalWidth || index === drawn) return;
        drawn = index;
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = "#09090f";
        ctx.fillRect(0, 0, w, h);
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.92;
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) * 0.58, dw, dh);
        root.querySelector(".plate")?.classList.add("is-live");
      },
      tick() {}
    };
  }

  const players = [];

  const wisdom = document.querySelector("[data-player='wisdom']");
  if (wisdom) {
    const player = bindVideo(wisdom, (p) => dwell(p, 0.45));
    players.push({ el: wisdom.closest(".study"), player, mode: "clip" });
  }

  const codex = document.querySelector("[data-player='codex']");
  if (codex) {
    const player = bindVideo(codex, (p) => dwell(p, 0.4));
    players.push({ el: codex.closest(".study"), player, mode: "clip" });
  }

  const agentVideo = document.querySelector("[data-player='agent']");
  const agentStudy = document.querySelector(".study-agent");
  let agentPointer = null;
  if (agentVideo && agentStudy) {
    const player = bindVideo(agentVideo, (p) => p);
    players.push({
      el: agentStudy,
      player,
      mode: "agent"
    });
    if (fine) {
      agentStudy.addEventListener("pointermove", (event) => {
        const rect = agentStudy.querySelector(".stage").getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        agentStudy.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
        agentStudy.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
        agentPointer = x;
      });
      agentStudy.addEventListener("pointerleave", () => {
        agentPointer = null;
      });
    }
  }

  const frames = document.querySelector("[data-frames]");
  if (frames) {
    const player = bindFrames(frames);
    players.push({ el: frames, player, mode: "clip" });
  }

  const rail = document.querySelector(".rail");
  function measureRail() {
    if (!rail) return;
    const clip = rail.parentElement;
    const travel = Math.max(0, rail.scrollWidth - clip.clientWidth);
    clip.style.setProperty("--travel", String(travel));
  }

  const seen = new WeakSet();
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target._near = entry.isIntersecting;
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      players.forEach((item) => {
        if (item.el === entry.target) item.player.load();
      });
    });
  }, { rootMargin: "80% 0px" });
  studies.forEach((study) => watch.observe(study));

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    if (!fine) return;
    const inner = card.querySelector(".card-inner");
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      inner.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
      inner.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => {
      inner.style.setProperty("--ry", "0deg");
      inner.style.setProperty("--rx", "0deg");
    });
  });

  let running = false;
  function paint() {
    let pending = false;
    studies.forEach((study) => {
      if (!study._near) return;
      const { pin } = progress(study);
      study.style.setProperty("--p", pin.toFixed(4));
    });
    players.forEach((item) => {
      if (!item.el._near && item.mode !== "agent") return;
      if (!item.el._near) return;
      const { clip } = progress(item.el);
      if (item.mode === "agent") item.player.set(agentPointer == null ? 0 : agentPointer);
      else item.player.set(clip);
      item.player.tick();
      if (item.player.gap && item.player.gap() > 0.03) pending = true;
    });
    if (pending) requestAnimationFrame(paint);
    else running = false;
  }

  function requestPaint() {
    if (running) return;
    running = true;
    requestAnimationFrame(paint);
  }

  document.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", () => {
    measureRail();
    requestPaint();
  });
  if (agentStudy && fine) {
    agentStudy.addEventListener("pointermove", requestPaint);
  }
  measureRail();
  requestPaint();
})();
