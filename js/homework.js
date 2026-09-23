/* =====================================================
   HOMEWORK PAGE JAVASCRIPT
   PUBLIC ACCESS
   NO LOGIN
   NO REGISTRATION
   NO ATTENDANCE CHECK
   ===================================================== */


/* ================= API URLS ================= */

const VIDEO_LIST_API =
    "https://script.google.com/macros/s/AKfycbwfPtK-dCKZqWpTGJZm_uK5IisZ6UdB9jG3bLcsuMm3BKm3n1wJsr07WIZCFV-iJObS/exec";

const VIDEO_LINKS_API =
    "https://script.google.com/macros/s/AKfycbzuQr-TR31WuBCCg68twVK9F-nRtCD79VaTyLLltKEFm_nMGbQKHM4kIL9mT5JXKBNV/exec";


/* ================= GLOBAL VARIABLES ================= */

let allVideos = [];

let videoLinksCache = {};


/* ================= SAFE LANGUAGE UPDATE ================= */

function safeUpdateLanguage() {

    if (typeof updateLanguage === "function") {
        updateLanguage();
    }

}


/* ================= PAGE LOAD ================= */

document.addEventListener("DOMContentLoaded", function () {

    loadAllHomework();

});


/* ================= LOAD ALL HOMEWORK ================= */

async function loadAllHomework() {

    const autoCard =
        document.getElementById("autoLoadCard");

    const spinner =
        document.getElementById("autoLoadSpinner");

    const title =
        document.getElementById("autoLoadTitle");

    const message =
        document.getElementById("autoLoadMsg");

    const homeworkList =
        document.getElementById("homeworkList");


    try {

        if (autoCard) {
            autoCard.style.display = "block";
        }

        await fetchVideoList();

        if (autoCard) {
            autoCard.style.display = "none";
        }

        if (homeworkList) {
            homeworkList.style.display = "block";
        }

        renderHomeworkCards();

    } catch (error) {

        console.error(
            "Failed to load homework:",
            error
        );

        if (spinner) {

            spinner.className =
                "fas fa-exclamation-triangle";

            spinner.style.color =
                "var(--error)";

        }

        if (title) {

            title.textContent =
                "Connection Error";

            title.setAttribute(
                "data-en",
                "Connection Error"
            );

            title.setAttribute(
                "data-ar",
                "خطأ في الاتصال"
            );

        }

        if (message) {

            message.textContent =
                "Failed to load homework videos. Please refresh the page.";

            message.setAttribute(
                "data-en",
                "Failed to load homework videos. Please refresh the page."
            );

            message.setAttribute(
                "data-ar",
                "فشل تحميل فيديوهات الواجب. يرجى تحديث الصفحة."
            );

        }

        safeUpdateLanguage();

    }

}


/* ================= FETCH VIDEO LIST ================= */

async function fetchVideoList() {

    const response =
        await fetch(VIDEO_LIST_API, {
            method: "GET",
            credentials: "omit",
            redirect: "follow",
            cache: "no-cache"
        });


    if (!response.ok) {

        throw new Error(
            `Video list request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    /*
       Support different API response formats.
    */

    if (Array.isArray(data)) {

        allVideos = data;

    } else if (data && Array.isArray(data.videos)) {

        allVideos = data.videos;

    } else if (data && Array.isArray(data.data)) {

        allVideos = data.data;

    } else {

        throw new Error(
            "Invalid video list format"
        );

    }

}


/* ================= RENDER HOMEWORK CARDS ================= */

function renderHomeworkCards() {

    const grid =
        document.getElementById("homeworkGrid");


    if (!grid) {
        return;
    }


    const availableVideos =
        allVideos.filter(function (video) {

            if (!video) {
                return false;
            }

            return (
                (video.title &&
                    String(video.title).trim()) ||

                (video.imgSrc &&
                    String(video.imgSrc).trim()) ||

                (Array.isArray(video.links) &&
                    video.links.length > 0)
            );

        });


    if (availableVideos.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <i class="fas fa-inbox"></i>

                <p
                    data-en="No homework videos available yet"
                    data-ar="لا توجد فيديوهات واجب متاحة بعد">

                    No homework videos available yet

                </p>

            </div>

        `;

        safeUpdateLanguage();

        return;

    }


    grid.innerHTML = "";


    availableVideos.forEach(function (video, index) {

        const lectureNumber =
            index + 1;

        const pageName =
            "video" + lectureNumber;


        const title =
            video.title ||
            "Homework " + lectureNumber;


        const card =
            document.createElement("div");


        card.className =
            "content-card";


        card.style.animationDelay =
            `${index * 0.1}s`;


        let thumbnail = "";


        if (video.imgSrc) {

            thumbnail = `

                <div style="
                    background-image:url('${escapeAttr(video.imgSrc)}');
                    background-size:cover;
                    background-position:center;
                    height:160px;
                    border-radius:8px;
                    margin-bottom:12px;
                "></div>

            `;

        } else {

            thumbnail = `

                <div class="card-icon">

                    <i class="fas fa-play-circle"></i>

                </div>

            `;

        }


        card.innerHTML = `

            ${thumbnail}

            <h3 class="card-title">

                ${escapeHtml(title)}

            </h3>

            <p class="card-desc"
                style="margin-bottom:5px;">

                <span
                    data-en="Lecture"
                    data-ar="المحاضرة">

                    Lecture

                </span>

                ${lectureNumber}

                —

                <i class="fas fa-unlock-alt"
                    style="color:var(--success);">
                </i>

                <span
                    data-en="Available for All"
                    data-ar="متاح للجميع">

                    Available for All

                </span>

            </p>

            <div
                class="video-source-btns"
                id="videoBtns_${pageName}"
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-top:10px;
                ">

                <button
                    class="btn btn-primary btn-sm"
                    type="button"
                    onclick="loadAndPlay('${pageName}')">

                    <i class="fas fa-play"></i>

                    <span
                        data-en="Watch"
                        data-ar="مشاهدة">

                        Watch

                    </span>

                </button>

            </div>

        `;


        grid.appendChild(card);

    });


    safeUpdateLanguage();


    /*
       Load links in the background.
    */

    const pageNames =
        availableVideos.map(function (_, index) {

            return "video" + (index + 1);

        });


    prefetchVideoLinks(pageNames);

}


/* ================= PREFETCH LINKS ================= */

function prefetchVideoLinks(pageNames) {

    if (!Array.isArray(pageNames)) {
        return;
    }


    pageNames.forEach(function (pageName) {

        if (videoLinksCache[pageName]) {
            return;
        }


        fetchVideoLinks(pageName)
            .catch(function (error) {

                console.warn(
                    "Prefetch failed:",
                    error
                );

            });

    });

}


/* ================= FETCH VIDEO LINKS ================= */

async function fetchVideoLinks(pageName) {

    const url =
        `${VIDEO_LINKS_API}?pageName=${encodeURIComponent(pageName)}`;


    const response =
        await fetch(url, {
            method: "GET",
            credentials: "omit",
            redirect: "follow",
            cache: "no-cache"
        });


    if (!response.ok) {

        throw new Error(
            `Video links request failed: ${response.status}`
        );

    }


    const links =
        await response.json();


    if (!links || typeof links !== "object") {

        throw new Error(
            "Invalid video links response"
        );

    }


    videoLinksCache[pageName] =
        links;


    return links;

}


/* ================= LOAD AND PLAY ================= */

async function loadAndPlay(pageName) {

    const container =
        document.getElementById(
            "videoBtns_" + pageName
        );


    if (!container) {
        return;
    }


    if (videoLinksCache[pageName]) {

        showSourceButtons(
            pageName,
            videoLinksCache[pageName],
            container
        );

        return;

    }


    container.innerHTML = `

        <button
            class="btn btn-primary btn-sm"
            type="button"
            disabled>

            <i class="fas fa-spinner fa-spin"></i>

            Loading...

        </button>

    `;


    try {

        const links =
            await fetchVideoLinks(pageName);


        showSourceButtons(
            pageName,
            links,
            container
        );

    } catch (error) {

        console.error(
            "Failed to load video links:",
            error
        );


        container.innerHTML = `

            <span style="color:var(--error);">

                <i class="fas fa-exclamation-triangle"></i>

                Failed to load links

            </span>

        `;

    }

}


/* ================= SHOW SOURCE BUTTONS ================= */

function showSourceButtons(
    pageName,
    links,
    container
) {

    let html = "";


    if (links.mega) {

        html += `

            <button
                class="btn btn-primary btn-sm"
                type="button"
                onclick="playVideo(
                    '${escapeAttr(links.mega)}',
                    '${escapeAttr(pageName)}',
                    'mega'
                )">

                <i class="fas fa-play"></i>

                Mega

            </button>

        `;

    }


    if (links.drive) {

        html += `

            <button
                class="btn btn-outline btn-sm"
                type="button"
                onclick="playVideo(
                    '${escapeAttr(links.drive)}',
                    '${escapeAttr(pageName)}',
                    'drive'
                )">

                <i class="fab fa-google-drive"></i>

                Drive

            </button>

        `;

    }


    if (links.pcloud) {

        html += `

            <button
                class="btn btn-outline btn-sm"
                type="button"
                onclick="playVideo(
                    '${escapeAttr(links.pcloud)}',
                    '${escapeAttr(pageName)}',
                    'pcloud'
                )">

                <i class="fas fa-cloud"></i>

                pCloud

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


    container.innerHTML =
        html;

}


/* ================= PLAY VIDEO ================= */

function playVideo(
    url,
    title,
    source
) {

    const playerSection =
        document.getElementById(
            "videoPlayerSection"
        );

    const listSection =
        document.getElementById(
            "homeworkList"
        );

    const wrapper =
        document.getElementById(
            "videoWrapper"
        );

    const infoTitle =
        document.getElementById(
            "videoTitle"
        );


    if (!playerSection ||
        !listSection ||
        !wrapper ||
        !infoTitle) {

        return;

    }


    listSection.style.display =
        "none";


    playerSection.style.display =
        "block";


    infoTitle.textContent =
        title || "Homework Video";


    let embedUrl =
        url;


    if (source === "drive") {

        embedUrl =
            convertDriveToEmbed(url);

    }


    wrapper.innerHTML = `

        <iframe
            src="${escapeAttr(embedUrl)}"
            frameborder="0"
            allowfullscreen
            allow="autoplay; encrypted-media"
            style="
                width:100%;
                aspect-ratio:16/9;
                border-radius:12px;
            ">

        </iframe>

    `;


    playerSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ================= DRIVE EMBED ================= */

function convertDriveToEmbed(url) {

    const patterns = [

        /\/file\/d\/([a-zA-Z0-9_-]+)/,

        /id=([a-zA-Z0-9_-]+)/,

        /\/d\/([a-zA-Z0-9_-]+)/

    ];


    for (const pattern of patterns) {

        const match =
            String(url).match(pattern);


        if (match) {

            return `https://drive.google.com/file/d/${match[1]}/preview`;

        }

    }


    return url;

}


/* ================= CLOSE PLAYER ================= */

function closeVideoPlayer() {

    const player =
        document.getElementById(
            "videoPlayerSection"
        );

    const list =
        document.getElementById(
            "homeworkList"
        );

    const wrapper =
        document.getElementById(
            "videoWrapper"
        );


    if (player) {
        player.style.display = "none";
    }


    if (list) {
        list.style.display = "block";
    }


    if (wrapper) {
        wrapper.innerHTML = "";
    }

}


/* ================= ESCAPE HTML ================= */

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ================= ESCAPE ATTRIBUTES ================= */

function escapeAttr(value) {

    return String(value)

        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

}
