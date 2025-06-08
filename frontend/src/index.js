import $ from "jquery";
import "jquery-datetimepicker";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import "jquery-datetimepicker/jquery.datetimepicker.css";
import "@fortawesome/fontawesome-free/js/all.js";
import '@fortawesome/fontawesome-free/css/all.css';
import "./style.css";

const BASE_CAPTURE_URL = '/captures';
const LATEST_JSON_URL = BASE_CAPTURE_URL + '/latest.json';
const OLDEST_JSON_URL = BASE_CAPTURE_URL + '/oldest.json';
const IMAGE_STEP_SECONDS = 10;
const SERVER_UPDATE_INTERVAL = IMAGE_STEP_SECONDS * 1000;
const REFETCH_INTERVAL = 360 * 1000;
const AVAILABLE_SPEEDS = [1, 10, 20];
const LOOP_MS = 1000;

$.datetimepicker.setLocale('de');

const pathToDate = (path) => {
    let parts = path.split("/");
    let last = parts[parts.length - 1]
    let match = last.match(/(\d{4})_(\d{2})_(\d{2})-(\d{2})_(\d{2})_(\d{2})\.webp/);
    if (match) {
        let [_, y2, m2, d2, h2, min2, s2] = match;
        return new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2), parseInt(h2), parseInt(min2), parseInt(s2));
    }
    return null;
};

const roundDate = (date) => {
    let tempDate = new Date(date.getTime());
    let roundedSeconds = Math.floor(tempDate.getSeconds() / IMAGE_STEP_SECONDS) * IMAGE_STEP_SECONDS;
    tempDate.setSeconds(roundedSeconds);
    return tempDate;
}

const dateToImageSource = (date) => {
    let tempDate = roundDate(date);
    let YYYY = tempDate.getFullYear();
    let MM = (tempDate.getMonth() + 1).toString().padStart(2, '0');
    let DD = tempDate.getDate().toString().padStart(2, '0');
    let HH = tempDate.getHours().toString().padStart(2, '0');
    let MIN = tempDate.getMinutes().toString().padStart(2, '0');
    let SS = tempDate.getSeconds().toString().padStart(2, '0');

    return `${BASE_CAPTURE_URL}/${YYYY}/${MM}/${DD}/${HH}/${YYYY}_${MM}_${DD}-${HH}_${MIN}_${SS}.webp`;
};

const formatDate = (date) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    return date.toLocaleString(undefined, options).replace(",", "");
};

const getDateFromFile = async (url, key) => {
    let file = await fetch(`${url}?${new Date().getTime()}`);
    if (!file.ok) {
        throw new Error(`Unable to get file ${url}: ${file.status}`);
    }
    let jsonData = await file.json();
    return pathToDate(jsonData[key]);
};

const main = async () => {
    const imageArea = $("#main-image");
    const liveButtonLive = $(".live-btn-live");
    const liveButtonJump = $(".jump-btn-live");
    const togglePlaybackButtons = $(".toggle-btn");
    const playButton = $(".play-btn");
    const pauseButton = $(".pause-btn");
    const speedButton = $(".speed-btn");
    const dateTimePicker = $(".datetimepicker");
    const currentTimeArea = $(".currentTime");
    const currentSpeed = $(".speed");

    let currentServerTime = await getDateFromFile(LATEST_JSON_URL, "latest");
    let currentPlayTime = new Date(currentServerTime.getTime());
    const oldestServerTime = await getDateFromFile(OLDEST_JSON_URL, "oldest");
    let exec = 0;
    let live = true;
    let pause = false;
    let speedIndex = 0;

    const update = (date) => {
        imageArea.attr("src", dateToImageSource(date));
        currentTimeArea.text(formatDate(date));
    };
    update(currentPlayTime);

    const setLive = () => {
        live = true;

        currentPlayTime = new Date(currentServerTime.getTime());
        update(currentPlayTime);

        liveButtonJump.hide();
        liveButtonLive.show();
        togglePlaybackButtons.addClass("disabled");
        speedButton.addClass("disabled");
    };

    const setPlayback = () => {
        live = false;
        liveButtonJump.show();
        liveButtonLive.hide();
        togglePlaybackButtons.removeClass("disabled");
        speedButton.removeClass("disabled");
    };

    const onDateTimeChanged = (ct, i) => {
        currentPlayTime = roundDate(ct);
        setPlayback();
        update(currentPlayTime);
    }

    dateTimePicker.datetimepicker({
        minDate: oldestServerTime,
        maxDate: currentServerTime,
        step: 30,
        todayButton: false,
        onSelectDate: onDateTimeChanged,
        onSelectTime: onDateTimeChanged
    });

    document.addEventListener("visibilitychange", async (event) => {
        if (document.visibilityState === "visible") {
            currentServerTime = await getDateFromFile(LATEST_JSON_URL, "latest");

            if (live) {
                currentPlayTime = new Date(currentServerTime.getTime());
                update(currentPlayTime);
                exec = 0;
            }
        }
    });

    setInterval(async () => {
        exec++;

        if (currentPlayTime > currentServerTime) {
            setLive();
            currentPlayTime = new Date(currentServerTime.getTime());
        }

        let timeChanged = false;

        if (exec % (REFETCH_INTERVAL / LOOP_MS) === 0) {
            currentServerTime = await getDateFromFile(LATEST_JSON_URL, "latest");
            timeChanged = true;
        } else if (exec % (SERVER_UPDATE_INTERVAL / LOOP_MS) === 0) {
            currentServerTime = new Date(currentServerTime.getTime() + SERVER_UPDATE_INTERVAL);
            timeChanged = true;
        }

        if (live && timeChanged) {
            currentPlayTime = new Date(currentServerTime.getTime());
            update(currentPlayTime);
                
            return;
        }

        if (!live && !pause) {
            currentPlayTime = new Date(currentPlayTime.getTime() + SERVER_UPDATE_INTERVAL * AVAILABLE_SPEEDS[speedIndex]);

            if (currentPlayTime > currentServerTime) {
                setLive();
                return;
            }

            update(currentPlayTime);
        }
    }, LOOP_MS);

    liveButtonJump.on("click", () => setLive());

    togglePlaybackButtons.on("click", () => {
        if (pause) {
            playButton.hide();
            pauseButton.show();
            pause = false;
        } else {
            playButton.show();
            pauseButton.hide();
            pause = true;
        }
    });

    speedButton.on("click", () => {
        speedIndex = (speedIndex + 1) % AVAILABLE_SPEEDS.length;
        currentSpeed.text(AVAILABLE_SPEEDS[speedIndex]);
    })

};

$(() => {
    main();
});
