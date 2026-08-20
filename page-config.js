(function () {
  const FIXED_COMPANY_NAME = "文才投資有限公司";

  const SUPABASE_URL = "https://rgzpjirbyoxbpxrcfjcl.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnenBqaXJieW94YnB4cmNmamNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMDY3MjksImV4cCI6MjEwMjc4MjcyOX0.--5iLbMlzm04ZCEmvFS5rhhS8NeRU8cRgN-rqd656eM";
  const params = new URLSearchParams(location.search);
  const slug = "a-l";
  const CONFIG_TIMEOUT_MS = 1200;
  const initializedFacebookPixels = new Set();
  const pageViewedFacebookPixels = new Set();

  window.PAGE_SLUG = slug;
  const detectedTrafficSource = detectTrafficSource();
  if (detectedTrafficSource) rememberTrafficSource(detectedTrafficSource);
  window.TRAFFIC_SOURCE = detectedTrafficSource || rememberedTrafficSource();

  const defaults = {
    slug,
    company_name: FIXED_COMPANY_NAME,
    line_id: "@034mlgoy",
    line_url: "https://line.me/R/ti/p/@034mlgoy",
    pixel_ids: [
      { id: "1381453987295085", enabled: true, platform: "facebook" },
      { id: "1042995268331677", enabled: true, platform: "facebook" },
      { id: "D8MN11JC77U56UIVBLB0", enabled: true, platform: "tiktok" }
    ],
    tiktok_pixel_ids: [],
    active: true
  };

  bootstrapMetaPixel();
  window.PAGE_CONFIG_READY = loadConfig();
  window.trackPageEvent = trackPageEvent;

  async function loadConfig() {
    let config = defaults;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=line_url,line_id,pixel_ids&limit=1`,
        {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          signal: controller.signal
        }
      );
      const rows = response.ok ? await response.json() : [];
      if (rows[0]) {
        config = {
          ...defaults,
          line_url: rows[0].line_url || defaults.line_url,
          line_id: rows[0].line_id || defaults.line_id,
          pixel_ids: Array.isArray(rows[0].pixel_ids) ? rows[0].pixel_ids : defaults.pixel_ids
        };
      }
    } catch (_) {
    } finally {
      clearTimeout(timeoutId);
    }

    window.PAGE_CONFIG = config;
    applyConfig(config);
    return config;
  }

  function applyConfig(config) {
    document.querySelectorAll("[data-company-name]").forEach(el => {
      el.textContent = FIXED_COMPANY_NAME;
    });
    document.title = `快速貸款試算｜${FIXED_COMPANY_NAME}`;
    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("javascript:")) return;
      const url = new URL(href, location.href);
      url.searchParams.set("page", slug);
      link.href = url.pathname.split("/").pop() + url.search;
    });
    if (config.active === false) {
      document.body.innerHTML = '<main style="font-family:sans-serif;text-align:center;padding:80px 20px"><h1>此頁面目前暫停服務</h1><p>請稍後再試。</p></main>';
      return;
    }
    const { facebookIds, tiktokIds } = splitPixelIds(config.pixel_ids || []);
    installPixels(facebookIds);
    installTikTokPixels(tiktokIds);
  }

  function splitPixelIds(pixels) {
    const list = Array.isArray(pixels) ? pixels : String(pixels || "").split(/[\s,]+/);
    const facebookIds = [];
    const tiktokIds = [];
    list.forEach(pixel => {
      const id = String((pixel && typeof pixel === "object" ? pixel.id : pixel) || "").trim();
      if (!id) return;
      if (pixel && typeof pixel === "object" && pixel.enabled === false) return;
      const platform = String((pixel && typeof pixel === "object" ? pixel.platform : "") || "").toLowerCase();
      if (platform === "tiktok") tiktokIds.push(id);
      else facebookIds.push(id);
    });
    return { facebookIds, tiktokIds };
  }

  function bootstrapMetaPixel() {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
  }

  function installPixels(ids) {
    const sourceIds = Array.isArray(ids) ? ids : String(ids || "").split(/[\s,]+/);
    const cleanIds = [...new Set(sourceIds.map(String).filter(id => /^\d{8,20}$/.test(id)))];
    cleanIds.forEach(id => {
      if (!initializedFacebookPixels.has(id)) {
        const marker = document.createElement("meta");
        marker.dataset.pixelId = id;
        document.head.appendChild(marker);
        window.fbq("init", id);
        initializedFacebookPixels.add(id);
      }
      if (!pageViewedFacebookPixels.has(id)) {
        window.fbq("trackSingle", id, "PageView", { page_slug: slug });
        pageViewedFacebookPixels.add(id);
      }
    });
  }

  function trackPageEvent(eventName, params) {
    if (!window.fbq) return;
    window.fbq("track", eventName, { page_slug: slug, ...(params || {}) });
  }

  function installTikTokPixels(ids) {
    const cleanIds = (Array.isArray(ids) ? ids : String(ids || "").split(/[\s,]+/)).filter(Boolean);
    if (!cleanIds.length) return;
    if (!window.ttq) {
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=i+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)}}(window,document,"ttq");
    }
    cleanIds.forEach(id => {
      if (document.querySelector(`[data-tiktok-pixel-id="${id}"]`)) return;
      const marker = document.createElement("meta");
      marker.dataset.tiktokPixelId = id;
      document.head.appendChild(marker);
      window.ttq.load(id);
    });
    window.ttq.page();
    if (/\/loan\.html$/i.test(location.pathname)) trackTikTokEvent("ViewContent", { content_type: "loan_options" });
  }

  function trackTikTokEvent(eventName, params) {
    if (!window.ttq) return;
    window.ttq.track(eventName, { page_slug: slug, ...(params || {}) });
  }

  window.trackTikTokEvent = trackTikTokEvent;

  function detectTrafficSource() {
    const source = String(params.get("utm_source") || params.get("source") || "").toLowerCase();
    if (params.get("fbclid") || /facebook|meta|(^|[^a-z])fb([^a-z]|$)/.test(source)) return "FB";
    if (params.get("ttclid") || /tiktok|tik_tok|(^|[^a-z])tk([^a-z]|$)/.test(source)) return "TikTok";
    return "";
  }

  function rememberTrafficSource(source) {
    localStorage.setItem(`traffic_source_${slug}`, JSON.stringify({ source, saved_at: Date.now() }));
  }

  function rememberedTrafficSource() {
    try {
      const saved = JSON.parse(localStorage.getItem(`traffic_source_${slug}`) || "null");
      return saved && Date.now() - saved.saved_at < 86400000 ? saved.source : "";
    } catch (_) {
      return "";
    }
  }
})();
