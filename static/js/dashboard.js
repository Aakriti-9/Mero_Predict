// =========================================================
// MERO-PREDICT
// Dashboard — Database Connected Edition
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

// =====================================================
// ELEMENTS
// =====================================================

const canvas = document.getElementById("nepseChart");

if (!canvas) {
    console.error("Dashboard chart canvas not found.");
    return;
}

if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded.");
    return;
}


const pageDate =
    document.getElementById("dashboardDate");

const marketStatus =
    document.getElementById("marketStatus");

const marketActivity =
    document.getElementById("marketActivity");

const marketActivityDetails =
    document.getElementById("marketActivityDetails");

const marketSentiment =
    document.getElementById("marketSentiment");

const sentimentDetails =
    document.getElementById("sentimentDetails");

const totalGainers =
    document.getElementById("totalGainers");

const unchangedStocks =
    document.getElementById("unchangedStocks");

const totalLosers =
    document.getElementById("totalLosers");

const listedStocks =
    document.getElementById("listedStocks");

const totalTurnover =
    document.getElementById("totalTurnover");

const marketCap =
    document.getElementById("marketCap");

const totalVolume =
    document.getElementById("totalVolume");

const gainersTable =
    document.getElementById("topGainersTable");

const losersTable =
    document.getElementById("topLosersTable");

const ctx =
    canvas.getContext("2d");


// =====================================================
// CHART SETTINGS
// =====================================================

const MAX_POINTS = 20;

let baselineValue = 0;

let pulsePhase = 0;


// =====================================================
// GRADIENT
// =====================================================

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


// =====================================================
// BASELINE PLUGIN
// =====================================================

const baselinePlugin = {

    id: "baselineLine",

    afterDatasetsDraw(chart) {

        if (!baselineValue) {
            return;
        }

        const {
            ctx,
            chartArea,
            scales
        } = chart;

        const y =
            scales.y.getPixelForValue(
                baselineValue
            );

        if (
            y < chartArea.top ||
            y > chartArea.bottom
        ) {
            return;
        }

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


// =====================================================
// CROSSHAIR PLUGIN
// =====================================================

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

        // Vertical line

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


        // Horizontal line

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


// =====================================================
// LAST POINT PLUGIN
// =====================================================

const livePricePlugin = {

    id: "livePrice",

    afterDatasetsDraw(chart) {

        const meta =
            chart.getDatasetMeta(0);

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
        } = lastPoint.getProps(
            ["x", "y"],
            true
        );

        const {
            chartArea
        } = chart;

        const chartContext =
            chart.ctx;

        const dataset =
            chart.data.datasets[0];

        const currentValue =
            dataset.data[
                dataset.data.length - 1
            ];

        if (
            currentValue === undefined ||
            currentValue === null
        ) {
            return;
        }

        chartContext.save();


        // -------------------------------------------------
        // Pulsing glow
        // -------------------------------------------------

        const pulseRadius =
            4 +
            Math.sin(pulsePhase) * 3;

        chartContext.beginPath();

        chartContext.arc(
            x,
            y,
            pulseRadius + 6,
            0,
            Math.PI * 2
        );

        chartContext.fillStyle =
            "rgba(0, 212, 199, " +
            (
                0.22 -
                Math.sin(pulsePhase) * 0.08
            ) +
            ")";

        chartContext.fill();


        // -------------------------------------------------
        // Core point
        // -------------------------------------------------

        chartContext.beginPath();

        chartContext.arc(
            x,
            y,
            4,
            0,
            Math.PI * 2
        );

        chartContext.fillStyle =
            "#00d4c7";

        chartContext.shadowColor =
            "#00d4c7";

        chartContext.shadowBlur = 9;

        chartContext.fill();

        chartContext.shadowBlur = 0;


        // -------------------------------------------------
        // Connector
        // -------------------------------------------------

        chartContext.beginPath();

        chartContext.setLineDash([
            2,
            3
        ]);

        chartContext.moveTo(
            x,
            y
        );

        chartContext.lineTo(
            chartArea.right,
            y
        );

        chartContext.strokeStyle =
            "rgba(0, 212, 199, 0.4)";

        chartContext.lineWidth = 1;

        chartContext.stroke();

        chartContext.setLineDash([]);


        // -------------------------------------------------
        // Value label
        // -------------------------------------------------

        const label =
            Number(currentValue)
                .toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


        chartContext.font =
            "600 11px Inter, sans-serif";


        const textWidth =
            chartContext.measureText(
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


        chartContext.beginPath();

        chartContext.roundRect(
            boxX,
            boxY,
            boxWidth,
            boxHeight,
            5
        );

        chartContext.fillStyle =
            "#00d4c7";

        chartContext.fill();


        chartContext.fillStyle =
            "#062420";

        chartContext.textBaseline =
            "middle";


        chartContext.fillText(
            label,
            boxX + boxPadding,
            boxY +
            boxHeight / 2 +
            0.5
        );


        chartContext.restore();
    }
};


// =====================================================
// CREATE CHART
// =====================================================

const chart =
    new Chart(ctx, {

        type: "line",

        data: {

            labels: [],

            datasets: [

                {

                    label:
                        "Daily Market Turnover",

                    data: [],

                    borderColor:
                        "#00d4c7",

                    borderWidth: 3,

                    backgroundColor:
                        buildGradient(),

                    fill: true,

                    tension: 0.4,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    pointHoverBackgroundColor:
                        "#00d4c7",

                    pointHoverBorderColor:
                        "#ffffff",

                    pointHoverBorderWidth: 2

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,


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

                    displayColors: false,


                    callbacks: {

                        title: (items) => {

                            if (
                                !items ||
                                !items.length
                            ) {
                                return "";
                            }

                            return items[0]
                                .label;
                        },


                        label: (context) => {

                            return (
                                " Turnover  " +
                                Number(
                                    context.parsed.y
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                ) +
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

                        maxTicksLimit: 7,

                        padding: 8

                    }

                },


                y: {

                    display: true,

                    position: "right",

                    grid: {

                        color:
                            "rgba(130, 150, 200, 0.08)",

                        drawBorder: false

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

                        callback: (value) => {

                            return (
                                Number(value)
                                    .toLocaleString(
                                        "en-IN"
                                    ) +
                                "B"
                            );

                        }

                    }

                }

            },


            animation: {

                duration: 1800,

                easing:
                    "easeInOutSine"

            }

        },


        plugins: [

            baselinePlugin,

            crosshairPlugin,

            livePricePlugin

        ]

    });


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard(data) {

    // -------------------------------------------------
    // Date
    // -------------------------------------------------

    if (pageDate) {

        pageDate.textContent =
            `${data.latest_date} · NEPSE Trading Hours: 11:00–15:00 NST`;

    }


    // -------------------------------------------------
    // Market status
    // -------------------------------------------------

    if (marketStatus) {

        marketStatus.innerHTML =
            `
            <span class="market-dot"></span>
            Historical Data
            `;

    }


    // -------------------------------------------------
    // Market Activity
    // -------------------------------------------------

    if (marketActivity) {

        marketActivity.textContent =
            Number(
                data.total_stocks || 0
            ).toLocaleString(
                "en-IN"
            );

    }


    if (marketActivityDetails) {

        marketActivityDetails.textContent =
            "stocks traded today";

    }


    // -------------------------------------------------
    // Market Sentiment
    // -------------------------------------------------

    const sentiment =
        getMarketSentiment(
            Number(data.gainers || 0),
            Number(data.losers || 0)
        );


    if (marketSentiment) {

        marketSentiment.textContent =
            sentiment;

    }


    if (sentimentDetails) {

        sentimentDetails.textContent =
            `${data.gainers} gainers vs ${data.losers} losers`;

    }


    // -------------------------------------------------
    // Total Gainers
    // -------------------------------------------------

    if (totalGainers) {

        totalGainers.textContent =
            Number(
                data.gainers || 0
            ).toLocaleString(
                "en-IN"
            );

    }


    if (unchangedStocks) {

        unchangedStocks.textContent =
            `${Number(data.unchanged || 0).toLocaleString("en-IN")} unchanged`;

    }


    // -------------------------------------------------
    // Total Losers
    // -------------------------------------------------

    if (totalLosers) {

        totalLosers.textContent =
            Number(
                data.losers || 0
            ).toLocaleString(
                "en-IN"
            );

    }


    if (listedStocks) {

    listedStocks.textContent =
        `${Number(data.total_companies || 0).toLocaleString("en-IN")} companies tracked`;

    }


    // -------------------------------------------------
    // Total Turnover
    // -------------------------------------------------

    if (totalTurnover) {

        totalTurnover.textContent =
            `NPR ${Number(
                data.total_turnover || 0
            ).toFixed(2)}B`;

    }


    // -------------------------------------------------
    // Market Cap
    // -------------------------------------------------

    if (marketCap) {

        if (
            data.market_cap === null ||
            data.market_cap === undefined
        ) {

            marketCap.textContent =
                "N/A";

        } else {

            marketCap.textContent =
                `NPR ${Number(
                    data.market_cap
                ).toLocaleString(
                    "en-IN"
                )}B`;

        }

    }


    // -------------------------------------------------
    // Total Volume
    // -------------------------------------------------

    if (totalVolume) {

        totalVolume.textContent =
            Number(
                data.total_volume || 0
            ).toLocaleString(
                "en-IN"
            );

    }

}


// =====================================================
// MARKET SENTIMENT
// =====================================================

function getMarketSentiment(
    gainers,
    losers
) {

    if (
        gainers > losers
    ) {

        return "BULLISH";

    }


    if (
        losers > gainers
    ) {

        return "BEARISH";

    }


    return "NEUTRAL";

}


// =====================================================
// UPDATE MARKET TABLES
// =====================================================

function updateMarketTables(data) {

    // -------------------------------------------------
    // Gainers
    // -------------------------------------------------

    if (gainersTable) {

        gainersTable.innerHTML = "";

        const gainers =
            Array.isArray(
                data.top_gainers
            )
                ? data.top_gainers
                : [];


        gainers.forEach(
            stock => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML =
                    `
                    <td>
                        <strong>
                            ${stock.symbol}
                        </strong>

                        <small>
                            NEPSE
                        </small>
                    </td>

                    <td>
                        ${formatPrice(stock.price)}
                    </td>

                    <td>
                        <span class="gain-badge">
                            ▲ ${formatPercentage(stock.change)}
                        </span>
                    </td>

                    <td>
                        ${formatNumber(stock.volume)}
                    </td>
                    `;


                gainersTable.appendChild(
                    row
                );

            }
        );


        if (!gainers.length) {

            gainersTable.innerHTML =
                `
                <tr>
                    <td colspan="4"
                        style="text-align:center;">
                        No gainers available
                    </td>
                </tr>
                `;

        }

    }


    // -------------------------------------------------
    // Losers
    // -------------------------------------------------

    if (losersTable) {

        losersTable.innerHTML = "";

        const losers =
            Array.isArray(
                data.top_losers
            )
                ? data.top_losers
                : [];


        losers.forEach(
            stock => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML =
                    `
                    <td>
                        <strong>
                            ${stock.symbol}
                        </strong>

                        <small>
                            NEPSE
                        </small>
                    </td>

                    <td>
                        ${formatPrice(stock.price)}
                    </td>

                    <td>
                        <span class="loss-badge">
                            ▼ ${formatPercentage(stock.change)}
                        </span>
                    </td>

                    <td>
                        ${formatNumber(stock.volume)}
                    </td>
                    `;


                losersTable.appendChild(
                    row
                );

            }
        );


        if (!losers.length) {

            losersTable.innerHTML =
                `
                <tr>
                    <td colspan="4"
                        style="text-align:center;">
                        No losers available
                    </td>
                </tr>
                `;

        }

    }

}


// =====================================================
// FORMAT HELPERS
// =====================================================

function formatPrice(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatPercentage(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0.00%";
    }

    return (
        Math.abs(number)
            .toFixed(2) +
        "%"
    );

}


function formatNumber(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString(
        "en-IN"
    );

}


// =====================================================
// UPDATE TURNOVER CHART
// =====================================================

function updateChart(data) {

    if (
        !Array.isArray(
            data.turnover_labels
        ) ||
        !Array.isArray(
            data.turnover_data
        )
    ) {

        console.error(
            "Invalid turnover chart data."
        );

        return;
    }


    // Pair labels and values first
    // so they can never become misaligned.

    const pairs =
        data.turnover_labels
            .map(
                (label, index) => {

                    const value =
                        Number(
                            data.turnover_data[
                                index
                            ]
                        );

                    return {
                        label,
                        value
                    };

                }
            )
            .filter(
                item =>
                    Number.isFinite(
                        item.value
                    )
            );


    if (!pairs.length) {

        console.error(
            "No valid turnover values."
        );

        return;
    }


    const recentPairs =
        pairs.slice(
            -MAX_POINTS
        );


    const labels =
        recentPairs.map(
            item =>
                item.label
        );


    const values =
        recentPairs.map(
            item =>
                item.value
        );


    baselineValue =
        values[0];


    chart.data.labels =
        labels;


    chart.data.datasets[0].data =
        values;


    chart.data.datasets[0]
        .backgroundColor =
        buildGradient();


    chart.update();


    console.log(
        "Dashboard chart updated:",
        labels,
        values
    );

}


// =====================================================
// LOAD DASHBOARD DATA
// =====================================================

async function loadDashboardData() {

    try {

        const response =
            await fetch(
                "/api/dashboard",
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Dashboard API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (data.error) {

            throw new Error(
                data.error
            );

        }


        console.log(
            "Dashboard API data:",
            data
        );


        // Update dashboard

        updateDashboard(
            data
        );


        // Update tables

        updateMarketTables(
            data
        );


        // Update chart

        updateChart(
            data
        );


    } catch (error) {

        console.error(
            "Dashboard data loading failed:",
            error
        );

    }

}


// =====================================================
// LOAD DATABASE DATA
// =====================================================

loadDashboardData();


// =====================================================
// PULSE ANIMATION
// =====================================================

function animatePulse() {

    pulsePhase += 0.07;

    chart.draw();

    requestAnimationFrame(
        animatePulse
    );

}


requestAnimationFrame(
    animatePulse
);

});
