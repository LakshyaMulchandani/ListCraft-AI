/* ============================================================
   ListCraft AI — Main Application Logic
   Orchestrates UI, form handling, streaming, and state
   ============================================================ */

const App = (() => {
  // ---- State ----
  let currentPlatform = 'etsy';
  let isGenerating = false;
  let abortController = null;
  let selectedModel = '';
  let history = [];

  // ---- DOM Cache ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---- Init ----
  function init() {
    loadHistory();
    bindEvents();
    checkOllamaConnection();
    renderHistory();
    initBackgroundParticles();
  }

  // ---- Event Bindings ----
  function bindEvents() {
    // Platform tabs
    $$('.platform-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchPlatform(tab.dataset.platform));
    });

    // Tone chips
    $$('.tone-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.tone-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Generate button
    $('#generateBtn').addEventListener('click', handleGenerate);

    // Copy buttons (delegated)
    $('#outputContainer').addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy');
      if (copyBtn) handleCopy(copyBtn);
    });

    // History toggle
    $('#historyToggle').addEventListener('click', toggleHistory);
    $('#historyClose').addEventListener('click', toggleHistory);
    $('#historyOverlay').addEventListener('click', toggleHistory);

    // Model selector
    $('#modelSelect').addEventListener('change', (e) => {
      selectedModel = e.target.value;
    });
  }

  // ---- Ollama Connection ----
  async function checkOllamaConnection() {
    const badge = $('#connectionStatus');
    const statusText = badge.querySelector('.status-text');

    badge.className = 'connection-status';
    statusText.textContent = 'Checking...';

    const { connected } = await OllamaClient.checkConnection();

    if (connected) {
      badge.classList.add('connected');
      statusText.textContent = 'Ollama Connected';
      await loadModels();
      hideSetupInstructions();
    } else {
      badge.classList.add('disconnected');
      statusText.textContent = 'Ollama Offline';
      showSetupInstructions();
    }
  }

  async function loadModels() {
    const select = $('#modelSelect');
    const models = await OllamaClient.listModels();

    select.innerHTML = '';

    if (models.length === 0) {
      select.innerHTML = '<option value="">No models found</option>';
      return;
    }

    models.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.name;
      const sizeStr = OllamaClient.formatSize(m.size);
      opt.textContent = `${m.name}${sizeStr ? ` (${sizeStr})` : ''}`;
      select.appendChild(opt);
    });

    selectedModel = models[0].name;
  }

  function showSetupInstructions() {
    $('#setupInstructions').style.display = 'block';
    $('#generateBtn').disabled = true;
  }

  function hideSetupInstructions() {
    $('#setupInstructions').style.display = 'none';
    $('#generateBtn').disabled = false;
  }

  // ---- Platform Switching ----
  function switchPlatform(platform) {
    currentPlatform = platform;
    $$('.platform-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.platform === platform);
    });
  }

  // ---- Form Data ----
  function getFormData() {
    const activeTone = $('.tone-chip.active');
    return {
      productName: $('#productName').value.trim(),
      category: $('#category').value.trim(),
      features: $('#features').value.trim(),
      priceRange: $('#priceRange').value,
      condition: $('#condition').value,
      tone: activeTone ? activeTone.dataset.tone : 'Professional',
      extraNotes: $('#extraNotes').value.trim(),
    };
  }

  function validateForm(data) {
    if (!data.productName) {
      showToast('Please enter a product name', 'error');
      $('#productName').focus();
      return false;
    }
    if (!data.features) {
      showToast('Please describe key features or materials', 'error');
      $('#features').focus();
      return false;
    }
    if (!selectedModel) {
      showToast('No model selected. Is Ollama running?', 'error');
      return false;
    }
    return true;
  }

  // ---- Generation ----
  async function handleGenerate() {
    if (isGenerating) {
      cancelGeneration();
      return;
    }

    const data = getFormData();
    if (!validateForm(data)) return;

    const { system, user } = Templates.getPrompt(currentPlatform, data);
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    isGenerating = true;
    abortController = new AbortController();
    updateGenerateButton(true);
    showLoadingSkeleton();

    let streamedText = '';

    try {
      const fullResponse = await OllamaClient.generateListing(
        selectedModel,
        messages,
        (chunk) => {
          streamedText += chunk;
          updateStreamingOutput(streamedText);
        },
        abortController.signal
      );
      const parsed = Templates.parseResponse(fullResponse);
      renderFinalOutput(parsed);
      saveToHistory(data, currentPlatform, parsed);
      showToast('Listing generated successfully!', 'success');
    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Generation cancelled', 'error');
      } else {
        showToast(`Generation failed: ${err.message}`, 'error');
        console.error('Generation error:', err);
      }
    } finally {
      isGenerating = false;
      abortController = null;
      updateGenerateButton(false);
    }
  }

  function cancelGeneration() {
    if (abortController) {
      abortController.abort();
    }
  }

  function updateGenerateButton(loading) {
    const btn = $('#generateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnIcon = btn.querySelector('.btn-icon');

    if (loading) {
      btn.classList.add('loading');
      btnText.textContent = 'Stop Generating';
      btnIcon.textContent = '⏹';
    } else {
      btn.classList.remove('loading');
      btnText.textContent = 'Generate Listing';
      btnIcon.textContent = '✨';
    }
  }

  // ---- Output Rendering ----
  function showLoadingSkeleton() {
    const container = $('#outputContainer');
    const platformInfo = Templates.getPlatformInfo(currentPlatform);

    container.innerHTML = `
      <div class="output-section">
        <div class="output-section-header">
          <span class="output-section-label">Title</span>
        </div>
        <div class="output-content title-content">
          <div class="skeleton-line"></div>
        </div>
      </div>
      <div class="output-section">
        <div class="output-section-header">
          <span class="output-section-label">Description</span>
        </div>
        <div class="output-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
      <div class="output-section">
        <div class="output-section-header">
          <span class="output-section-label">${platformInfo.tagLabel}</span>
        </div>
        <div class="output-content">
          <div class="skeleton-line" style="width: 80%;"></div>
        </div>
      </div>
      <div class="output-section">
        <div class="output-section-header">
          <span class="output-section-label">Key Selling Points</span>
        </div>
        <div class="output-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    `;
  }

  function updateStreamingOutput(rawText) {
    // During streaming, show raw output with cursor
    const container = $('#outputContainer');
    container.innerHTML = `
      <div class="output-section">
        <div class="output-section-header">
          <span class="output-section-label">Generating for ${Templates.getPlatformInfo(currentPlatform).name}...</span>
        </div>
        <div class="output-content streaming-cursor">${escapeHtml(rawText)}</div>
      </div>
    `;
    // Auto-scroll
    container.scrollTop = container.scrollHeight;
  }

  function renderFinalOutput(parsed) {
    const container = $('#outputContainer');
    const platformInfo = Templates.getPlatformInfo(currentPlatform);

    const tagsHtml = parsed.tags.length
      ? `<div class="output-tags">${parsed.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>`
      : `<div class="output-content">No tags generated</div>`;

    const bulletsHtml = parsed.bulletPoints.length
      ? parsed.bulletPoints.map((b) => `• ${escapeHtml(b)}`).join('\n')
      : 'No bullet points generated';

    container.innerHTML = `
      <div class="output-section" style="animation-delay: 0s;">
        <div class="output-section-header">
          <span class="output-section-label">Title</span>
          <button class="btn-copy" data-target="title-text" title="Copy title">
            📋 Copy
          </button>
        </div>
        <div class="output-content title-content" id="title-text">${escapeHtml(parsed.title) || 'No title generated'}</div>
      </div>

      <div class="output-section" style="animation-delay: 0.1s;">
        <div class="output-section-header">
          <span class="output-section-label">Description</span>
          <button class="btn-copy" data-target="desc-text" title="Copy description">
            📋 Copy
          </button>
        </div>
        <div class="output-content" id="desc-text">${escapeHtml(parsed.description) || 'No description generated'}</div>
      </div>

      <div class="output-section" style="animation-delay: 0.2s;">
        <div class="output-section-header">
          <span class="output-section-label">${platformInfo.tagLabel}</span>
          <button class="btn-copy" data-target="tags-text" title="Copy tags">
            📋 Copy
          </button>
        </div>
        ${tagsHtml}
        <span id="tags-text" class="visually-hidden">${escapeHtml(parsed.tags.join(', '))}</span>
      </div>

      <div class="output-section" style="animation-delay: 0.3s;">
        <div class="output-section-header">
          <span class="output-section-label">Key Selling Points</span>
          <button class="btn-copy" data-target="bullets-text" title="Copy bullet points">
            📋 Copy
          </button>
        </div>
        <div class="output-content" id="bullets-text">${bulletsHtml}</div>
      </div>
    `;
  }

  function renderEmptyState() {
    const container = $('#outputContainer');
    container.innerHTML = `
      <div class="output-empty">
        <div class="empty-icon">✨</div>
        <div class="empty-title">Ready to craft your listing</div>
        <div class="empty-desc">
          Fill in your product details on the left, choose a platform, and hit Generate. Your AI-powered listing will appear here.
        </div>
      </div>
    `;
  }

  // ---- Copy to Clipboard ----
  async function handleCopy(btn) {
    const targetId = btn.dataset.target;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const text = targetEl.textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('copied');
      btn.innerHTML = '✅ Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '📋 Copy';
      }, 2000);
    } catch {
      showToast('Failed to copy. Try selecting the text manually.', 'error');
    }
  }

  // ---- History ----
  function loadHistory() {
    try {
      const saved = localStorage.getItem('listcraft_history');
      history = saved ? JSON.parse(saved) : [];
    } catch {
      history = [];
    }
  }

  function saveToHistory(productData, platform, parsedOutput) {
    const entry = {
      id: Date.now(),
      productName: productData.productName,
      platform,
      output: parsedOutput,
      timestamp: new Date().toISOString(),
    };
    history.unshift(entry);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('listcraft_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const list = $('#historyList');
    if (!list) return;

    if (history.length === 0) {
      list.innerHTML = `
        <div class="history-empty">
          <p>📝 No listings generated yet.</p>
          <p style="margin-top: 8px; font-size: 0.78rem;">Your generated listings will appear here for quick access.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = history
      .map((item) => {
        const info = Templates.getPlatformInfo(item.platform);
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="history-item" data-id="${item.id}">
            <div class="history-item-name">${escapeHtml(item.productName)}</div>
            <div class="history-item-meta">
              <span>${info.icon} ${info.name}</span>
              <span>•</span>
              <span>${timeStr}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Bind click events
    list.querySelectorAll('.history-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        const entry = history.find((h) => h.id === id);
        if (entry) {
          currentPlatform = entry.platform;
          $$('.platform-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.platform === entry.platform);
          });
          renderFinalOutput(entry.output);
          toggleHistory();
        }
      });
    });
  }

  function toggleHistory() {
    const panel = $('#historyPanel');
    const overlay = $('#historyOverlay');
    const isOpen = panel.classList.contains('open');

    if (isOpen) {
      panel.classList.remove('open');
      overlay.classList.remove('visible');
    } else {
      panel.classList.add('open');
      overlay.classList.add('visible');
    }
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : '❌'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fadeout');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---- Utilities ----
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Dynamic Background Particles ----
  function initBackgroundParticles() {
    const canvas = document.getElementById('bgParticlesCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId = null;
    let isVisible = true;

    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    const palette = [
      { r: 59, g: 130, b: 246 },   // blue
      { r: 168, g: 85, b: 247 },   // violet
      { r: 245, g: 158, b: 11 },   // amber
      { r: 6, g: 182, b: 212 }     // cyan
    ];

    const PARTICLE_COUNT = 38;
    const particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    function createParticle(initial = false) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 10 + Math.random() * 20,
        radius: 1.2 + Math.random() * 2.2,
        baseAlpha: 0.15 + Math.random() * 0.45,
        alpha: 0.15 + Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.25 - Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseVal: Math.random() * Math.PI * 2,
        color
      };
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle(true));
      }
    }

    function draw() {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.pulseVal += p.pulseSpeed;
          p.alpha = p.baseAlpha + Math.sin(p.pulseVal) * 0.12;

          p.x += p.vx + Math.sin(p.pulseVal * 0.5) * 0.2;
          p.y += p.vy;

          // Mouse gentle deflection
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 0.6;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
          }

          // Respawn at bottom if floated past top
          if (p.y < -20 || p.x < -30 || p.x > width + 30) {
            particles[i] = createParticle(false);
          }
        }

        // Render glowing light mote
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${Math.max(0, p.alpha)})`;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.7)`;
        ctx.shadowBlur = p.radius * 3.5;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    }

    // Event listeners
    window.addEventListener('resize', () => {
      resize();
      if (prefersReducedMotion) draw();
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isVisible = false;
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        isVisible = true;
        if (!prefersReducedMotion) {
          animationId = requestAnimationFrame(draw);
        }
      }
    });

    resize();
    initParticles();
    draw();
  }

  // ---- Public API ----
  return { init };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
