
/* ===== Homework Page JS ===== */

const VIDEO_LIST_API =
  'https://script.google.com/macros/s/AKfycbwfPtK-dCKZqWpTGJZm_uK5IisZ6UdB9jG3bLcsuMm3BKm3n1wJsr07WIZCFV-iJObS/exec';

const VIDEO_LINKS_API =
  'https://script.google.com/macros/s/AKfycbzuQr-TR31WuBCCg68twVK9F-nRtCD79VaTyLLltKEFm_nRtCD79VaTyLLltKEFm_nMGbQKHM4kIL9mT5JXKBNV/exec';

// Store videos
let allVideos = [];

// Cache video links
let videoLinksCache = {};


/* =====================================================
   ON PAGE LOAD
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const user = getLoggedInUser();

  const codeCard = document.getElementById('codeCheckCard');
  const autoCard = document.getElementById('autoLoadCard');

  // Hide manual student code input
  if (codeCard) {
    codeCard.style.display = 'none';
  }

  // Show loading card
  if (autoCard) {
    autoCard.style.display = 'block';
  }

  // Load all homework videos
  loadAllHomework();

});


/* =====================================================
   LOAD ALL HOMEWORK
   ===================================================== */

async function loadAllHomework() {

  const autoCard = document.getElementById('autoLoadCard');

  const spinner = document.getElementById('autoLoadSpinner');

  const titleEl = document.getElementById('autoLoadTitle');

  const msgEl = document.getElementById('autoLoadMsg');

  try {

    // Fetch video list only
    await fetchVideoList();

    // Hide loading card
    if (autoCard) {
      autoCard.style.display = 'none';
    }

    // Show homework list
    document.getElementById('homeworkList').style.display = 'block';

    // Render all homework videos
    renderHomeworkCards();

  } catch (err) {

    console.error('Failed to load homework:', err);

    if (spinner) {
      spinner.className = 'fas fa-exclamation-triangle';
      spinner.style.color = 'var(--error)';
    }

    if (titleEl) {
      titleEl.textContent = 'Connection Error';
    }

    if (msgEl) {
      msgEl.textContent =
        'Failed to load homework. Please refresh the page.';
    }

    updateLanguage();

  }

}


/* =====================================================
   FETCH VIDEO LIST
   ===================================================== */

async function fetchVideoList() {

  const resp = await fetch(VIDEO_LIST_API, {
    credentials: 'omit',
    redirect: 'follow'
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch video list');
  }

  allVideos = await resp.json();

}


/* =====================================================
   RENDER ALL HOMEWORK CARDS
   ===================================================== */

function renderHomeworkCards() {

  const grid = document.getElementById('homeworkGrid');

  if (
    !allVideos ||
    !Array.isArray(allVideos) ||
    allVideos.length === 0
  ) {

    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p data-en="No homework videos available yet"
           data-ar="لا توجد فيديوهات واجب متاحة بعد">
          No homework videos available yet
        </p>
      </div>
    `;

    return;

  }

  // Display ALL videos, without checking attendance
  const availableVideos = [];

  allVideos.forEach((v, i) => {

    // Skip empty or placeholder rows
    const hasContent = v && (
      (v.title && String(v.title).trim()) ||
      (v.imgSrc && String(v.imgSrc).trim()) ||
      (v.links && Array.isArray(v.links) && v.links.length > 0)
    );

    if (!hasContent) return;

    availableVideos.push({
      ...v,
      _index: i
    });

  });


  if (availableVideos.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p data-en="No homework videos available yet"
           data-ar="لا توجد فيديوهات واجب متاحة بعد">
          No homework videos available yet
        </p>
      </div>
    `;

    return;

  }


  grid.innerHTML = '';


  availableVideos.forEach((video, idx) => {

    const lectureNum = video._index + 1;

    const pageName = 'video' + lectureNum;

    const card = document.createElement('div');

    card.className = 'content-card';

    card.style.animationDelay = `${idx * 0.1}s`;


    // Thumbnail
    const thumbStyle = video.imgSrc
      ? `background-image:url('${video.imgSrc}');
         background-size:cover;
         background-position:center;
         height:160px;
         border-radius:8px;
         margin-bottom:12px;`
      : '';


    card.innerHTML = `

      ${
        video.imgSrc
          ? `<div style="${thumbStyle}"></div>`
          : '<div class="card-icon"><i class="fas fa-play-circle"></i></div>'
      }

      <h3 class="card-title">
        ${video.title || 'Homework ' + lectureNum}
      </h3>

      <p class="card-desc" style="margin-bottom:5px;">

        <span data-en="Lecture"
              data-ar="المحاضرة">
          Lecture
        </span>

        ${lectureNum}

        — <i class="fas fa-unlock-alt"
             style="color:var(--success);"></i>

        <span data-en="Available for All"
              data-ar="متاح للجميع">
          Available for All
        </span>

      </p>


      <div
        class="video-source-btns"
        id="videoBtns_${pageName}"
        style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;"
      >

        <button
          class="btn btn-primary btn-sm"
          onclick="loadAndPlay('${pageName}')"
        >

          <i class="fas fa-play"></i>

          <span data-en="Watch"
                data-ar="مشاهدة">
            Watch
          </span>

        </button>

      </div>

    `;


    grid.appendChild(card);

  });


  // Prefetch video links
  try {

    const pageNames = availableVideos.map(
      v => 'video' + (v._index + 1)
    );

    prefetchVideoLinks(pageNames);

  } catch (e) {

    console.warn('Prefetch failed:', e);

  }


  updateLanguage();

}


/* =====================================================
   PREFETCH VIDEO LINKS
   ===================================================== */

function prefetchVideoLinks(pageNames) {

  if (!Array.isArray(pageNames) || pageNames.length === 0) {
    return;
  }

  const concurrency = 3;

  const queue = pageNames.slice();


  async function worker() {

    while (queue.length) {

      const pageName = queue.shift();

      if (!pageName) break;

      if (videoLinksCache[pageName]) {
        continue;
      }

      try {

        const resp = await fetch(
          `${VIDEO_LINKS_API}?pageName=${encodeURIComponent(pageName)}`,
          {
            credentials: 'omit',
            redirect: 'follow'
          }
        );

        if (!resp.ok) continue;

        const links = await resp.json();

        if (
          links &&
          (links.drive || links.pcloud || links.mega)
        ) {

          videoLinksCache[pageName] = links;

        }

      } catch (err) {

        console.warn('Link prefetch failed:', err);

      }

      await new Promise(r => setTimeout(r, 200));

    }

  }


  for (let i = 0; i < concurrency; i++) {
    worker();
  }

}


/* =====================================================
   LOAD VIDEO LINKS
   ===================================================== */

async function loadAndPlay(pageName) {

  const btnsContainer = document.getElementById(
    'videoBtns_' + pageName
  );

  if (!btnsContainer) return;


  // Use cache
  if (videoLinksCache[pageName]) {

    showSourceButtons(
      pageName,
      videoLinksCache[pageName],
      btnsContainer
    );

    return;

  }


  // Loading
  btnsContainer.innerHTML = `
    <button class="btn btn-primary btn-sm" disabled>
      <i class="fas fa-spinner fa-spin"></i>
      Loading...
    </button>
  `;


  try {

    const resp = await fetch(
      `${VIDEO_LINKS_API}?pageName=${encodeURIComponent(pageName)}`,
      {
        credentials: 'omit',
        redirect: 'follow'
      }
    );

    if (!resp.ok) {
      throw new Error('Failed to load video links');
    }

    const links = await resp.json();

    videoLinksCache[pageName] = links;

    showSourceButtons(
      pageName,
      links,
      btnsContainer
    );

  } catch (err) {

    console.error(err);

    btnsContainer.innerHTML = `
      <span style="color:var(--error);">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load links
      </span>
    `;

  }

}


/* =====================================================
   SHOW VIDEO SOURCE BUTTONS
   ===================================================== */

function showSourceButtons(title, links, container) {

  let html = '';

  if (links.mega) {

    html += `
      <button class="btn btn-primary btn-sm"
        onclick="playVideo('${escapeAttr(links.mega)}', '${escapeAttr(title)}', 'mega')">

        <i class="fas fa-play"></i> Mega

      </button>
    `;

  }

  if (links.drive) {

    html += `
      <button class="btn btn-outline btn-sm"
        onclick="playVideo('${escapeAttr(links.drive)}', '${escapeAttr(title)}', 'drive')">

        <i class="fab fa-google-drive"></i> Drive

      </button>
    `;

  }

  if (links.pcloud) {

    html += `
      <button class="btn btn-outline btn-sm"
        onclick="playVideo('${escapeAttr(links.pcloud)}', '${escapeAttr(title)}', 'pcloud')">

        <i class="fas fa-cloud"></i> pCloud

      </button>
    `;

  }

  if (!html) {

    html = `
      <span style="color:var(--text-muted);">
        No links available
      </span>
    `;

  }

  container.innerHTML = html;

}


/* =====================================================
   ESCAPE ATTRIBUTES
   ===================================================== */

function escapeAttr(str) {

  return String(str)
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');

}


/* =====================================================
   PLAY VIDEO
   ===================================================== */

function playVideo(url, title, source) {

  const playerSection = document.getElementById(
    'videoPlayerSection'
  );

  const listSection = document.getElementById(
    'homeworkList'
  );

  const wrapper = document.getElementById(
    'videoWrapper'
  );

  const infoTitle = document.getElementById(
    'videoTitle'
  );


  listSection.style.display = 'none';

  playerSection.style.display = 'block';

  infoTitle.textContent = title || 'Homework Video';


  if (source === 'mega') {

    wrapper.innerHTML = `
      <iframe
        src="${url}"
        frameborder="0"
        allowfullscreen
        allow="autoplay; encrypted-media"
        style="width:100%;aspect-ratio:16/9;border-radius:12px;">
      </iframe>
    `;

  } else if (source === 'drive') {

    const embedUrl = convertDriveToEmbed(url);

    wrapper.innerHTML = `
      <iframe
        src="${embedUrl}"
        frameborder="0"
        allowfullscreen
        allow="autoplay; encrypted-media"
        style="width:100%;aspect-ratio:16/9;border-radius:12px;">
      </iframe>
    `;

  } else if (source === 'pcloud') {

    wrapper.innerHTML = `
      <iframe
        src="${url}"
        frameborder="0"
        allowfullscreen
        allow="autoplay; encrypted-media"
        style="width:100%;aspect-ratio:16/9;border-radius:12px;">
      </iframe>
    `;

  } else {

    wrapper.innerHTML = `
      <iframe
        src="${url}"
        frameborder="0"
        allowfullscreen
        style="width:100%;aspect-ratio:16/9;border-radius:12px;">
      </iframe>
    `;

  }

}


/* =====================================================
   GOOGLE DRIVE EMBED
   ===================================================== */

function convertDriveToEmbed(url) {

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];


  for (const p of patterns) {

    const m = url.match(p);

    if (m) {

      return `https://drive.google.com/file/d/${m[1]}/preview`;

    }

  }


  return url;

}


/* =====================================================
   CLOSE VIDEO PLAYER
   ===================================================== */

function closeVideoPlayer() {

  document.getElementById(
    'videoPlayerSection'
  ).style.display = 'none';

  document.getElementById(
    'homeworkList'
  ).style.display = 'block';

  document.getElementById(
    'videoWrapper'
  ).innerHTML = '';

}