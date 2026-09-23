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


/* ================= PAGE LOAD ================= */

document.addEventListener("DOMContentLoaded", function () {

    // Hide the full-screen loader
    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(function () {
            loader.classList.add("hidden");
        }, 500);
    }

    // Load homework
    loadAllHomework();

});
