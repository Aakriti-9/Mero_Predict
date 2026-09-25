
/* =========================================================
   MARKET OVERVIEW CHARTS — Database Connected Edition
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       COMMON CHART OPTIONS
    ===================================================== */

    Chart.defaults.font.family =
        'Inter, "Segoe UI", Arial, sans-serif';

    Chart.defaults.color = "#6682b5";


    /* =====================================================
       GLOBAL CHART REFERENCES
    ===================================================== */

    let breadthChart = null;
    let turnoverChart = null;


    /* =====================================================
       DATA STATUS PLUGIN
       Shows "DATA" instead of pretending this is live API data.
    ===================================================== */

    function makeDataStatusPlugin(id) {

        return {
            id: id,

            afterDraw(chart) {

                const { ctx, chartArea } = chart;

                if (!chartArea) {
                    return;
                }

                const x = chartArea.right - 8;
                const y = chartArea.top + 4;

                ctx.save();

                /* Small status dot */

                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    3,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle = "#20d36b";

                ctx.shadowColor = "#20d36b";
                ctx.shadowBlur = 6;

                ctx.fill();

                ctx.shadowBlur = 0;


                /* DATA label */

                ctx.font =
                    "700 9px Inter, sans-serif";

                ctx.fillStyle =
                    "#20d36b";

                ctx.textAlign =
                    "right";

                ctx.textBaseline =
                    "middle";

                ctx.fillText(
                    "DATA",
                    x - 8,
                    y
                );

                ctx.restore();
            }
        };
    }


    /* =====================================================
       FETCH MARKET DATA
    ===================================================== */

    fetch("/api/market-overview")

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Failed to load market overview data."
                );
            }

            return response.json();
        })

        .then(function (data) {

            console.log(
                "Market overview data:",
                data
            );


            if (data.error) {

                throw new Error(
                    data.error
                );
            }


            /* =============================================
               UPDATE HTML SUMMARY CARDS
            ============================================= */

            updateSummaryCards(data);


            /* =============================================
               UPDATE MARKET BREADTH
            ============================================= */

            createBreadthChart(data);


            /* =============================================
               UPDATE TURNOVER
            ============================================= */

            createTurnoverChart(data);


            /* =============================================
               UPDATE SECTOR PERFORMANCE
            ============================================= */

            createSectorChart(data);

        })

        .catch(function (error) {

            console.error(
                "Market overview error:",
                error
            );

            showMarketError(
                "Unable to load market data."
            );

        });


    /* =====================================================
       UPDATE SUMMARY CARDS
    ===================================================== */

    function updateSummaryCards(data) {

        const cards =
            document.querySelectorAll(
                ".overview-card"
            );


        cards.forEach(function (card) {

            const labelElement =
                card.querySelector(
                    ".overview-card-label"
                );

            const valueElement =
                card.querySelector("h2");

            const descriptionElement =
                card.querySelector("p");


            if (!labelElement || !valueElement) {
                return;
            }


            const label =
                labelElement.textContent
                    .trim()
                    .toUpperCase();


            /* ---------------------------------------------
               TOTAL TURNOVER
            --------------------------------------------- */

            if (
                label === "TOTAL TURNOVER"
            ) {

                valueElement.textContent =
                    "NPR " +
                    Number(
                        data.total_turnover || 0
                    ).toFixed(2) +
                    "B";

                if (descriptionElement) {

                    descriptionElement.textContent =
                        "Latest trading day";
                }
            }


            /* ---------------------------------------------
               GAINERS / LOSERS
            --------------------------------------------- */

            else if (
                label === "GAINERS / LOSERS"
            ) {

                valueElement.textContent =
                    Number(
                        data.gainers || 0
                    ).toLocaleString() +
                    " / " +
                    Number(
                        data.losers || 0
                    ).toLocaleString();

                if (descriptionElement) {

                    descriptionElement.textContent =
                        "Advance / Decline";
                }
            }


            /* ---------------------------------------------
               NEPSE INDEX
            --------------------------------------------- */

            else if (
                label === "NEPSE INDEX"
            ) {

                if (
                    data.nepse_index !== null &&
                    data.nepse_index !== undefined
                ) {

                    valueElement.textContent =
                        Number(
                            data.nepse_index
                        ).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        );

                } else {

                    valueElement.textContent =
                        "N/A";
                }


                if (descriptionElement) {

                    descriptionElement.textContent =
                        "Index data unavailable";
                }
            }


            /* ---------------------------------------------
               MARKET CAP
            --------------------------------------------- */

            else if (
                label === "MARKET CAP"
            ) {

                if (
                    data.market_cap !== null &&
                    data.market_cap !== undefined
                ) {

                    valueElement.textContent =
                        "NPR " +
                        data.market_cap;

                } else {

                    valueElement.textContent =
                        "N/A";
                }


                if (descriptionElement) {

                    descriptionElement.textContent =
                        "Market-cap data unavailable";
                }
            }

        });


        /* =============================================
           UPDATE PAGE DATE
        ============================================= */

        const pageHeaderText =
            document.querySelector(
                ".overview-page-header p"
            );


        if (
            pageHeaderText &&
            data.latest_date
        ) {

            pageHeaderText.textContent =
                "Sector performance and market breadth — " +
                data.latest_date;
        }

    }


    /* =====================================================
       MARKET BREADTH DONUT
    ===================================================== */

    function createBreadthChart(data) {

        const breadthCanvas =
            document.getElementById(
                "marketBreadthChart"
            );


        if (!breadthCanvas) {
            return;
        }


        const gainers =
            Number(data.gainers || 0);

        const losers =
            Number(data.losers || 0);

        const unchanged =
            Number(data.unchanged || 0);


        const totalStocks =
            Number(
                data.total_stocks ||
                gainers +
                losers +
                unchanged
            );


        /* =============================================
           DESTROY OLD CHART IF NECESSARY
        ============================================= */

        if (breadthChart) {

            breadthChart.destroy();

        }


        /* =============================================
           CENTER TEXT
        ============================================= */

        function centerTextPlugin() {

            return {

                id: "centerText",

                beforeDraw(chart) {

                    const meta =
                        chart.getDatasetMeta(0);


                    if (
                        !meta ||
                        !meta.data ||
                        !meta.data[0]
                    ) {

                        return;
                    }


                    const {
                        width,
                        height,
                        ctx
                    } = chart;


                    const cx =
                        meta.data[0].x ??
                        width / 2;

                    const cy =
                        meta.data[0].y ??
                        height / 2;


                    ctx.save();


                    ctx.textAlign =
                        "center";

                    ctx.textBaseline =
                        "middle";


                    /* Total number */

                    ctx.font =
                        "700 26px Inter, sans-serif";

                    ctx.fillStyle =
                        "#f4f7ff";

                    ctx.fillText(
                        totalStocks.toLocaleString(),
                        cx,
                        cy - 10
                    );


                    /* Label */

                    ctx.font =
                        "500 11px Inter, sans-serif";

                    ctx.fillStyle =
                        "#6682b5";

                    ctx.fillText(
                        "Total Stocks",
                        cx,
                        cy + 14
                    );


                    ctx.restore();

                }

            };

        }


        /* =============================================
           CREATE DONUT
        ============================================= */

        breadthChart = new Chart(
            breadthCanvas,
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Gainers",
                        "Losers",
                        "Unchanged"
                    ],

                    datasets: [

                        {

                            data: [
                                gainers,
                                losers,
                                unchanged
                            ],

                            backgroundColor: [
                                "#20d36b",
                                "#ff4f55",
                                "#7189b0"
                            ],

                            hoverBackgroundColor: [
                                "#2ee87e",
                                "#ff6b71",
                                "#8ba0c9"
                            ],

                            borderColor:
                                "#101a36",

                            borderWidth: 2,

                            hoverOffset: 6

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "68%",


                    animation: {

                        duration: 900,

                        easing:
                            "easeInOutSine"

                    },


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            backgroundColor:
                                "#111b36",

                            borderColor:
                                "rgba(255,255,255,0.10)",

                            borderWidth: 1,

                            padding: 10,

                            cornerRadius: 8,

                            displayColors: true

                        }

                    }

                },


                plugins: [

                    centerTextPlugin(),

                    makeDataStatusPlugin(
                        "breadthData"
                    )

                ]

            }
        );


        /* =============================================
           UPDATE HTML BREADTH NUMBERS
        ============================================= */

        const mainNumberEl =
            document.querySelector(
                ".breadth-main-number strong"
            );


        if (mainNumberEl) {

            mainNumberEl.textContent =
                gainers.toLocaleString();

        }


        const gainText =
            document.querySelector(
                ".gain-text"
            );


        if (gainText) {

            gainText.textContent =
                gainers.toLocaleString();

        }


        const lossText =
            document.querySelector(
                ".loss-text"
            );


        if (lossText) {

            lossText.textContent =
                losers.toLocaleString();

        }


        const unchangedText =
            document.querySelector(
                ".unchanged-text"
            );


        if (unchangedText) {

            unchangedText.textContent =
                unchanged.toLocaleString();

        }


        /* =============================================
           UPDATE BREADTH DESCRIPTION
        ============================================= */

        const breadthMainText =
            document.querySelector(
                ".breadth-main-number span"
            );


        if (breadthMainText) {

            breadthMainText.textContent =
                "stocks advancing";

        }

    }


    /* =====================================================
       DAILY TURNOVER CHART
    ===================================================== */

    function createTurnoverChart(data) {

        const turnoverCanvas =
            document.getElementById(
                "turnoverChart"
            );


        if (!turnoverCanvas) {
            return;
        }


        const turnoverCtx =
            turnoverCanvas.getContext("2d");


        /* =============================================
           DESTROY OLD CHART
        ============================================= */

        if (turnoverChart) {

            turnoverChart.destroy();

        }


        /* =============================================
           GRADIENT
        ============================================= */

        const turnoverGradient =
            turnoverCtx.createLinearGradient(
                0,
                0,
                0,
                220
            );


        turnoverGradient.addColorStop(
            0,
            "#12c9bc"
        );

        turnoverGradient.addColorStop(
            1,
            "#0a6d67"
        );


        /* =============================================
           REAL DATABASE DATA
        ============================================= */

        const turnoverLabels =
            data.turnover_labels || [];


        const turnoverData =
            data.turnover_data || [];


        /* =============================================
           CREATE CHART
        ============================================= */

        turnoverChart = new Chart(
            turnoverCanvas,
            {

                type: "bar",

                data: {

                    labels:
                        turnoverLabels,

                    datasets: [

                        {

                            label:
                                "Turnover",

                            data:
                                turnoverData,

                            backgroundColor:
                                turnoverGradient,

                            hoverBackgroundColor:
                                "#17e0d1",

                            borderRadius: 4,

                            borderSkipped: false

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    animation: {

                        duration: 1300,

                        easing:
                            "easeOutQuart",

                        delay: function (ctx) {

                            return ctx.type === "data"
                                ? ctx.dataIndex * 25
                                : 0;

                        }

                    },


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            backgroundColor:
                                "#111b36",

                            borderColor:
                                "rgba(255,255,255,0.10)",

                            borderWidth: 1,

                            padding: 10,

                            cornerRadius: 8,

                            displayColors: false,


                            callbacks: {

                                label: function (
                                    context
                                ) {

                                    return (
                                        " NPR " +
                                        Number(
                                            context.raw || 0
                                        ).toFixed(2) +
                                        "B"
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
                                    "#6682b5",

                                maxRotation: 0,

                                autoSkip: false,

                                font: {

                                    size: 10

                                }

                            }

                        },


                        y: {

                            beginAtZero: true,


                            grid: {

                                color:
                                    "rgba(120,145,190,0.08)"

                            },


                            ticks: {

                                color:
                                    "#6682b5",


                                callback: function (
                                    value
                                ) {

                                    return value + "B";

                                }

                            }

                        }

                    }

                },


                plugins: [

                    makeDataStatusPlugin(
                        "turnoverData"
                    )

                ]

            }
        );

    }


    /* =====================================================
       SECTOR PERFORMANCE — RANKED BAR LIST
       Replaces the Chart.js bars with a diverging,
       center-anchored bar list ranked best-to-worst
    ===================================================== */

    function createSectorChart(data) {

        const sectorCanvas =
            document.getElementById(
                "sectorPerformanceChart"
            );

        if (!sectorCanvas) {
            return;
        }

        const wrapper =
            sectorCanvas.parentElement;

        if (!wrapper) {
            return;
        }

        const sectorPerformance =
            data.sector_performance;

        if (
            !sectorPerformance ||
            !Array.isArray(sectorPerformance) ||
            sectorPerformance.length === 0
        ) {

            showSectorUnavailable(
                sectorCanvas
            );

            return;
        }

        /* Hide the canvas — we render an HTML list instead */

        sectorCanvas.style.display =
            "none";

        /* Remove any prior unavailable-message or list before re-rendering */

        const existingMessage =
            wrapper.querySelector(
                ".sector-data-message"
            );

        if (existingMessage) {
            existingMessage.remove();
        }

        const existingList =
            wrapper.querySelector(
                ".sector-rank-list"
            );

        if (existingList) {
            existingList.remove();
        }

        /* Sort best to worst by performance */

        const sorted =
            [...sectorPerformance].sort(
                function (a, b) {

                    return (
                        Number(b.performance) -
                        Number(a.performance)
                    );

                }
            );

        const maxAbs =
            Math.max(
                ...sorted.map(
                    function (item) {

                        return Math.abs(
                            Number(item.performance)
                        );

                    }
                ),
                1
            );

        const list =
            document.createElement("div");

        list.className =
            "sector-rank-list";

        sorted.forEach(function (item) {

            const value =
                Number(item.performance);

            const isPositive =
                value >= 0;

            const widthPercent =
                (
                    Math.abs(value) /
                    maxAbs
                ) * 50; // half-track max

            const row =
                document.createElement("div");

            row.className =
                "sector-rank-row";

            row.innerHTML =
                '<span class="sector-rank-name">' +
                item.sector +
                '</span>' +
                '<div class="sector-rank-track">' +
                '<div class="sector-rank-fill ' +
                (isPositive ? "positive" : "negative") +
                '"></div>' +
                '</div>' +
                '<span class="sector-rank-value ' +
                (isPositive ? "positive" : "negative") +
                '">' +
                (isPositive ? "+" : "") +
                value.toFixed(2) +
                '%</span>';

            list.appendChild(row);

            /* Animate the fill width in after insertion */

            requestAnimationFrame(function () {

                const fillEl =
                    row.querySelector(
                        ".sector-rank-fill"
                    );

                if (fillEl) {

                    requestAnimationFrame(function () {

                        fillEl.style.width =
                            widthPercent + "%";

                    });

                }

            });

        });

        wrapper.appendChild(list);

    }


    /* =====================================================
       SECTOR DATA UNAVAILABLE MESSAGE
    ===================================================== */

    function showSectorUnavailable(canvas) {

        const wrapper =
            canvas.parentElement;


        if (!wrapper) {
            return;
        }


        canvas.style.display =
            "none";


        let message =
            wrapper.querySelector(
                ".sector-data-message"
            );


        if (!message) {

            message =
                document.createElement(
                    "div"
                );

            message.className =
                "sector-data-message";

            message.textContent =
                "Sector performance data is not available yet.";

            message.style.display =
                "flex";

            message.style.alignItems =
                "center";

            message.style.justifyContent =
                "center";

            message.style.height =
                "100%";

            message.style.minHeight =
                "220px";

            message.style.color =
                "#6682b5";

            message.style.fontSize =
                "13px";

            wrapper.appendChild(
                message
            );

        }

    }


    /* =====================================================
       MARKET ERROR MESSAGE
    ===================================================== */

    function showMarketError(message) {

        console.error(
            message
        );


        const content =
            document.querySelector(
                ".dashboard-content"
            );


        if (!content) {
            return;
        }


        let errorBox =
            document.querySelector(
                ".market-data-error"
            );


        if (!errorBox) {

            errorBox =
                document.createElement(
                    "div"
                );

            errorBox.className =
                "market-data-error";

            errorBox.style.padding =
                "12px 16px";

            errorBox.style.marginBottom =
                "20px";

            errorBox.style.borderRadius =
                "8px";

            errorBox.style.background =
                "rgba(255,79,85,0.10)";

            errorBox.style.border =
                "1px solid rgba(255,79,85,0.25)";

            errorBox.style.color =
                "#ff6b71";

            content.prepend(
                errorBox
            );

        }


        errorBox.textContent =
            message;

    }

});