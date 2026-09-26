/* =========================================================
   MERO-PREDICT
   COMPANY DETAILS PAGE
   Complete Frontend JavaScript
   ========================================================= */

console.log("COMPANY DETAILS JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       GLOBAL VARIABLES
       ===================================================== */

    let companyData = null;
    let priceChart = null;
    let volumeChart = null;

    const scriptTag = document.querySelector(
        'script[src*="company_details.js"]'
    );

    const symbol = scriptTag
        ? scriptTag.dataset.symbol
        : "";

    console.log("Company Symbol:", symbol);


    /* =====================================================
       BASIC VALIDATION
       ===================================================== */

    if (!symbol) {
        console.error("Company symbol not found.");
        showPageError("Company symbol could not be identified.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        showPageError("Chart library could not be loaded.");
        return;
    }

    console.log("Chart.js loaded successfully.");
    console.log("Chart.js version:", Chart.version);


    /* =====================================================
       INITIALIZE PAGE
       ===================================================== */

    loadCompanyData();


    /* =====================================================
       LOAD COMPANY DATA
       ===================================================== */

    async function loadCompanyData() {

        console.log(
            `Loading company data for ${symbol}...`
        );

        try {

            const response = await fetch(
                `/api/companies/${encodeURIComponent(symbol)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-store"
                }
            );

            console.log(
                "API response status:",
                response.status
            );

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data = await response.json();

            console.log("API data received:", data);

            if (!data.success) {
                throw new Error(
                    data.message || "Unable to load company data."
                );
            }

            companyData = data;

            console.log(
                "History records:",
                Array.isArray(data.history)
                    ? data.history.length
                    : 0
            );

            renderCompanyPage();

        } catch (error) {

            console.error(
                "Company data loading error:",
                error
            );

            showPageError(
                "Unable to load company details."
            );
        }
    }


    /* =====================================================
       RENDER COMPLETE PAGE
       ===================================================== */

    function renderCompanyPage() {

        console.log("Rendering company page...");

        renderHeader();
        renderPrice();
        renderPrediction();
        renderTechnicals();

        /*
         * Important:
         * Wait until browser has completed layout
         * before creating Chart.js charts.
         */
        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                console.log(
                    "Browser layout ready. Creating charts..."
                );

                renderPriceChart("3M");
                renderVolumeChart();

            });

        });

        initRangeTabs();
        initWatchlistToggle();
        initCompareButton();

        console.log(
            "Company page rendering completed."
        );
    }


    /* =====================================================
       HEADER
       ===================================================== */

    function renderHeader() {

        if (!companyData || !companyData.company) {
            return;
        }

        const company = companyData.company;

        const title = document.querySelector(
            ".company-title-row h1"
        );

        const sector = document.querySelector(
            ".sector-badge"
        );

        const fullname = document.querySelector(
            ".company-fullname"
        );

        const logo = document.querySelector(
            ".company-logo"
        );

        if (title) {
            title.textContent =
                company.symbol || symbol;
        }

        if (sector) {
            sector.textContent =
                company.sector || "N/A";
        }

        if (fullname) {
            fullname.textContent =
                company.symbol || symbol;
        }

        if (logo) {
            logo.textContent =
                (company.symbol || symbol)
                .substring(0, 2)
                .toUpperCase();
        }
    }


    /* =====================================================
       PRICE SECTION
       ===================================================== */

    function renderPrice() {

        const latest = companyData?.latest;

        if (!latest) {
            return;
        }

        setText(
            "currentPrice",
            formatNumber(latest.close)
        );

        setText(
            "statOpen",
            formatNumber(latest.open)
        );

        setText(
            "statHigh",
            formatNumber(latest.high)
        );

        setText(
            "statLow",
            formatNumber(latest.low)
        );

        setText(
            "statVolume",
            formatVolume(latest.volume)
        );

        const changeElement =
            document.getElementById("priceChange");

        const changeText =
            document.getElementById("priceChangeText");

        const changeIcon =
            changeElement?.querySelector("i");

        const change = Number(latest.change) || 0;
        const changePercent =
            Number(latest.change_percent) || 0;

        if (changeText) {

            const sign =
                change > 0
                    ? "+"
                    : "";

            changeText.textContent =
                `${sign}${formatNumber(change)} (${sign}${changePercent.toFixed(2)}%)`;
        }

        if (changeElement) {

            changeElement.classList.remove(
                "positive",
                "negative",
                "neutral",
                "up",
                "down"
            );

            if (change > 0) {

                changeElement.classList.add(
                    "positive",
                    "up"
                );

                if (changeIcon) {
                    changeIcon.className =
                        "bi bi-arrow-up";
                }

            } else if (change < 0) {

                changeElement.classList.add(
                    "negative",
                    "down"
                );

                if (changeIcon) {
                    changeIcon.className =
                        "bi bi-arrow-down";
                }

            } else {

                changeElement.classList.add(
                    "neutral"
                );

                if (changeIcon) {
                    changeIcon.className =
                        "bi bi-dash";
                }
            }
        }
    }


    /* =====================================================
       PRICE CHART
       ===================================================== */

    function renderPriceChart(range = "3M") {

        console.log(
            `Preparing price chart for range: ${range}`
        );

        const canvas =
            document.getElementById("priceChart");

        if (!canvas) {

            console.error(
                "Price chart canvas not found."
            );

            return;
        }

        const container =
            canvas.parentElement;

        if (!container) {

            console.error(
                "Price chart container not found."
            );

            return;
        }

        console.log(
            "Price canvas:",
            canvas
        );

        console.log(
            "Price canvas dimensions:",
            canvas.getBoundingClientRect()
        );

        if (!companyData ||
            !Array.isArray(companyData.history)) {

            console.error(
                "Company history is missing."
            );

            return;
        }

        let history =
            [...companyData.history];

        if (history.length === 0) {

            console.error(
                "No history data available."
            );

            return;
        }


        /* ---------------------------------------------
           Sort by date
           --------------------------------------------- */

        history.sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


        /* ---------------------------------------------
           Apply selected range
           --------------------------------------------- */

        if (range === "1M") {

            history =
                history.slice(-22);

        } else if (range === "3M") {

            history =
                history.slice(-66);

        } else {

            /*
             * ALL = complete available history
             */
        }


        console.log(
            "Price chart points:",
            history.length
        );


        /* ---------------------------------------------
           Clean data
           --------------------------------------------- */

        const labels = [];
        const prices = [];

        history.forEach(item => {

            const date =
                new Date(item.date);

            const close =
                Number(item.close);

            if (
                !Number.isNaN(date.getTime()) &&
                Number.isFinite(close)
            ) {

                labels.push(
                    formatChartDate(date)
                );

                prices.push(close);
            }
        });


        console.log(
            "Valid price points:",
            prices.length
        );


        if (prices.length === 0) {

            console.error(
                "No valid price values found."
            );

            return;
        }


        /* ---------------------------------------------
           Destroy old chart
           --------------------------------------------- */

        destroyChart(canvas, "price");


        /* ---------------------------------------------
           Create new chart
           --------------------------------------------- */

        console.log(
            "Creating price chart..."
        );

        try {

            priceChart = new Chart(
                canvas,
                {
                    type: "line",

                    data: {
                        labels: labels,

                        datasets: [
                            {
                                label: "Closing Price",

                                data: prices,

                                borderWidth: 2,

                                pointRadius: 0,

                                pointHoverRadius: 5,

                                tension: 0.35,

                                fill: true,

                                backgroundColor:
                                    "rgba(45, 212, 191, 0.10)",

                                borderColor:
                                    "#2dd4bf",

                                pointBackgroundColor:
                                    "#2dd4bf",

                                pointBorderColor:
                                    "#2dd4bf"
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        animation: {
                            duration: 500
                        },

                        interaction: {
                            mode: "index",
                            intersect: false
                        },

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                enabled: true,

                                displayColors: false,

                                callbacks: {

                                    title: function(context) {

                                        return context[0]
                                            ? context[0].label
                                            : "";
                                    },

                                    label: function(context) {

                                        return `NPR ${formatNumber(context.parsed.y)}`;
                                    }
                                }
                            }
                        },

                        scales: {

                            x: {

                                grid: {
                                    display: false
                                },

                                ticks: {
                                    color: "#8d98ad",

                                    maxTicksLimit: 8,

                                    maxRotation: 0
                                }
                            },

                            y: {

                                beginAtZero: false,

                                grid: {
                                    color:
                                        "rgba(255,255,255,0.06)"
                                },

                                ticks: {

                                    color: "#8d98ad",

                                    callback: function(value) {

                                        return "NPR " +
                                            formatNumber(value);
                                    }
                                }
                            }
                        }
                    }
                }
            );


            console.log(
                "Price chart created successfully:",
                priceChart
            );


            /*
             * Force resize after creation.
             */
            setTimeout(() => {

                if (priceChart) {

                    priceChart.resize();
                    priceChart.update("none");

                    console.log(
                        "Price chart resized successfully."
                    );
                }

            }, 100);


        } catch (error) {

            console.error(
                "PRICE CHART CREATION ERROR:",
                error
            );
        }
    }


    /* =====================================================
       VOLUME CHART
       ===================================================== */

    function renderVolumeChart() {

        console.log(
            "Preparing volume chart..."
        );

        const canvas =
            document.getElementById(
                "intradayVolumeChart"
            );

        if (!canvas) {

            console.error(
                "Volume chart canvas not found."
            );

            return;
        }

        if (!companyData ||
            !Array.isArray(companyData.history)) {

            console.error(
                "Volume history is missing."
            );

            return;
        }

        let history =
            [...companyData.history];

        history.sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

        /*
         * Keep last 66 trading days.
         */
        history =
            history.slice(-66);


        const labels = [];
        const volumes = [];

        history.forEach(item => {

            const date =
                new Date(item.date);

            const volume =
                Number(item.volume);

            if (
                !Number.isNaN(date.getTime()) &&
                Number.isFinite(volume)
            ) {

                labels.push(
                    formatChartDate(date)
                );

                volumes.push(volume);
            }
        });


        console.log(
            "Valid volume points:",
            volumes.length
        );


        if (volumes.length === 0) {

            console.error(
                "No valid volume values found."
            );

            return;
        }


        /* ---------------------------------------------
           Destroy old volume chart
           --------------------------------------------- */

        destroyChart(canvas, "volume");


        /* ---------------------------------------------
           Create volume chart
           --------------------------------------------- */

        console.log(
            "Creating volume chart..."
        );

        try {

            volumeChart = new Chart(
                canvas,
                {
                    type: "bar",

                    data: {

                        labels: labels,

                        datasets: [
                            {
                                label: "Volume",

                                data: volumes,

                                backgroundColor:
                                    "rgba(59, 130, 246, 0.45)",

                                borderColor:
                                    "#3b82f6",

                                borderWidth: 1,

                                borderRadius: 2
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        animation: {
                            duration: 400
                        },

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                enabled: true,

                                displayColors: false,

                                callbacks: {

                                    label: function(context) {

                                        return `Volume: ${formatVolume(context.parsed.y)}`;
                                    }
                                }
                            }
                        },

                        scales: {

                            x: {

                                display: false,

                                grid: {
                                    display: false
                                }
                            },

                            y: {

                                display: false,

                                beginAtZero: true,

                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                }
            );


            console.log(
                "Volume chart created successfully:",
                volumeChart
            );


            setTimeout(() => {

                if (volumeChart) {

                    volumeChart.resize();
                    volumeChart.update("none");

                }

            }, 100);


        } catch (error) {

            console.error(
                "VOLUME CHART CREATION ERROR:",
                error
            );
        }
    }


    /* =====================================================
       DESTROY CHART SAFELY
       ===================================================== */

    function destroyChart(canvas, chartType) {

        if (!canvas) {
            return;
        }

        try {

            const existingChart =
                Chart.getChart(canvas);

            if (existingChart) {

                console.log(
                    `Destroying existing ${chartType} chart...`
                );

                existingChart.destroy();
            }

        } catch (error) {

            console.warn(
                `Could not destroy ${chartType} chart:`,
                error
            );
        }


        if (chartType === "price") {
            priceChart = null;
        }

        if (chartType === "volume") {
            volumeChart = null;
        }
    }


    /* =====================================================
       PREDICTION
       ===================================================== */

    function renderPrediction() {

        const prediction =
            companyData?.prediction;

        const latest =
            companyData?.latest;

        if (!prediction) {

            renderPredictionUnavailable();
            return;
        }


        const direction =
            String(
                prediction.direction || ""
            ).toUpperCase();

        const confidence =
            Number(
                prediction.confidence
            ) || 0;


        setText(
            "predictionDirection",
            direction || "--"
        );

        setText(
            "confidenceValue",
            `${confidence.toFixed(2)}%`
        );

        setText(
            "predictionCurrentClose",
            formatNumber(
                latest?.close
            )
        );


        /*
         * Prediction date = next trading day
         * based on latest available date.
         */
        if (latest?.date) {

            const predictionDate =
                getNextDate(latest.date);

            setText(
                "predictionDate",
                formatDisplayDate(predictionDate)
            );
        }


        const confidenceFill =
            document.getElementById(
                "confidenceFill"
            );

        if (confidenceFill) {

            const safeConfidence =
                Math.max(
                    0,
                    Math.min(
                        100,
                        confidence
                    )
                );

            confidenceFill.style.width =
                `${safeConfidence}%`;
        }


        const directionIcon =
            document.getElementById(
                "directionIcon"
            );

        const icon =
            directionIcon?.querySelector("i");

        if (directionIcon) {

            directionIcon.classList.remove(
                "up",
                "down",
                "positive",
                "negative"
            );

            if (direction === "UP") {

                directionIcon.classList.add(
                    "up",
                    "positive"
                );

                if (icon) {
                    icon.className =
                        "bi bi-arrow-up";
                }

            } else if (direction === "DOWN") {

                directionIcon.classList.add(
                    "down",
                    "negative"
                );

                if (icon) {
                    icon.className =
                        "bi bi-arrow-down";
                }

            } else {

                if (icon) {
                    icon.className =
                        "bi bi-dash";
                }
            }
        }


        const predictionText =
            document.getElementById(
                "predictionDirection"
            );

        if (predictionText) {

            predictionText.classList.remove(
                "up",
                "down",
                "positive",
                "negative"
            );

            if (direction === "UP") {

                predictionText.classList.add(
                    "up",
                    "positive"
                );

            } else if (direction === "DOWN") {

                predictionText.classList.add(
                    "down",
                    "negative"
                );
            }
        }
    }


    /* =====================================================
       PREDICTION UNAVAILABLE
       ===================================================== */

    function renderPredictionUnavailable() {

        setText(
            "predictionDirection",
            "--"
        );

        setText(
            "confidenceValue",
            "--"
        );

        setText(
            "predictionCurrentClose",
            formatNumber(
                companyData?.latest?.close
            )
        );

        setText(
            "predictionDate",
            "--"
        );

        const confidenceFill =
            document.getElementById(
                "confidenceFill"
            );

        if (confidenceFill) {
            confidenceFill.style.width = "0%";
        }
    }


    /* =====================================================
       TECHNICAL INDICATORS
       ===================================================== */

    function renderTechnicals() {

        const history =
            companyData?.history;

        if (!Array.isArray(history) ||
            history.length === 0) {

            return;
        }

        const sortedHistory =
            [...history].sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

        const closes =
            sortedHistory
                .map(item => Number(item.close))
                .filter(Number.isFinite);

        const volumes =
            sortedHistory
                .map(item => Number(item.volume))
                .filter(Number.isFinite);


        /* RSI */

        const rsi =
            calculateRSI(
                closes,
                14
            );

        renderRSI(rsi);


        /* Moving averages */

        const ma5 =
            calculateSMA(
                closes,
                5
            );

        const ma50 =
            calculateSMA(
                closes,
                50
            );

        const ma200 =
            calculateSMA(
                closes,
                200
            );

        const ema20 =
            calculateEMA(
                closes,
                20
            );

        renderMovingAverages({
            ma5,
            ma50,
            ma200,
            ema20
        });


        /* Volume trend */

        renderVolumeTrend(
            volumes
        );
    }


    /* =====================================================
       RSI
       ===================================================== */

    function renderRSI(rsi) {

        const valueElement =
            document.getElementById(
                "rsiValue"
            );

        const statusElement =
            document.getElementById(
                "rsiStatus"
            );

        const gauge =
            document.getElementById(
                "rsiGauge"
            );


        if (rsi === null) {

            if (valueElement) {
                valueElement.textContent = "--";
            }

            if (statusElement) {
                statusElement.textContent = "--";
            }

            return;
        }


        const rounded =
            rsi.toFixed(2);


        if (valueElement) {
            valueElement.textContent =
                rounded;
        }


        let status = "Neutral";

        if (rsi >= 70) {
            status = "Overbought";
        } else if (rsi <= 30) {
            status = "Oversold";
        }


        if (statusElement) {
            statusElement.textContent =
                status;
        }


        if (gauge) {

            /*
             * Store percentage for CSS.
             */
            gauge.style.setProperty(
                "--rsi-percent",
                `${Math.max(
                    0,
                    Math.min(100, rsi)
                )}%`
            );
        }
    }


    /* =====================================================
       MOVING AVERAGES
       ===================================================== */

    function renderMovingAverages(values) {

        const container =
            document.getElementById(
                "movingAveragesList"
            );

        if (!container) {
            return;
        }


        const items = [

            {
                name: "MA (5)",
                value: values.ma5
            },

            {
                name: "MA (50)",
                value: values.ma50
            },

            {
                name: "MA (200)",
                value: values.ma200
            },

            {
                name: "EMA (20)",
                value: values.ema20
            }

        ];


        container.innerHTML = "";


        items.forEach(item => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "moving-average-item";


            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                item.name;


            const value =
                document.createElement(
                    "strong"
                );

            value.textContent =
                item.value !== null
                    ? `NPR ${formatNumber(item.value)}`
                    : "--";


            row.appendChild(name);
            row.appendChild(value);

            container.appendChild(row);
        });
    }


    /* =====================================================
       VOLUME TREND
       ===================================================== */

    function renderVolumeTrend(volumes) {

        const label =
            document.getElementById(
                "volumeTrendLabel"
            );

        const bars =
            document.getElementById(
                "volumeBars"
            );

        if (!volumes ||
            volumes.length === 0) {

            if (label) {
                label.innerHTML =
                    '<i class="bi bi-dash"></i> --';
            }

            return;
        }


        const recent =
            volumes.slice(-5);

        const previous =
            volumes.slice(
                -10,
                -5
            );


        const recentAverage =
            average(recent);

        const previousAverage =
            average(previous);


        let trend =
            "Stable";

        if (previousAverage > 0) {

            const percentageChange =
                (
                    (recentAverage -
                        previousAverage) /
                    previousAverage
                ) * 100;


            if (percentageChange > 10) {
                trend = "Increasing";
            } else if (percentageChange < -10) {
                trend = "Decreasing";
            }
        }


        if (label) {

            let icon =
                "bi bi-dash";

            if (trend === "Increasing") {
                icon =
                    "bi bi-arrow-up";
            } else if (trend === "Decreasing") {
                icon =
                    "bi bi-arrow-down";
            }

            label.innerHTML =
                `<i class="${icon}"></i> ${trend}`;
        }


        renderVolumeBars(
            recent
        );
    }


    /* =====================================================
       VOLUME BARS
       ===================================================== */

    function renderVolumeBars(volumes) {

        const container =
            document.getElementById(
                "volumeBars"
            );

        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (!volumes ||
            volumes.length === 0) {

            return;
        }


        const max =
            Math.max(
                ...volumes
            );


        volumes.forEach(volume => {

            const bar =
                document.createElement(
                    "span"
                );

            bar.className =
                "volume-bar";


            let height = 10;

            if (max > 0) {

                height =
                    Math.max(
                        10,
                        (volume / max) * 100
                    );
            }


            bar.style.height =
                `${height}%`;

            container.appendChild(bar);
        });
    }


    /* =====================================================
       RANGE TABS
       ===================================================== */

    function initRangeTabs() {

        const tabs =
            document.querySelectorAll(
                ".range-tab"
            );

        if (!tabs.length) {
            return;
        }


        tabs.forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    tabs.forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });


                    tab.classList.add(
                        "active"
                    );


                    const range =
                        tab.dataset.range ||
                        "3M";


                    /*
                     * Re-render only price chart.
                     */
                    requestAnimationFrame(
                        () => {
                            renderPriceChart(
                                range
                            );
                        }
                    );
                }
            );
        });
    }


    /* =====================================================
       WATCHLIST BUTTON
       ===================================================== */

    function initWatchlistToggle() {

        const button =
            document.getElementById(
                "watchlistToggle"
            );

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                const icon =
                    button.querySelector("i");

                const active =
                    button.classList.toggle(
                        "active"
                    );


                if (icon) {

                    icon.className =
                        active
                            ? "bi bi-star-fill"
                            : "bi bi-star";
                }


                button.setAttribute(
                    "aria-label",
                    active
                        ? "Remove from watchlist"
                        : "Add to watchlist"
                );

                button.setAttribute(
                    "title",
                    active
                        ? "Remove from watchlist"
                        : "Add to watchlist"
                );
            }
        );
    }


    /* =====================================================
       COMPARE BUTTON
       ===================================================== */

    function initCompareButton() {

        const button =
            document.getElementById(
                "compareBtn"
            );

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                const compareUrl =
                    `/compare-stocks?symbol=${encodeURIComponent(symbol)}`;

                window.location.href =
                    compareUrl;
            }
        );
    }


    /* =====================================================
       HELPER: TEXT
       ===================================================== */

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );

        if (element) {
            element.textContent =
                value ?? "--";
        }
    }


    /* =====================================================
       HELPER: NUMBER
       ===================================================== */

    function formatNumber(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "--";
        }

        return number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    /* =====================================================
       HELPER: VOLUME
       ===================================================== */

    function formatVolume(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "--";
        }


        if (number >= 10000000) {

            return (
                number / 10000000
            ).toFixed(2) + " Cr";
        }


        if (number >= 100000) {

            return (
                number / 100000
            ).toFixed(2) + " L";
        }


        if (number >= 1000) {

            return (
                number / 1000
            ).toFixed(2) + "K";
        }


        return number.toLocaleString(
            "en-IN"
        );
    }


    /* =====================================================
       HELPER: CHART DATE
       ===================================================== */

    function formatChartDate(date) {

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short"
            }
        );
    }


    /* =====================================================
       HELPER: DISPLAY DATE
       ===================================================== */

    function formatDisplayDate(date) {

        if (!(date instanceof Date) ||
            Number.isNaN(date.getTime())) {

            return "--";
        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       HELPER: NEXT DATE
       ===================================================== */

    function getNextDate(dateString) {

        const date =
            new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        /*
         * Approximate next calendar day.
         * The label is only informational because
         * actual exchange holidays are not available
         * from the current API.
         */
        date.setDate(
            date.getDate() + 1
        );

        return date;
    }


    /* =====================================================
       HELPER: AVERAGE
       ===================================================== */

    function average(values) {

        if (!values ||
            values.length === 0) {

            return 0;
        }

        const validValues =
            values.filter(
                Number.isFinite
            );

        if (validValues.length === 0) {
            return 0;
        }

        return (
            validValues.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) /
            validValues.length
        );
    }


    /* =====================================================
       HELPER: SMA
       ===================================================== */

    function calculateSMA(
        values,
        period
    ) {

        if (!values ||
            values.length < period) {

            return null;
        }

        const recent =
            values.slice(-period);

        return average(recent);
    }


    /* =====================================================
       HELPER: EMA
       ===================================================== */

    function calculateEMA(
        values,
        period
    ) {

        if (!values ||
            values.length < period) {

            return null;
        }


        const multiplier =
            2 / (period + 1);


        let ema =
            average(
                values.slice(0, period)
            );


        for (
            let i = period;
            i < values.length;
            i++
        ) {

            ema =
                (
                    values[i] - ema
                ) * multiplier +
                ema;
        }


        return ema;
    }


    /* =====================================================
       HELPER: RSI
       ===================================================== */

    function calculateRSI(
        values,
        period = 14
    ) {

        if (!values ||
            values.length <= period) {

            return null;
        }


        let gains = 0;
        let losses = 0;


        for (
            let i = 1;
            i <= period;
            i++
        ) {

            const difference =
                values[i] -
                values[i - 1];


            if (difference > 0) {

                gains += difference;

            } else {

                losses += Math.abs(
                    difference
                );
            }
        }


        let averageGain =
            gains / period;

        let averageLoss =
            losses / period;


        for (
            let i = period + 1;
            i < values.length;
            i++
        ) {

            const difference =
                values[i] -
                values[i - 1];


            const gain =
                difference > 0
                    ? difference
                    : 0;

            const loss =
                difference < 0
                    ? Math.abs(difference)
                    : 0;


            averageGain =
                (
                    averageGain *
                        (period - 1) +
                    gain
                ) / period;


            averageLoss =
                (
                    averageLoss *
                        (period - 1) +
                    loss
                ) / period;
        }


        if (averageLoss === 0) {

            return 100;
        }


        const relativeStrength =
            averageGain /
            averageLoss;


        return (
            100 -
            (
                100 /
                (1 + relativeStrength)
            )
        );
    }


    /* =====================================================
       PAGE ERROR
       ===================================================== */

    function showPageError(message) {

        console.error(
            "Company Details Error:",
            message
        );

        const content =
            document.querySelector(
                ".company-details-content"
            );

        if (!content) {
            return;
        }


        /*
         * Do not completely destroy the page.
         * Add a visible error message instead.
         */
        let errorBox =
            document.getElementById(
                "companyDetailsError"
            );


        if (!errorBox) {

            errorBox =
                document.createElement(
                    "div"
                );

            errorBox.id =
                "companyDetailsError";

            errorBox.style.padding =
                "20px";

            errorBox.style.marginTop =
                "20px";

            errorBox.style.borderRadius =
                "12px";

            errorBox.style.background =
                "rgba(239, 68, 68, 0.10)";

            errorBox.style.border =
                "1px solid rgba(239, 68, 68, 0.25)";

            errorBox.style.color =
                "#fca5a5";

            content.prepend(
                errorBox
            );
        }


        errorBox.textContent =
            message;
    }


    /* =====================================================
       DEBUG HELPER
       ===================================================== */

    window.meroPredictCompanyDebug = {

        getData: () => companyData,

        getPriceChart: () => priceChart,

        getVolumeChart: () => volumeChart,

        reload: () => loadCompanyData(),

        renderPriceChart: range =>
            renderPriceChart(range)

    };


    console.log(
        "COMPANY DETAILS JS INITIALIZED"
    );

});