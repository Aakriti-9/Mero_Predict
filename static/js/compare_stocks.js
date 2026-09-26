document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const stockSelects = [
        document.getElementById("stockSelect1"),
        document.getElementById("stockSelect2"),
        document.getElementById("stockSelect3"),
        document.getElementById("stockSelect4")
    ];

    const selectedStockCount =
        document.getElementById("selectedStockCount");

    const compareBtn =
        document.getElementById("compareBtn");

    const comparisonResults =
        document.getElementById("comparisonResults");

    const comparisonEmptyState =
        document.getElementById("comparisonEmptyState");

    const comparisonLoading =
        document.getElementById("comparisonLoading");

    const comparisonError =
        document.getElementById("comparisonError");

    const comparisonErrorMessage =
        document.getElementById("comparisonErrorMessage");

    const performanceCanvas =
        document.getElementById("performanceChart");

    const priceCanvas =
        document.getElementById("priceChart");


    /* =====================================================
       STATE
    ===================================================== */

    let companies = [];

    let performanceChart = null;

    let priceChart = null;


    /* =====================================================
       CHECK PAGE
    ===================================================== */

    if (
        stockSelects.some(function (select) {
            return !select;
        })
    ) {

        console.error(
            "Compare Stocks: One or more stock selectors are missing."
        );

        return;
    }


    /* =====================================================
       LOAD COMPANIES
    ===================================================== */

    async function loadCompanies() {

        try {

            showLoading();
            hideError();

            const response =
                await fetch("/api/companies");

            if (!response.ok) {

                throw new Error(
                    "Failed to load companies."
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
                data.companies || [];

            populateStockSelects();

        }

        catch (error) {

            console.error(
                "Compare Stocks - Company loading error:",
                error
            );

            showError(
                "Unable to load companies. Please refresh the page and try again."
            );

        }

        finally {

            hideLoading();

        }

    }


    /* =====================================================
       POPULATE STOCK SELECTS
    ===================================================== */

    function populateStockSelects() {

        stockSelects.forEach(function (select) {

            select.innerHTML = "";

            const defaultOption =
                document.createElement("option");

            defaultOption.value = "";

            defaultOption.textContent =
                "Select company";

            select.appendChild(
                defaultOption
            );


            companies.forEach(function (company) {

                const option =
                    document.createElement("option");

                option.value =
                    company.symbol;

                option.textContent =
                    `${company.symbol} — ${company.sector || "Others"}`;

                option.dataset.sector =
                    company.sector || "Others";

                select.appendChild(
                    option
                );

            });

        });

    }


    /* =====================================================
       GET SELECTED SYMBOLS
    ===================================================== */

    function getSelectedSymbols() {

        return stockSelects
            .map(function (select) {

                return select.value;

            })
            .filter(function (symbol) {

                return symbol !== "";

            });

    }


    /* =====================================================
       UPDATE SELECTION
    ===================================================== */

    function updateSelection() {

        const selectedSymbols =
            getSelectedSymbols();

        const count =
            selectedSymbols.length;


        if (selectedStockCount) {

            selectedStockCount.textContent =
                `${count} ${count === 1 ? "stock" : "stocks"} selected`;

        }


        if (compareBtn) {

            compareBtn.disabled =
                count < 2;

        }


        updateDuplicateOptions(
            selectedSymbols
        );

    }


    /* =====================================================
       PREVENT DUPLICATE STOCKS
    ===================================================== */

    function updateDuplicateOptions(
        selectedSymbols
    ) {

        stockSelects.forEach(function (currentSelect) {

            const currentValue =
                currentSelect.value;


            Array.from(
                currentSelect.options
            ).forEach(function (option) {

                if (!option.value) {
                    return;
                }


                const isSelectedElsewhere =
                    selectedSymbols.includes(
                        option.value
                    ) &&
                    option.value !== currentValue;


                option.disabled =
                    isSelectedElsewhere;

            });

        });

    }


    /* =====================================================
       STOCK SELECT CHANGE
    ===================================================== */

    stockSelects.forEach(function (select) {

        select.addEventListener(
            "change",
            function () {

                updateSelection();

                hideError();

            }
        );

    });


    /* =====================================================
       COMPARE BUTTON
    ===================================================== */

    if (compareBtn) {

        compareBtn.addEventListener(
            "click",
            function () {

                const selectedSymbols =
                    getSelectedSymbols();


                if (selectedSymbols.length < 2) {

                    showError(
                        "Please select at least 2 companies to compare."
                    );

                    return;

                }


                if (selectedSymbols.length > 4) {

                    showError(
                        "You can compare a maximum of 4 companies."
                    );

                    return;

                }


                loadComparisonData(
                    selectedSymbols
                );

            }
        );

    }


    /* =====================================================
       LOAD COMPARISON DATA
    ===================================================== */

    async function loadComparisonData(
        selectedSymbols
    ) {

        try {

            showLoading();

            hideError();


            const response =
                await fetch(
                    "/api/compare-stocks",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            symbols:
                                selectedSymbols,

                            period:
                                getSelectedPeriod()

                        })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load comparison data."
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load comparison data."
                );

            }


            console.log(
                "Comparison data received:",
                data
            );


            renderComparison(
                data
            );

        }

        catch (error) {

            console.error(
                "Comparison loading error:",
                error
            );

            showError(
                error.message ||
                "Unable to load comparison data."
            );

        }

        finally {

            hideLoading();

        }

    }


    /* =====================================================
       GET SELECTED PERIOD
    ===================================================== */

    function getSelectedPeriod() {

        const periodSelect =
            document.getElementById(
                "performancePeriod"
            );


        if (!periodSelect) {
            return 60;
        }


        return Number(
            periodSelect.value
        ) || 60;

    }


    /* =====================================================
       PERFORMANCE PERIOD CHANGE
    ===================================================== */

    const performancePeriod =
        document.getElementById(
            "performancePeriod"
        );


    if (performancePeriod) {

        performancePeriod.addEventListener(
            "change",
            function () {

                const selectedSymbols =
                    getSelectedSymbols();


                if (selectedSymbols.length >= 2) {

                    loadComparisonData(
                        selectedSymbols
                    );

                }

            }
        );

    }


    /* =====================================================
       RENDER COMPARISON
    ===================================================== */

    function renderComparison(data) {

        const stocks =
            data.stocks || [];


        if (stocks.length < 2) {

            showError(
                "Not enough comparison data available."
            );

            return;

        }


        /* ---------------------------------------------
           Show result section
        --------------------------------------------- */

        if (comparisonResults) {

            comparisonResults.style.display =
                "block";

        }


        if (comparisonEmptyState) {

            comparisonEmptyState.style.display =
                "none";

        }


        /* ---------------------------------------------
           Render table
        --------------------------------------------- */

        renderComparisonTable(
            stocks
        );


        /* ---------------------------------------------
           Render charts
        --------------------------------------------- */

        renderPerformanceChart(
            stocks
        );


        renderPriceChart(
            stocks
        );

    }


    /* =====================================================
       RENDER COMPARISON TABLE
    ===================================================== */

    function renderComparisonTable(stocks) {

        const tableValues = [

            "metricHeader",

            "price",

            "prevClose",

            "change",

            "changePercent",

            "sector",

            "volume"

        ];


        stocks.forEach(function (stock, index) {

            const number =
                index + 1;


            const header =
                document.getElementById(
                    `metricHeader${number}`
                );

            const price =
                document.getElementById(
                    `price${number}`
                );

            const prevClose =
                document.getElementById(
                    `prevClose${number}`
                );

            const change =
                document.getElementById(
                    `change${number}`
                );

            const changePercent =
                document.getElementById(
                    `changePercent${number}`
                );

            const sector =
                document.getElementById(
                    `sector${number}`
                );

            const volume =
                document.getElementById(
                    `volume${number}`
                );


            if (header) {

                header.textContent =
                    stock.symbol;

            }


            if (price) {

                price.textContent =
                    formatNumber(
                        stock.close
                    );

            }


            if (prevClose) {

                prevClose.textContent =
                    formatNumber(
                        stock.prev_close
                    );

            }


            if (change) {

                change.textContent =
                    formatNumber(
                        stock.change
                    );

            }


            if (changePercent) {

                changePercent.textContent =
                    `${formatNumber(stock.change_percent)}%`;

            }


            if (sector) {

                sector.textContent =
                    stock.sector || "Others";

            }


            if (volume) {

                volume.textContent =
                    formatVolume(
                        stock.volume
                    );

            }

        });


        /* ---------------------------------------------
           Hide unused columns
        --------------------------------------------- */

        for (
            let i = stocks.length + 1;
            i <= 4;
            i++
        ) {

            const ids = [

                `metricHeader${i}`,
                `price${i}`,
                `prevClose${i}`,
                `change${i}`,
                `changePercent${i}`,
                `sector${i}`,
                `volume${i}`

            ];


            ids.forEach(function (id) {

                const element =
                    document.getElementById(id);

                if (element) {

                    const cell =
                        element.closest("th, td");

                    if (cell) {

                        cell.style.display =
                            "none";

                    }

                }

            });

        }


        /* ---------------------------------------------
           Show used columns
        --------------------------------------------- */

        for (
            let i = 1;
            i <= stocks.length;
            i++
        ) {

            const ids = [

                `metricHeader${i}`,
                `price${i}`,
                `prevClose${i}`,
                `change${i}`,
                `changePercent${i}`,
                `sector${i}`,
                `volume${i}`

            ];


            ids.forEach(function (id) {

                const element =
                    document.getElementById(id);

                if (element) {

                    const cell =
                        element.closest("th, td");

                    if (cell) {

                        cell.style.display =
                            "";

                    }

                }

            });

        }

    }


    /* =====================================================
       PERFORMANCE CHART
    ===================================================== */

    function renderPerformanceChart(stocks) {

        if (!performanceCanvas) {

            console.warn(
                "Performance chart canvas not found."
            );

            return;

        }


        const ctx =
            performanceCanvas.getContext("2d");


        /* ---------------------------------------------
           Destroy previous chart
        --------------------------------------------- */

        if (performanceChart) {

            performanceChart.destroy();

        }


        /* ---------------------------------------------
           Use dates from first stock
        --------------------------------------------- */

        const labels =
            stocks[0].history.map(function (item) {

                return formatDate(
                    item.date
                );

            });


        /* ---------------------------------------------
           Create datasets
        --------------------------------------------- */

        const datasets =
            stocks.map(function (stock) {

                return {

                    label:
                        stock.symbol,

                    data:
                        stock.history.map(
                            function (item) {

                                return item.performance;

                            }
                        ),

                    borderWidth:
                        2,

                    fill:
                        false,

                    tension:
                        0.3,

                    pointRadius:
                        0

                };

            });


        performanceChart =
            new Chart(
                ctx,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            labels,

                        datasets:
                            datasets

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            mode:
                                "index",

                            intersect:
                                false

                        },

                        plugins: {

                            legend: {

                                display:
                                    true

                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function (context) {

                                            return (
                                                `${context.dataset.label}: ` +
                                                `${context.parsed.y.toFixed(2)}%`
                                            );

                                        }

                                }

                            }

                        },

                        scales: {

                            x: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Trading Date"

                                }

                            },

                            y: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Performance (%)"

                                }

                            }

                        }

                    }

                }

            );

    }


    /* =====================================================
       PRICE CHART
    ===================================================== */

    function renderPriceChart(stocks) {

        if (!priceCanvas) {

            console.warn(
                "Price chart canvas not found."
            );

            return;

        }


        const ctx =
            priceCanvas.getContext("2d");


        /* ---------------------------------------------
           Destroy previous chart
        --------------------------------------------- */

        if (priceChart) {

            priceChart.destroy();

        }


        const labels =
            stocks[0].history.map(function (item) {

                return formatDate(
                    item.date
                );

            });


        const datasets =
            stocks.map(function (stock) {

                return {

                    label:
                        stock.symbol,

                    data:
                        stock.history.map(
                            function (item) {

                                return item.close;

                            }
                        ),

                    borderWidth:
                        2,

                    fill:
                        false,

                    tension:
                        0.3,

                    pointRadius:
                        0

                };

            });


        priceChart =
            new Chart(
                ctx,
                {

                    type:
                        "line",

                    data: {

                        labels:
                            labels,

                        datasets:
                            datasets

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            mode:
                                "index",

                            intersect:
                                false

                        },

                        plugins: {

                            legend: {

                                display:
                                    true

                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function (context) {

                                            return (
                                                `${context.dataset.label}: ` +
                                                formatNumber(
                                                    context.parsed.y
                                                )
                                            );

                                        }

                                }

                            }

                        },

                        scales: {

                            x: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Trading Date"

                                }

                            },

                            y: {

                                title: {

                                    display:
                                        true,

                                    text:
                                        "Closing Price"

                                }

                            }

                        }

                    }

                }

            );

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "";
        }


        const date =
            new Date(dateString);


        if (isNaN(date.getTime())) {

            return dateString;

        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0.00";

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
       FORMAT VOLUME
    ===================================================== */

    function formatVolume(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0";

        }


        return number.toLocaleString(
            "en-US",
            {
                maximumFractionDigits: 0
            }
        );

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        if (comparisonLoading) {

            comparisonLoading.style.display =
                "flex";

        }

    }


    function hideLoading() {

        if (comparisonLoading) {

            comparisonLoading.style.display =
                "none";

        }

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(message) {

        if (!comparisonError) {
            return;
        }


        comparisonError.style.display =
            "flex";


        if (comparisonErrorMessage) {

            comparisonErrorMessage.textContent =
                message;

        }

    }


    function hideError() {

        if (comparisonError) {

            comparisonError.style.display =
                "none";

        }

    }


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    if (comparisonResults) {

        comparisonResults.style.display =
            "none";

    }


    if (comparisonEmptyState) {

        comparisonEmptyState.style.display =
            "block";

    }


    updateSelection();


    /* =====================================================
       START
    ===================================================== */

    loadCompanies();

});