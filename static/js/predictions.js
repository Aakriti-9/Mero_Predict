/* =========================================================
   MERO-PREDICT
   STOCK PREDICTION PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("PREDICTIONS JS LOADED");

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const searchWrapper =
        document.getElementById("companySearchWrapper");

    const searchInput =
        document.getElementById("companySearchInput");

    const searchClear =
        document.getElementById("companySearchClear");

    const companyDropdown =
        document.getElementById("companyDropdown");

    const selectedCompanyInfo =
        document.getElementById("selectedCompanyInfo");

    const selectedCompanyInitials =
        document.getElementById("selectedCompanyInitials");

    const selectedCompanySymbol =
        document.getElementById("selectedCompanySymbol");

    const selectedCompanySector =
        document.getElementById("selectedCompanySector");

    const predictionLoading =
        document.getElementById("predictionLoading");

    const predictionEmpty =
        document.getElementById("predictionEmpty");

    const predictionContent =
        document.getElementById("predictionContent");

    const predictionError =
        document.getElementById("predictionError");

    const predictionErrorMessage =
        document.querySelector(".prediction-error-message");

    const predictionCompany =
        document.getElementById("predictionCompany");

    const predictionSector =
        document.getElementById("predictionSector");

    const predictionPrice =
        document.getElementById("predictionPrice");

    const predictionDate =
        document.getElementById("predictionDate");

    const predictionDirectionIcon =
        document.getElementById("predictionDirectionIcon");

    const predictionDirection =
        document.getElementById("predictionDirection");

    const predictionConfidence =
        document.getElementById("predictionConfidence");

    const confidenceBar =
        document.getElementById("confidenceBar");

    const predictionDirectionBox =
        document.getElementById("predictionDirectionBox");

    const indicatorMA5 =
        document.getElementById("indicatorMA5");

    const indicatorReturn3D =
        document.getElementById("indicatorReturn3D");

    const indicatorReturn5D =
        document.getElementById("indicatorReturn5D");

    const indicatorVolatility =
        document.getElementById("indicatorVolatility");

    const indicatorVolumeChange =
        document.getElementById("indicatorVolumeChange");

    const indicatorPriceChange =
        document.getElementById("indicatorPriceChange");

    const indicatorVWAP =
        document.getElementById("indicatorVWAP");

    const indicatorRange =
        document.getElementById("indicatorRange");

    const chartCanvas =
        document.getElementById("predictionPriceChart");


    /* =====================================================
       STATE
    ===================================================== */

    let companies = [];
    let predictionChart = null;
    let selectedSymbol = "";


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    hideElement(predictionLoading);
    hideElement(predictionContent);
    hideElement(predictionError);
    hideElement(selectedCompanyInfo);

    showElement(predictionEmpty);
    hideDropdown();


    /* =====================================================
       LOAD COMPANIES
    ===================================================== */

    loadCompanies();


    async function loadCompanies() {

        try {

            const response =
                await fetch("/admin/api/companies");

            if (!response.ok) {

                throw new Error(
                    `Failed to load companies (${response.status})`
                );
            }

            const data =
                await response.json();

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load companies."
                );
            }

            companies =
                extractCompanies(data)
                    .map(normalizeCompany)
                    .filter(function (company) {
                        return company.symbol;
                    })
                    .sort(function (a, b) {
                        return a.symbol.localeCompare(
                            b.symbol
                        );
                    });


            if (!companies.length) {

                throw new Error(
                    "No companies were returned by the server."
                );
            }


            console.log(
                `${companies.length} companies loaded`
            );

        } catch (error) {

            console.error(
                "Company loading error:",
                error
            );

            showError(
                "Unable to load companies. Please refresh the page and try again."
            );
        }
    }


    /* =====================================================
       EXTRACT COMPANIES
    ===================================================== */

    function extractCompanies(data) {

        if (!data) {
            return [];
        }

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data.companies)) {
            return data.companies;
        }

        if (
            data.data &&
            Array.isArray(data.data)
        ) {
            return data.data;
        }

        if (
            data.data &&
            Array.isArray(data.data.companies)
        ) {
            return data.data.companies;
        }

        return [];
    }


    /* =====================================================
       NORMALIZE COMPANY
    ===================================================== */

    function normalizeCompany(company) {

        if (typeof company === "string") {

            const symbol =
                company
                    .toUpperCase()
                    .trim();

            return {
                symbol: symbol,
                name: symbol,
                sector: ""
            };
        }


        if (!company) {

            return {
                symbol: "",
                name: "",
                sector: ""
            };
        }


        const symbol =
            (
                company.symbol ||
                company.Symbol ||
                company.ticker ||
                company.Ticker ||
                ""
            )
                .toString()
                .toUpperCase()
                .trim();


        const name =
            (
                company.name ||
                company.Name ||
                symbol
            )
                .toString()
                .trim();


        const sector =
            (
                company.sector ||
                company.Sector ||
                ""
            )
                .toString()
                .trim();


        return {
            symbol: symbol,
            name: name,
            sector: sector
        };
    }


    /* =====================================================
       SEARCH EVENTS
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "focus",
            function () {

                renderDropdown(
                    searchInput.value.trim()
                );

                showDropdown();
            }
        );


        searchInput.addEventListener(
            "input",
            function () {

                const query =
                    searchInput.value.trim();

                toggleClearButton();

                renderDropdown(query);

                showDropdown();
            }
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    hideDropdown();

                    return;
                }


                if (event.key === "Enter") {

                    event.preventDefault();

                    const visibleItems =
                        companyDropdown
                            ? companyDropdown.querySelectorAll(
                                ".company-dropdown-item"
                            )
                            : [];


                    if (visibleItems.length === 1) {

                        visibleItems[0].click();
                    }
                }
            }
        );
    }


    /* =====================================================
       CLEAR SEARCH
    ===================================================== */

    if (searchClear) {

        searchClear.addEventListener(
            "click",
            function () {

                if (searchInput) {
                    searchInput.value = "";
                }

                selectedSymbol = "";

                toggleClearButton();

                hideDropdown();

                resetPredictionPage();

                if (searchInput) {
                    searchInput.focus();
                }
            }
        );
    }


    /* =====================================================
       RENDER DROPDOWN
    ===================================================== */

    function renderDropdown(query) {

        if (!companyDropdown) {
            return;
        }


        const normalizedQuery =
            query
                .toLowerCase()
                .trim();


        let filteredCompanies =
            companies;


        if (normalizedQuery) {

            filteredCompanies =
                companies.filter(
                    function (company) {

                        const symbol =
                            company.symbol.toLowerCase();

                        const name =
                            company.name.toLowerCase();

                        const sector =
                            company.sector.toLowerCase();


                        return (
                            symbol.includes(
                                normalizedQuery
                            ) ||
                            name.includes(
                                normalizedQuery
                            ) ||
                            sector.includes(
                                normalizedQuery
                            )
                        );
                    }
                );
        }


        companyDropdown.innerHTML = "";


        if (!filteredCompanies.length) {

            companyDropdown.innerHTML = `
                <div class="company-dropdown-empty">
                    <i class="bi bi-search"></i>
                    <span>No company found.</span>
                </div>
            `;

            return;
        }


        const visibleCompanies =
            filteredCompanies.slice(0, 50);


        visibleCompanies.forEach(
            function (company) {

                const item =
                    document.createElement("button");

                item.type = "button";

                item.className =
                    "company-dropdown-item";


                item.innerHTML = `
                    <span class="dropdown-company-initials">
                        ${escapeHtml(
                            getInitials(
                                company.symbol
                            )
                        )}
                    </span>

                    <span class="dropdown-company-details">

                        <span class="dropdown-company-symbol">
                            ${escapeHtml(
                                company.symbol
                            )}
                        </span>

                        <span class="dropdown-company-sector">
                            ${escapeHtml(
                                company.sector ||
                                company.name ||
                                "Company"
                            )}
                        </span>

                    </span>

                    <span class="dropdown-company-arrow">
                        <i class="bi bi-chevron-right"></i>
                    </span>
                `;


                item.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

                        selectCompany(company);
                    }
                );


                companyDropdown.appendChild(item);
            }
        );
    }


    /* =====================================================
       SELECT COMPANY
    ===================================================== */

    function selectCompany(company) {

        if (!company || !company.symbol) {
            return;
        }


        selectedSymbol =
            company.symbol
                .toUpperCase()
                .trim();


        console.log(
            "COMPANY SELECTED:",
            selectedSymbol
        );


        if (searchInput) {

            searchInput.value =
                selectedSymbol;
        }


        toggleClearButton();

        hideDropdown();


        /* ---------------------------------------------
           SHOW SELECTED COMPANY
        --------------------------------------------- */

        setText(
            selectedCompanyInitials,
            getInitials(selectedSymbol)
        );

        setText(
            selectedCompanySymbol,
            selectedSymbol
        );

        setText(
            selectedCompanySector,
            company.sector || "—"
        );

        showElement(
            selectedCompanyInfo
        );


        /* ---------------------------------------------
           CLEAR OLD RESULT
        --------------------------------------------- */

        hideElement(
            predictionContent
        );

        hideElement(
            predictionEmpty
        );

        hideElement(
            predictionError
        );


        /* ---------------------------------------------
           LOAD PREDICTION
        --------------------------------------------- */

        console.log(
            "Loading prediction for:",
            selectedSymbol
        );

        loadPrediction(
            selectedSymbol
        );
    }


    /* =====================================================
       LOAD PREDICTION
    ===================================================== */

    async function loadPrediction(symbol) {

        console.log(
            `Loading prediction for ${symbol}`
        );


        showLoading();


        try {

            const apiUrl =
                `/api/companies/${encodeURIComponent(symbol)}`;


            console.log(
                "Prediction API URL:",
                apiUrl
            );


            const response =
                await fetch(apiUrl);


            console.log(
                "Prediction API status:",
                response.status
            );


            const data =
                await response.json();


            console.log(
                "Prediction API response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Prediction API returned ${response.status}`
                );
            }


            if (!data.success) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Prediction could not be generated."
                );
            }


            renderPrediction(data);
            recordPredictionView(symbol);


        } catch (error) {

            console.error(
                `Prediction error for ${symbol}:`,
                error
            );


            showError(
                error.message ||
                "Unable to load prediction data."
            );
        }
    }

    
    async function recordPredictionView(symbol) {

        if (!symbol) {
            return;
        }

        try {

            const response = await fetch(
                "/api/prediction-views",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        symbol: symbol
                    })
                }
            );

        const data = await response.json();

        if (!response.ok || !data.success) {

            console.warn(
                "Prediction view was not recorded:",
                data.message || "Unknown error"
            );

            return;
        }

        console.log(
            `Prediction view recorded for ${symbol}`
        );

        } catch (error) {

            console.warn(
                "Prediction view tracking failed:",
                error
            );
        }
    }

    /* =====================================================
       RENDER PREDICTION
    ===================================================== */

    function renderPrediction(data) {

        console.log(
            "Rendering prediction:",
            data
        );


        const company =
            data.company || {};

        const latest =
            data.latest || {};

        const prediction =
            data.prediction || null;

        const history =
            Array.isArray(data.history)
                ? data.history
                : [];


        const symbol =
            (
                company.symbol ||
                selectedSymbol ||
                ""
            )
                .toString()
                .toUpperCase();


        const sector =
            company.sector ||
            "—";


        /* ---------------------------------------------
           SELECTED COMPANY
        --------------------------------------------- */

        setText(
            selectedCompanyInitials,
            getInitials(symbol)
        );

        setText(
            selectedCompanySymbol,
            symbol
        );

        setText(
            selectedCompanySector,
            sector
        );


        /* ---------------------------------------------
           SNAPSHOT
        --------------------------------------------- */

        setText(
            predictionCompany,
            symbol
        );

        setText(
            predictionSector,
            sector
        );


        const latestPrice =
            getValue(
                latest,
                ["close", "Close"]
            );


        setText(
            predictionPrice,
            formatPrice(latestPrice)
        );


        const latestDate =
            getValue(
                latest,
                ["date", "Date"]
            );


        setText(
            predictionDate,
            formatDate(latestDate)
        );


        /* ---------------------------------------------
           PREDICTION RESULT
        --------------------------------------------- */

        renderPredictionResult(
            prediction
        );


        /* ---------------------------------------------
           INDICATORS
        --------------------------------------------- */

        renderIndicators(
            latest,
            history
        );


        /* ---------------------------------------------
           CHART
        --------------------------------------------- */

        renderPriceChart(
            history
        );


        /* ---------------------------------------------
           SHOW RESULT
        --------------------------------------------- */

        hideElement(
            predictionLoading
        );

        hideElement(
            predictionEmpty
        );

        hideElement(
            predictionError
        );


        showElement(
            selectedCompanyInfo
        );


        /*
         * IMPORTANT:
         * Remove the hidden class so CSS
         * cannot keep prediction content invisible.
         */

        showElement(
            predictionContent
        );


        /*
         * Extra safety:
         * explicitly make the result visible.
         */

        if (predictionContent) {

            predictionContent.style.display =
                "block";

            predictionContent.style.visibility =
                "visible";

            predictionContent.style.opacity =
                "1";
        }


        console.log(
            "Prediction content displayed successfully."
        );
    }


    /* =====================================================
       PREDICTION RESULT
    ===================================================== */

    function renderPredictionResult(prediction) {

        if (!prediction) {

            setText(
                predictionDirection,
                "—"
            );

            setText(
                predictionConfidence,
                "—"
            );


            if (confidenceBar) {

                confidenceBar.style.width =
                    "0%";
            }


            if (predictionDirectionIcon) {

                predictionDirectionIcon.innerHTML =
                    '<i class="bi bi-dash"></i>';
            }


            if (predictionDirectionBox) {

                predictionDirectionBox.classList.remove(
                    "up",
                    "down"
                );
            }

            return;
        }


        const direction =
            (
                prediction.direction ||
                prediction.prediction ||
                ""
            )
                .toString()
                .toUpperCase();


        const isUp =
            direction === "UP";

        const isDown =
            direction === "DOWN";


        setText(
            predictionDirection,
            direction || "—"
        );


        if (predictionDirectionIcon) {

            predictionDirectionIcon.innerHTML =
                isUp
                    ? '<i class="bi bi-arrow-up"></i>'
                    : isDown
                        ? '<i class="bi bi-arrow-down"></i>'
                        : '<i class="bi bi-dash"></i>';
        }


        if (predictionDirectionBox) {

            predictionDirectionBox.classList.remove(
                "up",
                "down"
            );


            if (isUp) {

                predictionDirectionBox.classList.add(
                    "up"
                );

            } else if (isDown) {

                predictionDirectionBox.classList.add(
                    "down"
                );
            }
        }


        let confidence =
            parseFloat(
                prediction.confidence
            );


        if (!Number.isFinite(confidence)) {

            confidence = 0;
        }


        /*
         * API normally returns percentage.
         *
         * Example:
         * 55.58
         *
         * If API returns decimal:
         * 0.5558
         *
         * convert to percentage.
         */

        if (
            confidence >= 0 &&
            confidence <= 1
        ) {

            confidence *= 100;
        }


        confidence =
            Math.max(
                0,
                Math.min(
                    100,
                    confidence
                )
            );


        setText(
            predictionConfidence,
            `${confidence.toFixed(1)}%`
        );


        if (confidenceBar) {

            confidenceBar.style.width =
                `${confidence}%`;
        }
    }


    /* =====================================================
       INDICATORS
    ===================================================== */

    function renderIndicators(
        latest,
        history
    ) {

        const closes =
            history
                .map(function (item) {

                    return parseFloat(
                        getValue(
                            item,
                            ["close", "Close"]
                        )
                    );
                })
                .filter(Number.isFinite);


        /* ---------------------------------------------
           MA5 DISTANCE
        --------------------------------------------- */

        let ma5Distance = null;


        if (closes.length >= 5) {

            const lastFive =
                closes.slice(-5);


            const ma5 =
                lastFive.reduce(
                    function (sum, value) {

                        return sum + value;

                    },
                    0
                ) / 5;


            const latestClose =
                closes[closes.length - 1];


            if (
                Number.isFinite(latestClose) &&
                ma5 !== 0
            ) {

                ma5Distance =
                    (
                        (latestClose - ma5)
                        / ma5
                    ) * 100;
            }
        }


        setText(
            indicatorMA5,
            formatPercentage(ma5Distance)
        );


        /* ---------------------------------------------
           RETURN 3D
        --------------------------------------------- */

        let return3D = null;


        if (closes.length >= 4) {

            const oldPrice =
                closes[closes.length - 4];

            const currentPrice =
                closes[closes.length - 1];


            if (
                Number.isFinite(oldPrice) &&
                oldPrice !== 0
            ) {

                return3D =
                    (
                        (currentPrice - oldPrice)
                        / oldPrice
                    ) * 100;
            }
        }


        setText(
            indicatorReturn3D,
            formatPercentage(return3D)
        );


        /* ---------------------------------------------
           RETURN 5D
        --------------------------------------------- */

        let return5D = null;


        if (closes.length >= 6) {

            const oldPrice =
                closes[closes.length - 6];

            const currentPrice =
                closes[closes.length - 1];


            if (
                Number.isFinite(oldPrice) &&
                oldPrice !== 0
            ) {

                return5D =
                    (
                        (currentPrice - oldPrice)
                        / oldPrice
                    ) * 100;
            }
        }


        setText(
            indicatorReturn5D,
            formatPercentage(return5D)
        );


        /* ---------------------------------------------
           VOLATILITY 5D
        --------------------------------------------- */

        let volatility5D = null;


        if (closes.length >= 6) {

            const recentPrices =
                closes.slice(-6);

            const returns = [];


            for (
                let i = 1;
                i < recentPrices.length;
                i++
            ) {

                const previous =
                    recentPrices[i - 1];

                const current =
                    recentPrices[i];


                if (
                    previous !== 0 &&
                    Number.isFinite(previous) &&
                    Number.isFinite(current)
                ) {

                    returns.push(
                        (
                            (current - previous)
                            / previous
                        ) * 100
                    );
                }
            }


            if (returns.length > 1) {

                const mean =
                    returns.reduce(
                        function (sum, value) {

                            return sum + value;

                        },
                        0
                    ) / returns.length;


                const variance =
                    returns.reduce(
                        function (sum, value) {

                            return (
                                sum +
                                Math.pow(
                                    value - mean,
                                    2
                                )
                            );

                        },
                        0
                    ) / returns.length;


                volatility5D =
                    Math.sqrt(variance);
            }
        }


        setText(
            indicatorVolatility,
            formatPercentage(volatility5D)
        );


        /* ---------------------------------------------
           VOLUME CHANGE
        --------------------------------------------- */

        const volumes =
            history
                .map(function (item) {

                    return parseFloat(
                        getValue(
                            item,
                            ["volume", "Vol"]
                        )
                    );
                })
                .filter(Number.isFinite);


        let volumeChange = null;


        if (volumes.length >= 2) {

            const previousVolume =
                volumes[volumes.length - 2];

            const currentVolume =
                volumes[volumes.length - 1];


            if (previousVolume !== 0) {

                volumeChange =
                    (
                        (
                            currentVolume -
                            previousVolume
                        )
                        / previousVolume
                    ) * 100;
            }
        }


        setText(
            indicatorVolumeChange,
            formatPercentage(volumeChange)
        );


        /* ---------------------------------------------
           PRICE CHANGE
        --------------------------------------------- */

        const changePercent =
            getValue(
                latest,
                ["change_percent"]
            );


        setText(
            indicatorPriceChange,
            formatPercentage(changePercent)
        );


        /* ---------------------------------------------
           VWAP
        --------------------------------------------- */

        /*
         * Current Company Details API does not return
         * the latest VWAP value.
         *
         * Therefore display a dash instead of
         * displaying an incorrect value.
         */

        setText(
            indicatorVWAP,
            "—"
        );


        /* ---------------------------------------------
           RANGE %
        --------------------------------------------- */

        const high =
            parseFloat(
                getValue(
                    latest,
                    ["high", "High"]
                )
            );


        const low =
            parseFloat(
                getValue(
                    latest,
                    ["low", "Low"]
                )
            );


        let rangePercent = null;


        if (
            Number.isFinite(high) &&
            Number.isFinite(low) &&
            low !== 0
        ) {

            rangePercent =
                (
                    (high - low)
                    / low
                ) * 100;
        }


        setText(
            indicatorRange,
            formatPercentage(rangePercent)
        );
    }


    /* =====================================================
       PRICE CHART
    ===================================================== */

    function renderPriceChart(history) {

        if (!chartCanvas) {
            return;
        }


        if (typeof Chart === "undefined") {

            console.error(
                "Chart.js is not loaded."
            );

            return;
        }


        destroyChart();


        if (!history.length) {
            return;
        }


        const sortedHistory =
            [...history].sort(
                function (a, b) {

                    return (
                        new Date(
                            getValue(
                                a,
                                ["date", "Date"]
                            )
                        ) -
                        new Date(
                            getValue(
                                b,
                                ["date", "Date"]
                            )
                        )
                    );
                }
            );


        const chartData =
            sortedHistory.slice(-60);


        const labels =
            chartData.map(
                function (item) {

                    return formatShortDate(
                        getValue(
                            item,
                            ["date", "Date"]
                        )
                    );
                }
            );


        const prices =
            chartData.map(
                function (item) {

                    const price =
                        parseFloat(
                            getValue(
                                item,
                                ["close", "Close"]
                            )
                        );


                    return Number.isFinite(price)
                        ? price
                        : null;
                }
            );


        const context =
            chartCanvas.getContext("2d");


        predictionChart =
            new Chart(
                context,
                {
                    type: "line",

                    data: {

                        labels: labels,

                        datasets: [
                            {
                                label:
                                    "Closing Price",

                                data: prices,

                                borderColor:
                                    "#10d9c4",

                                backgroundColor:
                                    "rgba(16, 217, 196, 0.08)",

                                borderWidth: 2,

                                pointRadius: 0,

                                pointHoverRadius: 4,

                                tension: 0.35,

                                fill: true
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        interaction: {
                            intersect: false,
                            mode: "index"
                        },

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                backgroundColor:
                                    "#080f22",

                                borderColor:
                                    "rgba(124, 145, 190, 0.18)",

                                borderWidth: 1,

                                titleColor:
                                    "#f5f7fb",

                                bodyColor:
                                    "#7c91be",

                                padding: 10,

                                displayColors: false,

                                callbacks: {

                                    label:
                                        function (context) {

                                            return (
                                                "Close: " +
                                                formatPrice(
                                                    context.raw
                                                )
                                            );
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

                                    color:
                                        "#657ba8",

                                    maxTicksLimit: 8,

                                    font: {
                                        size: 10
                                    }
                                },

                                border: {
                                    display: false
                                }
                            },

                            y: {

                                grid: {

                                    color:
                                        "rgba(124, 145, 190, 0.08)"
                                },

                                ticks: {

                                    color:
                                        "#657ba8",

                                    font: {
                                        size: 10
                                    }
                                },

                                border: {
                                    display: false
                                }
                            }
                        }
                    }
                }
            );
    }


    /* =====================================================
       RESET PAGE
    ===================================================== */

    function resetPredictionPage() {

        selectedSymbol = "";

        hideElement(
            predictionLoading
        );

        hideElement(
            predictionContent
        );

        hideElement(
            predictionError
        );

        hideElement(
            selectedCompanyInfo
        );

        showElement(
            predictionEmpty
        );

        destroyChart();
    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        showElement(
            predictionLoading
        );

        hideElement(
            predictionEmpty
        );

        hideElement(
            predictionContent
        );

        hideElement(
            predictionError
        );


        /*
         * Keep selected company visible
         * while prediction loads.
         */

        showElement(
            selectedCompanyInfo
        );
    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(message) {

        hideElement(
            predictionLoading
        );

        hideElement(
            predictionContent
        );

        hideElement(
            predictionEmpty
        );


        showElement(
            predictionError
        );


        if (predictionErrorMessage) {

            predictionErrorMessage.textContent =
                message;
        }
    }


    /* =====================================================
       DROPDOWN
    ===================================================== */

    function showDropdown() {

        if (companyDropdown) {

            companyDropdown.classList.remove(
                "hidden"
            );
        }
    }


    function hideDropdown() {

        if (companyDropdown) {

            companyDropdown.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       CLEAR BUTTON
    ===================================================== */

    function toggleClearButton() {

        if (
            !searchClear ||
            !searchInput
        ) {

            return;
        }


        if (searchInput.value.trim()) {

            searchClear.classList.remove(
                "hidden"
            );

        } else {

            searchClear.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       OUTSIDE CLICK
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (
                searchWrapper &&
                !searchWrapper.contains(
                    event.target
                )
            ) {

                hideDropdown();
            }
        }
    );


    /* =====================================================
       DESTROY CHART
    ===================================================== */

    function destroyChart() {

        if (predictionChart) {

            predictionChart.destroy();

            predictionChart = null;
        }
    }


    /* =====================================================
       SHOW / HIDE
    ===================================================== */

    /*
     * IMPORTANT FIX:
     *
     * .hidden uses:
     *
     * display: none !important;
     *
     * Therefore changing only style.display
     * is NOT enough.
     *
     * We must add/remove the hidden class.
     */

    function showElement(element) {

        if (!element) {
            return;
        }

        element.classList.remove(
            "hidden"
        );

        element.style.display =
            "";

        element.style.visibility =
            "visible";

        element.style.opacity =
            "1";
    }


    function hideElement(element) {

        if (!element) {
            return;
        }

        element.classList.add(
            "hidden"
        );

        element.style.display =
            "none";
    }


    /* =====================================================
       TEXT HELPER
    ===================================================== */

    function setText(element, value) {

        if (element) {

            element.textContent =
                value ?? "—";
        }
    }


    /* =====================================================
       VALUE HELPER
    ===================================================== */

    function getValue(object, keys) {

        if (!object) {
            return null;
        }


        for (const key of keys) {

            if (
                object[key] !== undefined &&
                object[key] !== null &&
                object[key] !== ""
            ) {

                return object[key];
            }
        }


        return null;
    }


    /* =====================================================
       INITIALS
    ===================================================== */

    function getInitials(symbol) {

        if (!symbol) {
            return "—";
        }


        return symbol
            .substring(0, 2)
            .toUpperCase();
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    function formatPrice(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";
        }


        const number =
            parseFloat(value);


        if (!Number.isFinite(number)) {
            return "—";
        }


        return number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    /* =====================================================
       PERCENTAGE FORMAT
    ===================================================== */

    function formatPercentage(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";
        }


        const number =
            parseFloat(value);


        if (!Number.isFinite(number)) {
            return "—";
        }


        return `${number.toFixed(2)}%`;
    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }


        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }


    /* =====================================================
       SHORT DATE
    ===================================================== */

    function formatShortDate(value) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );
    }

});