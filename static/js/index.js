// =========================================================
// MERO-PREDICT
// Landing Page — Database Connected Edition
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const canvas =
        document.getElementById("nepseChart");


    /* =====================================================
       CHECK CHART.JS
    ===================================================== */

    if (!canvas) {

        console.error(
            "Market chart canvas not found."
        );

    } else if (
        typeof Chart === "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

    }


    /* =====================================================
       LOAD LANDING PAGE MARKET DATA
    ===================================================== */

    loadLandingMarketData();


    /* =====================================================
       FETCH DATA FROM FLASK
    ===================================================== */

    function loadLandingMarketData() {

        fetch("/api/landing-market")

            .then(function (response) {

                if (!response.ok) {

                    throw new Error(
                        "Failed to load landing market data."
                    );

                }

                return response.json();

            })

            .then(function (data) {

                console.log(
                    "Landing market data:",
                    data
                );


                if (data.error) {

                    throw new Error(
                        data.error
                    );

                }


                /* -----------------------------------------
                   UPDATE MARKET SUMMARY
                ----------------------------------------- */

                updateMarketSummary(data);


                /* -----------------------------------------
                   UPDATE TOP GAINERS
                ----------------------------------------- */

                updateTopGainers(
                    data.top_gainers || []
                );


                /* -----------------------------------------
                   UPDATE TOP LOSERS
                ----------------------------------------- */

                updateTopLosers(
                    data.top_losers || []
                );


                /* -----------------------------------------
                   UPDATE MINI STOCKS
                ----------------------------------------- */

                updateMiniStocks(
                    data.top_gainers || []
                );


                /* -----------------------------------------
                   UPDATE TURNOVER CHART
                ----------------------------------------- */

                if (
                    canvas &&
                    typeof Chart !== "undefined"
                ) {

                    createMarketChart(
                        data.turnover_labels || [],
                        data.turnover_data || []
                    );

                }

            })

            .catch(function (error) {

                console.error(
                    "Landing page market error:",
                    error
                );

            });

    }


    /* =====================================================
       UPDATE MARKET SUMMARY
    ===================================================== */

    function updateMarketSummary(data) {


        /* =================================================
           MARKET TURNOVER
        ================================================= */

        const summaryTurnover =
            document.getElementById(
                "summaryTurnover"
            );


        if (summaryTurnover) {

            const turnover =
                Number(
                    data.total_turnover
                );


            if (Number.isFinite(turnover)) {

                summaryTurnover.textContent =
                    "NPR " +
                    turnover.toFixed(2) +
                    "B";

            } else {

                summaryTurnover.textContent =
                    "N/A";

            }

        }


        const summaryTurnoverDate =
            document.getElementById(
                "summaryTurnoverDate"
            );


        if (
            summaryTurnoverDate &&
            data.latest_date
        ) {

            summaryTurnoverDate.textContent =
                data.latest_date;

        }


        /* =================================================
           TRADED STOCKS
        ================================================= */

        const summaryStocks =
            document.getElementById(
                "summaryStocks"
            );


        if (summaryStocks) {

            summaryStocks.textContent =
                Number(
                    data.total_stocks || 0
                ).toLocaleString();

        }


        /* =================================================
           GAINERS
        ================================================= */

        const summaryGainers =
            document.getElementById(
                "summaryGainers"
            );


        if (summaryGainers) {

            summaryGainers.textContent =
                Number(
                    data.gainers || 0
                ).toLocaleString();

        }


        /* =================================================
           BEST GAINER TEXT
        ================================================= */

        const summaryGainerText =
            document.getElementById(
                "summaryGainerText"
            );


        if (
            summaryGainerText &&
            data.top_gainers &&
            data.top_gainers.length > 0
        ) {

            const bestGainer =
                data.top_gainers[0];


            summaryGainerText.textContent =
                "+" +
                Number(
                    bestGainer.change
                ).toFixed(2) +
                "% best";

        }


        /* =================================================
           LOSERS
        ================================================= */

        const summaryLosers =
            document.getElementById(
                "summaryLosers"
            );


        if (summaryLosers) {

            summaryLosers.textContent =
                Number(
                    data.losers || 0
                ).toLocaleString();

        }


        /* =================================================
           WORST LOSER TEXT
        ================================================= */

        const summaryLoserText =
            document.getElementById(
                "summaryLoserText"
            );


        if (
            summaryLoserText &&
            data.top_losers &&
            data.top_losers.length > 0
        ) {

            const worstLoser =
                data.top_losers[0];


            summaryLoserText.textContent =
                Number(
                    worstLoser.change
                ).toFixed(2) +
                "% worst";

        }


        /* =================================================
           HERO TURNOVER
        ================================================= */

        const heroTurnover =
            document.getElementById(
                "heroTurnover"
            );


        if (heroTurnover) {

            const turnover =
                Number(
                    data.total_turnover
                );


            if (Number.isFinite(turnover)) {

                heroTurnover.textContent =
                    "NPR " +
                    turnover.toFixed(2) +
                    "B";

            } else {

                heroTurnover.textContent =
                    "N/A";

            }

        }


        /* =================================================
           HERO DATE
        ================================================= */

        const heroTurnoverDate =
            document.getElementById(
                "heroTurnoverDate"
            );


        if (
            heroTurnoverDate &&
            data.latest_date
        ) {

            heroTurnoverDate.textContent =
                data.latest_date;

        }


        /* =================================================
           MARKET STATUS
        ================================================= */

        const marketStatus =
            document.getElementById(
                "marketStatus"
            );


        if (marketStatus) {

            marketStatus.textContent =
                "Historical Data";

        }


        /* =================================================
           MARKET DATE
        ================================================= */

        const marketDate =
            document.getElementById(
                "marketDate"
            );


        if (
            marketDate &&
            data.latest_date
        ) {

            marketDate.textContent =
                data.latest_date;

        }

    }


    /* =====================================================
       UPDATE TOP GAINERS
    ===================================================== */

    function updateTopGainers(stocks) {

        const heading =
            document.querySelector(
                ".gain-heading"
            );


        if (!heading) {

            return;

        }


        const card =
            heading.closest(
                ".stock-table-card"
            );


        if (!card) {

            return;

        }


        const tbody =
            card.querySelector(
                "tbody"
            );


        if (!tbody) {

            return;

        }


        const count =
            card.querySelector(
                ".table-count"
            );


        if (count) {

            count.textContent =
                stocks.length +
                " stocks";

        }


        tbody.innerHTML = "";


        if (stocks.length === 0) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="3">
                        No gainers available
                    </td>

                </tr>

            `;

            return;

        }


        stocks.forEach(
            function (stock) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        <strong>
                            ${escapeHtml(
                                stock.symbol
                            )}
                        </strong>

                        <small>
                            NEPSE
                        </small>

                    </td>


                    <td>

                        ${formatPrice(
                            stock.price
                        )}

                    </td>


                    <td class="positive-change">

                        ▲ +

                        ${formatPercentage(
                            stock.change
                        )}

                    </td>

                `;


                tbody.appendChild(row);

            }
        );

    }


    /* =====================================================
       UPDATE TOP LOSERS
    ===================================================== */

    function updateTopLosers(stocks) {

        const heading =
            document.querySelector(
                ".loss-heading"
            );


        if (!heading) {

            return;

        }


        const card =
            heading.closest(
                ".stock-table-card"
            );


        if (!card) {

            return;

        }


        const tbody =
            card.querySelector(
                "tbody"
            );


        if (!tbody) {

            return;

        }


        const count =
            card.querySelector(
                ".table-count"
            );


        if (count) {

            count.textContent =
                stocks.length +
                " stocks";

        }


        tbody.innerHTML = "";


        if (stocks.length === 0) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="3">
                        No losers available
                    </td>

                </tr>

            `;

            return;

        }


        stocks.forEach(
            function (stock) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        <strong>
                            ${escapeHtml(
                                stock.symbol
                            )}
                        </strong>

                        <small>
                            NEPSE
                        </small>

                    </td>


                    <td>

                        ${formatPrice(
                            stock.price
                        )}

                    </td>


                    <td class="negative-change">

                        ▼

                        ${formatPercentage(
                            stock.change
                        )}

                    </td>

                `;


                tbody.appendChild(row);

            }
        );

    }


    /* =====================================================
       UPDATE MINI STOCK CARDS
       
       Uses top 3 gainers from database.
    ===================================================== */

    function updateMiniStocks(stocks) {

        const miniStocks =
            stocks.slice(
                0,
                3
            );


        miniStocks.forEach(
            function (stock, index) {

                const number =
                    index + 1;


                const symbol =
                    document.getElementById(
                        "miniStock" +
                        number +
                        "Symbol"
                    );


                const price =
                    document.getElementById(
                        "miniStock" +
                        number +
                        "Price"
                    );


                const change =
                    document.getElementById(
                        "miniStock" +
                        number +
                        "Change"
                    );


                if (symbol) {

                    symbol.textContent =
                        stock.symbol || "---";

                }


                if (price) {

                    price.textContent =
                        formatPrice(
                            stock.price
                        );

                }


                if (change) {

                    change.textContent =
                        "+" +
                        formatPercentage(
                            stock.change
                        );

                }

            }
        );

    }


    /* =====================================================
       FORMAT PRICE
    ===================================================== */

    function formatPrice(price) {

        const value =
            Number(price);


        if (!Number.isFinite(value)) {

            return "N/A";

        }


        return value.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    /* =====================================================
       FORMAT PERCENTAGE
    ===================================================== */

    function formatPercentage(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0.00%";

        }


        return Math.abs(number).toFixed(2) +
               "%";

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(value)

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
       MARKET TURNOVER CHART
       
       REAL DATABASE DATA
       
       MySQL
          ↓
       Flask
          ↓
       /api/landing-market
          ↓
       turnover_labels
       turnover_data
          ↓
       Chart.js
    ===================================================== */

    function createMarketChart(
        chartLabels,
        chartData
    ) {

        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {

            return;

        }


        /* ---------------------------------------------
           Validate arrays
        --------------------------------------------- */

        if (
            !Array.isArray(chartLabels) ||
            !Array.isArray(chartData) ||
            chartLabels.length === 0 ||
            chartData.length === 0
        ) {

            console.error(
                "No turnover chart data available."
            );

            return;

        }


        /* ---------------------------------------------
           Keep labels and values aligned
        --------------------------------------------- */

        const length =
            Math.min(
                chartLabels.length,
                chartData.length
            );


        const labels =
            chartLabels.slice(
                0,
                length
            );


        const values =
            chartData
                .slice(
                    0,
                    length
                )
                .map(
                    function (value) {

                        return Number(value);

                    }
                )
                .filter(
                    function (value) {

                        return Number.isFinite(
                            value
                        );

                    }
                );


        if (values.length === 0) {

            console.error(
                "Turnover values are invalid."
            );

            return;

        }


        /* ---------------------------------------------
           Destroy existing chart
        --------------------------------------------- */

        if (window.meroMarketChart) {

            window.meroMarketChart.destroy();

        }


        const ctx =
            canvas.getContext(
                "2d"
            );


        /* ---------------------------------------------
           Baseline
        --------------------------------------------- */

        const baselineValue =
            values[0];


        /* ---------------------------------------------
           Gradient
        --------------------------------------------- */

        function buildGradient() {

            const gradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    canvas.height || 280
                );


            gradient.addColorStop(
                0,
                "rgba(0, 212, 199, 0.25)"
            );


            gradient.addColorStop(
                0.5,
                "rgba(0, 212, 199, 0.08)"
            );


            gradient.addColorStop(
                1,
                "rgba(0, 212, 199, 0)"
            );


            return gradient;

        }


        /* =================================================
           BASELINE PLUGIN
        ================================================= */

        const baselinePlugin = {

            id: "baselineLine",


            afterDatasetsDraw(chart) {

                const {
                    ctx,
                    chartArea,
                    scales
                } = chart;


                if (
                    !scales.y ||
                    !chartArea
                ) {

                    return;

                }


                const y =
                    scales.y.getPixelForValue(
                        baselineValue
                    );


                ctx.save();


                ctx.beginPath();

                ctx.setLineDash([
                    4,
                    4
                ]);


                ctx.moveTo(
                    chartArea.left,
                    y
                );


                ctx.lineTo(
                    chartArea.right,
                    y
                );


                ctx.strokeStyle =
                    "rgba(130, 150, 200, 0.22)";


                ctx.lineWidth = 1;

                ctx.stroke();


                ctx.restore();

            }

        };


        /* =================================================
           CROSSHAIR PLUGIN
        ================================================= */

        const crosshairPlugin = {

            id: "crosshair",


            afterDatasetsDraw(chart) {

                const active =
                    chart.getActiveElements();


                if (
                    !active ||
                    active.length === 0
                ) {

                    return;

                }


                const {
                    ctx,
                    chartArea
                } = chart;


                const point =
                    active[0].element;


                const {
                    x,
                    y
                } = point;


                ctx.save();


                /* Vertical */

                ctx.beginPath();

                ctx.setLineDash([
                    3,
                    3
                ]);


                ctx.moveTo(
                    x,
                    chartArea.top
                );


                ctx.lineTo(
                    x,
                    chartArea.bottom
                );


                ctx.strokeStyle =
                    "rgba(0, 212, 199, 0.35)";


                ctx.lineWidth = 1;

                ctx.stroke();


                /* Horizontal */

                ctx.beginPath();


                ctx.moveTo(
                    chartArea.left,
                    y
                );


                ctx.lineTo(
                    chartArea.right,
                    y
                );


                ctx.strokeStyle =
                    "rgba(0, 212, 199, 0.35)";


                ctx.lineWidth = 1;

                ctx.stroke();


                ctx.restore();

            }

        };


        /* =================================================
           LAST POINT PLUGIN
        ================================================= */

        const livePricePlugin = {

            id: "livePrice",


            afterDatasetsDraw(chart) {

                const meta =
                    chart.getDatasetMeta(
                        0
                    );


                if (
                    !meta ||
                    !meta.data ||
                    meta.data.length === 0
                ) {

                    return;

                }


                const lastPoint =
                    meta.data[
                        meta.data.length - 1
                    ];


                if (!lastPoint) {

                    return;

                }


                const {
                    x,
                    y
                } =
                    lastPoint.getProps(
                        [
                            "x",
                            "y"
                        ],
                        true
                    );


                const {
                    chartArea
                } = chart;


                const c =
                    chart.ctx;


                const currentValue =
                    chart.data.datasets[0]
                        .data[
                            chart.data.datasets[0]
                                .data.length - 1
                        ];


                c.save();


                /* -----------------------------------------
                   Glow
                ----------------------------------------- */

                c.beginPath();


                c.arc(
                    x,
                    y,
                    7,
                    0,
                    Math.PI * 2
                );


                c.fillStyle =
                    "rgba(0, 212, 199, 0.16)";


                c.fill();


                /* -----------------------------------------
                   Core
                ----------------------------------------- */

                c.beginPath();


                c.arc(
                    x,
                    y,
                    4,
                    0,
                    Math.PI * 2
                );


                c.fillStyle =
                    "#00d4c7";


                c.shadowColor =
                    "#00d4c7";


                c.shadowBlur = 9;


                c.fill();


                c.shadowBlur = 0;


                /* -----------------------------------------
                   Connector
                ----------------------------------------- */

                c.beginPath();


                c.setLineDash([
                    2,
                    3
                ]);


                c.moveTo(
                    x,
                    y
                );


                c.lineTo(
                    chartArea.right,
                    y
                );


                c.strokeStyle =
                    "rgba(0, 212, 199, 0.4)";


                c.lineWidth = 1;


                c.stroke();


                c.setLineDash([]);


                /* -----------------------------------------
                   Last turnover value
                ----------------------------------------- */

                const label =
                    Number(
                        currentValue
                    ).toFixed(2) +
                    "B";


                c.font =
                    "600 11px Inter, sans-serif";


                const textWidth =
                    c.measureText(
                        label
                    ).width;


                const boxPadding = 6;


                const boxWidth =
                    textWidth +
                    boxPadding * 2;


                const boxHeight = 20;


                const boxX =
                    chartArea.right -
                    boxWidth;


                const boxY =
                    y -
                    boxHeight / 2;


                c.beginPath();


                c.roundRect(
                    boxX,
                    boxY,
                    boxWidth,
                    boxHeight,
                    5
                );


                c.fillStyle =
                    "#00d4c7";


                c.fill();


                c.fillStyle =
                    "#062420";


                c.textBaseline =
                    "middle";


                c.fillText(
                    label,
                    boxX +
                        boxPadding,
                    boxY +
                        boxHeight / 2 +
                        0.5
                );


                c.restore();

            }

        };


        /* =================================================
           CREATE CHART
        ================================================= */

        window.meroMarketChart =
            new Chart(
                ctx,
                {

                    type: "line",


                    data: {

                        labels:
                            labels,


                        datasets: [

                            {

                                label:
                                    "Daily Market Turnover",


                                data:
                                    values,


                                borderColor:
                                    "#00d4c7",


                                borderWidth: 3,


                                backgroundColor:
                                    buildGradient(),


                                fill: true,


                                tension:
                                    0.4,


                                pointRadius:
                                    0,


                                pointHoverRadius:
                                    5,


                                pointHoverBackgroundColor:
                                    "#00d4c7",


                                pointHoverBorderColor:
                                    "#ffffff",


                                pointHoverBorderWidth:
                                    2

                            }

                        ]

                    },


                    options: {

                        responsive: true,


                        maintainAspectRatio:
                            false,


                        layout: {

                            padding: {

                                right: 55

                            }

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


                                backgroundColor:
                                    "rgba(10, 20, 48, 0.95)",


                                titleColor:
                                    "#ffffff",


                                bodyColor:
                                    "#aab9e2",


                                borderColor:
                                    "rgba(0, 212, 199, 0.35)",


                                borderWidth: 1,


                                padding: 12,


                                cornerRadius: 10,


                                displayColors:
                                    false,


                                callbacks: {

                                    title:
                                        function (
                                            items
                                        ) {

                                            return items[0]
                                                .label;

                                        },


                                    label:
                                        function (
                                            context
                                        ) {

                                            return (
                                                " Turnover  " +
                                                Number(
                                                    context.parsed.y
                                                ).toFixed(2) +
                                                "B"
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            x: {

                                display: true,


                                grid: {

                                    display: false

                                },


                                border: {

                                    display: false

                                },


                                ticks: {

                                    color:
                                        "#6079ad",


                                    font: {

                                        size: 11

                                    },


                                    maxTicksLimit:
                                        7,


                                    padding: 8

                                }

                            },


                            y: {

                                display: true,


                                position: "right",


                                grid: {

                                    color:
                                        "rgba(130, 150, 200, 0.08)",


                                    drawBorder:
                                        false

                                },


                                border: {

                                    display: false

                                },


                                ticks: {

                                    color:
                                        "#6079ad",


                                    font: {

                                        size: 11

                                    },


                                    padding: 8,


                                    callback:
                                        function (
                                            value
                                        ) {

                                            return (
                                                Number(
                                                    value
                                                ).toFixed(1) +
                                                "B"
                                            );

                                        }

                                }

                            }

                        },


                        animation: {

                            duration:
                                1200,


                            easing:
                                "easeInOutSine"

                        }

                    },


                    plugins: [

                        baselinePlugin,

                        crosshairPlugin,

                        livePricePlugin

                    ]

                }

            );

    }

});

