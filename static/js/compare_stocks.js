/* =========================================================
   MEROPREDICT
   COMPARE STOCKS
   ========================================================= */


/* =========================================================
   MOCK STOCK DATA
   ========================================================= */

const availableStocks = [

    {
        symbol: "NABIL",
        name: "Nabil Bank Limited",
        sector: "Banking",
        change: 2.19,
        price: 582.50,
        eps: 32.45,
        pe: 17.95,
        revenue: "NPR 18.4B",
        profit: "NPR 5.2B",
        marketCap: "NPR 158.6B",
        prediction: "UP"
    },

    {
        symbol: "GBIME",
        name: "Global IME Bank Limited",
        sector: "Banking",
        change: 2.17,
        price: 245.00,
        eps: 18.22,
        pe: 13.45,
        revenue: "NPR 20.1B",
        profit: "NPR 4.1B",
        marketCap: "NPR 176.3B",
        prediction: "UP"
    },

    {
        symbol: "UPPER",
        name: "Upper Tamakoshi Hydropower Limited",
        sector: "Hydropower",
        change: 4.14,
        price: 218.70,
        eps: 14.83,
        pe: 14.75,
        revenue: "NPR 9.8B",
        profit: "NPR 3.4B",
        marketCap: "NPR 46.2B",
        prediction: "UP"
    },

    {
        symbol: "HIDCL",
        name: "Hydroelectricity Investment and Development Company",
        sector: "Hydropower",
        change: 2.69,
        price: 164.30,
        eps: 10.15,
        pe: 16.19,
        revenue: "NPR 6.7B",
        profit: "NPR 2.1B",
        marketCap: "NPR 33.8B",
        prediction: "UP"
    },

    {
        symbol: "BOKL",
        name: "Bank of Kathmandu Limited",
        sector: "Banking",
        change: -1.23,
        price: 201.50,
        eps: 15.40,
        pe: 13.08,
        revenue: "NPR 14.2B",
        profit: "NPR 3.2B",
        marketCap: "NPR 38.5B",
        prediction: "DOWN"
    },

    {
        symbol: "SICL",
        name: "Shikhar Insurance Company Limited",
        sector: "Insurance",
        change: 2.00,
        price: 765.00,
        eps: 41.25,
        pe: 18.55,
        revenue: "NPR 7.2B",
        profit: "NPR 1.8B",
        marketCap: "NPR 40.7B",
        prediction: "UP"
    },

    {
        symbol: "PRFL",
        name: "Prabhu Finance Limited",
        sector: "Finance",
        change: -1.89,
        price: 312.00,
        eps: 21.20,
        pe: 14.72,
        revenue: "NPR 4.6B",
        profit: "NPR 1.2B",
        marketCap: "NPR 19.5B",
        prediction: "DOWN"
    },

    {
        symbol: "SHIVM",
        name: "Shivam Cement Limited",
        sector: "Manufacturing",
        change: -1.54,
        price: 512.00,
        eps: 27.30,
        pe: 18.75,
        revenue: "NPR 8.9B",
        profit: "NPR 1.5B",
        marketCap: "NPR 28.2B",
        prediction: "DOWN"
    },

    {
        symbol: "EBL",
        name: "Everest Bank Limited",
        sector: "Banking",
        change: 1.49,
        price: 615.00,
        eps: 38.90,
        pe: 15.81,
        revenue: "NPR 17.5B",
        profit: "NPR 4.7B",
        marketCap: "NPR 72.8B",
        prediction: "UP"
    },

    {
        symbol: "SHL",
        name: "Soaltee Hotel Limited",
        sector: "Hotels",
        change: 1.27,
        price: 478.00,
        eps: 19.80,
        pe: 24.14,
        revenue: "NPR 5.1B",
        profit: "NPR 0.9B",
        marketCap: "NPR 32.1B",
        prediction: "UP"
    }

];


/* =========================================================
   COLOR SLOTS
   ========================================================= */

const stockColors = [
    "#14b8a6",
    "#6366f1",
    "#f59e0b",
    "#ec4899"
];


/* =========================================================
   STATE
   ========================================================= */

let selectedStocks = [];

let highlightedSymbol = null;


/* =========================================================
   DOM
   ========================================================= */

const selectedStocksContainer =
    document.getElementById("selectedStocks");

const addStockBtn =
    document.getElementById("addStockBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const stockDropdown =
    document.getElementById("stockDropdown");

const stockSearch =
    document.getElementById("stockSearch");

const stockList =
    document.getElementById("stockList");

const emptyState =
    document.getElementById("emptyState");

const comparisonContainer =
    document.getElementById("comparisonContainer");

const performanceChart =
    document.getElementById("performanceChart");

const chartTooltip =
    document.getElementById("chartTooltip");

const performanceLegend =
    document.getElementById("performanceLegend");

const priceChart =
    document.getElementById("priceChart");

const fundamentalHeader =
    document.getElementById("fundamentalHeader");

const fundamentalBody =
    document.getElementById("fundamentalBody");


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    renderStockList();

    updatePage();

    addStockBtn.addEventListener(
        "click",
        toggleStockDropdown
    );

    emptyAddBtn.addEventListener(
        "click",
        openStockDropdown
    );

    stockSearch.addEventListener(
        "input",
        renderStockList
    );

    document.addEventListener(
        "click",
        handleOutsideClick
    );

});


/* =========================================================
   DROPDOWN
   ========================================================= */

function toggleStockDropdown(event) {

    event.stopPropagation();

    if (selectedStocks.length >= 4) {
        return;
    }

    if (
        stockDropdown.classList.contains("show")
    ) {

        stockDropdown.classList.remove("show");

        return;
    }

    openStockDropdown();

}


function openStockDropdown() {

    if (selectedStocks.length >= 4) {
        return;
    }

    stockDropdown.classList.add("show");

    stockSearch.value = "";

    renderStockList();

    setTimeout(() => {
        stockSearch.focus();
    }, 50);

}


function handleOutsideClick(event) {

    if (
        !stockDropdown.contains(event.target) &&
        !addStockBtn.contains(event.target) &&
        !emptyAddBtn.contains(event.target)
    ) {

        stockDropdown.classList.remove("show");

    }

}


/* =========================================================
   RENDER STOCK LIST
   ========================================================= */

function renderStockList() {

    const searchValue =
        stockSearch.value
            .trim()
            .toLowerCase();


    const filteredStocks =
        availableStocks.filter(stock => {

            const alreadySelected =
                selectedStocks.some(
                    selected =>
                        selected.symbol === stock.symbol
                );

            if (alreadySelected) {
                return false;
            }

            return (
                stock.symbol
                    .toLowerCase()
                    .includes(searchValue) ||

                stock.name
                    .toLowerCase()
                    .includes(searchValue)
            );

        });


    stockList.innerHTML = "";


    if (filteredStocks.length === 0) {

        stockList.innerHTML = `
            <div class="no-results">
                No companies found
            </div>
        `;

        return;
    }


    filteredStocks.forEach(stock => {

        const option =
            document.createElement("button");

        option.type = "button";

        option.className =
            "stock-option";


        option.innerHTML = `

            <div class="stock-option-info">

                <span class="stock-option-symbol">
                    ${stock.symbol}
                </span>

                <span class="stock-option-name">
                    ${stock.name}
                </span>

            </div>

            <span class="
                stock-option-change
                ${stock.change >= 0
                    ? "positive"
                    : "negative"}
            ">
                ${formatChange(stock.change)}
            </span>

        `;


        option.addEventListener(
            "click",
            () => addStock(stock)
        );


        stockList.appendChild(option);

    });

}


/* =========================================================
   FIND FIRST FREE COLOR
   ========================================================= */

function getFirstFreeColor() {

    return stockColors.find(
        color =>
            !selectedStocks.some(
                stock => stock.color === color
            )
    );

}


/* =========================================================
   ADD STOCK
   ========================================================= */

function addStock(stock) {

    if (selectedStocks.length >= 4) {
        return;
    }


    if (
        selectedStocks.some(
            selected =>
                selected.symbol === stock.symbol
        )
    ) {
        return;
    }


    const color =
        getFirstFreeColor();


    if (!color) {
        return;
    }


    selectedStocks.push({
        ...stock,
        color: color
    });


    stockDropdown.classList.remove("show");

    stockSearch.value = "";

    highlightedSymbol = null;

    updatePage();

}


/* =========================================================
   REMOVE STOCK
   ========================================================= */

function removeStock(symbol) {

    /*
     * IMPORTANT:
     *
     * Do NOT reassign colors here.
     *
     * This means:
     *
     * NABIL  = teal
     * UPPER  = indigo
     * GBIME  = amber
     *
     * Remove NABIL:
     *
     * UPPER  = indigo
     * GBIME  = amber
     *
     * Add another stock:
     *
     * new stock = teal
     */

    selectedStocks =
        selectedStocks.filter(
            stock =>
                stock.symbol !== symbol
        );


    if (highlightedSymbol === symbol) {

        highlightedSymbol = null;

    }


    updatePage();

}


/* =========================================================
   UPDATE PAGE
   ========================================================= */

function updatePage() {

    renderSelectedStocks();

    updateEmptyState();

    updateAddButton();


    if (selectedStocks.length > 0) {

        renderPerformanceChart();

        renderLegend();

        renderPriceChart();

        renderFundamentalTable();

    }

}


/* =========================================================
   SELECTED STOCK CHIPS
   ========================================================= */

function renderSelectedStocks() {

    selectedStocksContainer.innerHTML = "";


    selectedStocks.forEach(stock => {

        const chip =
            document.createElement("div");

        chip.className =
            "stock-chip";


        chip.innerHTML = `

            <span
                class="stock-chip-dot"
                style="background:${stock.color}"
            ></span>

            <span class="stock-chip-symbol">
                ${stock.symbol}
            </span>

            <span class="stock-chip-sector">
                ${stock.sector}
            </span>

            <button
                type="button"
                class="remove-stock-btn"
                aria-label="Remove ${stock.symbol}"
            >
                ×
            </button>

        `;


        chip.querySelector(
            ".remove-stock-btn"
        ).addEventListener(
            "click",
            () => removeStock(stock.symbol)
        );


        selectedStocksContainer.appendChild(chip);

    });

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function updateEmptyState() {

    if (selectedStocks.length === 0) {

        emptyState.style.display =
            "block";

        comparisonContainer.classList
            .remove("visible");

    } else {

        emptyState.style.display =
            "none";

        comparisonContainer.classList
            .add("visible");

    }

}


/* =========================================================
   ADD BUTTON
   ========================================================= */

function updateAddButton() {

    if (selectedStocks.length >= 4) {

        addStockBtn.disabled = true;

        addStockBtn.innerHTML = `
            <span>✓</span>
            <span>Max 4 stocks</span>
        `;

    } else {

        addStockBtn.disabled = false;

        addStockBtn.innerHTML = `
            <span>+</span>
            <span>Add Stock</span>
        `;

    }

}


/* =========================================================
   RELATIVE PERFORMANCE CHART
   ========================================================= */

function renderPerformanceChart() {

    const width = 1000;
    const height = 430;

    const left = 70;
    const right = 25;
    const top = 25;
    const bottom = 55;

    const chartWidth =
        width - left - right;

    const chartHeight =
        height - top - bottom;


    const chartData =
        selectedStocks.map(
            (stock, stockIndex) => {

                return {

                    stock: stock,

                    values:
                        generatePerformanceData(
                            stock,
                            stockIndex,
                            61
                        )

                };

            }
        );


    let minValue = Infinity;
    let maxValue = -Infinity;


    chartData.forEach(series => {

        series.values.forEach(value => {

            minValue =
                Math.min(
                    minValue,
                    value
                );

            maxValue =
                Math.max(
                    maxValue,
                    value
                );

        });

    });


    const range =
        Math.max(
            maxValue - minValue,
            10
        );


    minValue -= range * 0.12;
    maxValue += range * 0.12;


    const step =
        calculateNiceStep(
            minValue,
            maxValue,
            5
        );


    const yMin =
        Math.floor(
            minValue / step
        ) * step;


    const yMax =
        Math.ceil(
            maxValue / step
        ) * step;


    const yTicks = [];


    for (
        let value = yMin;
        value <= yMax + 0.001;
        value += step
    ) {

        yTicks.push(
            Number(
                value.toFixed(2)
            )
        );

    }


    let svg = "";


    /* Y AXIS */

    yTicks.forEach(value => {

        const y =
            top +
            (
                (yMax - value) /
                (yMax - yMin)
            ) *
            chartHeight;


        const zeroClass =
            Math.abs(value) < 0.001
                ? "chart-zero-line"
                : "chart-grid-line";


        svg += `

            <line
                class="${zeroClass}"
                x1="${left}"
                x2="${width - right}"
                y1="${y}"
                y2="${y}"
            />

            <text
                class="chart-axis-label"
                x="${left - 12}"
                y="${y + 4}"
                text-anchor="end"
            >
                ${formatPercent(value)}
            </text>

        `;

    });


    /* X AXIS */

    const xLabels = [
        { index: 0, label: "60d ago" },
        { index: 10, label: "50d ago" },
        { index: 20, label: "40d ago" },
        { index: 30, label: "30d ago" },
        { index: 40, label: "20d ago" },
        { index: 50, label: "10d ago" },
        { index: 60, label: "Today" }
    ];


    xLabels.forEach(item => {

        const x =
            left +
            (
                item.index / 60
            ) *
            chartWidth;


        svg += `

            <text
                class="chart-x-label"
                x="${x}"
                y="${height - 20}"
                text-anchor="middle"
            >
                ${item.label}
            </text>

        `;

    });


    /* LINES */

    chartData.forEach(series => {

        const points =
            series.values
                .map((value, index) => {

                    const x =
                        left +
                        (
                            index / 60
                        ) *
                        chartWidth;


                    const y =
                        top +
                        (
                            (yMax - value) /
                            (yMax - yMin)
                        ) *
                        chartHeight;


                    return `${x},${y}`;

                })
                .join(" ");


        const isDimmed =
            highlightedSymbol &&
            highlightedSymbol !==
                series.stock.symbol;


        const isHighlighted =
            highlightedSymbol ===
            series.stock.symbol;


        svg += `

            <polyline
                class="
                    chart-line
                    ${isDimmed ? "dimmed" : ""}
                    ${isHighlighted ? "highlighted" : ""}
                "
                points="${points}"
                stroke="${series.stock.color}"
            />

        `;

    });


    /* GUIDE LINE */

    svg += `

        <line
            id="chartGuideLine"
            class="chart-guide-line"
            x1="0"
            x2="0"
            y1="${top}"
            y2="${height - bottom}"
            style="display:none"
        />

    `;


    /* INTERACTION AREA */

    svg += `

        <rect
            id="chartInteraction"
            x="${left}"
            y="${top}"
            width="${chartWidth}"
            height="${chartHeight}"
            fill="transparent"
        />

    `;


    performanceChart.innerHTML =
        svg;


    setupChartHover(
        chartData,
        left,
        chartWidth,
        top,
        chartHeight,
        width
    );

}


/* =========================================================
   PERFORMANCE DATA
   ========================================================= */

function generatePerformanceData(
    stock,
    stockIndex,
    count
) {

    const values = [];

    let value = 0;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        if (i === 0) {

            value = 0;

        } else {

            const wave =
                Math.sin(
                    i * 0.34 +
                    stockIndex * 1.7
                ) * 0.65;


            const trend =
                (
                    i / count
                ) *
                (
                    stock.change * 2.5 - 2
                );


            const movement =
                wave +
                trend +
                (
                    (i % 7) - 3
                ) *
                0.08;


            value += movement;

        }


        values.push(
            Number(
                value.toFixed(2)
            )
        );

    }


    return values;

}


/* =========================================================
   PERFORMANCE HOVER
   ========================================================= */

function setupChartHover(
    chartData,
    left,
    chartWidth,
    top,
    chartHeight,
    svgWidth
) {

    const interaction =
        document.getElementById(
            "chartInteraction"
        );

    const guideLine =
        document.getElementById(
            "chartGuideLine"
        );


    interaction.addEventListener(
        "mousemove",
        event => {

            const rect =
                performanceChart
                    .getBoundingClientRect();


            const mouseX =
                event.clientX -
                rect.left;


            const svgScale =
                svgWidth /
                rect.width;


            const svgX =
                mouseX *
                svgScale;


            let relative =
                (
                    svgX - left
                ) /
                chartWidth;


            relative =
                Math.max(
                    0,
                    Math.min(
                        1,
                        relative
                    )
                );


            const index =
                Math.round(
                    relative * 60
                );


            const x =
                left +
                (
                    index / 60
                ) *
                chartWidth;


            guideLine.setAttribute(
                "x1",
                x
            );

            guideLine.setAttribute(
                "x2",
                x
            );

            guideLine.style.display =
                "block";


            const daysAgo =
                60 - index;


            let tooltipHTML = `

                <div class="tooltip-day">
                    ${getDayLabel(daysAgo)}
                </div>

            `;


            chartData.forEach(series => {

                const value =
                    series.values[index];


                tooltipHTML += `

                    <div class="tooltip-stock">

                        <div class="tooltip-stock-info">

                            <span
                                class="tooltip-dot"
                                style="
                                    background:
                                    ${series.stock.color}
                                "
                            ></span>

                            <span class="tooltip-symbol">
                                ${series.stock.symbol}
                            </span>

                        </div>

                        <span
                            class="tooltip-value"
                            style="
                                color:
                                ${series.stock.color}
                            "
                        >
                            ${formatPercent(value)}
                        </span>

                    </div>

                `;

            });


            chartTooltip.innerHTML =
                tooltipHTML;


            chartTooltip.classList.add(
                "show"
            );


            const tooltipWidth =
                chartTooltip.offsetWidth;


            let tooltipLeft =
                mouseX + 15;


            if (
                tooltipLeft +
                tooltipWidth >
                rect.width
            ) {

                tooltipLeft =
                    mouseX -
                    tooltipWidth -
                    15;

            }


            chartTooltip.style.left =
                `${tooltipLeft}px`;


            chartTooltip.style.top =
                `${Math.max(
                    10,
                    event.clientY -
                    rect.top -
                    80
                )}px`;

        }
    );


    interaction.addEventListener(
        "mouseleave",
        () => {

            guideLine.style.display =
                "none";

            chartTooltip.classList.remove(
                "show"
            );

        }
    );

}


/* =========================================================
   LEGEND
   ========================================================= */

function renderLegend() {

    performanceLegend.innerHTML = "";


    selectedStocks.forEach(stock => {

        const item =
            document.createElement("div");


        item.className =
            "legend-item";


        item.innerHTML = `

            <span
                class="legend-dot"
                style="background:${stock.color}"
            ></span>

            <span>
                ${stock.symbol}
            </span>

        `;


        item.addEventListener(
            "click",
            () => toggleHighlight(
                stock.symbol
            )
        );


        performanceLegend.appendChild(
            item
        );

    });

}


/* =========================================================
   HIGHLIGHT
   ========================================================= */

function toggleHighlight(symbol) {

    if (
        highlightedSymbol === symbol
    ) {

        highlightedSymbol = null;

    } else {

        highlightedSymbol = symbol;

    }


    renderPerformanceChart();

}


/* =========================================================
   CURRENT PRICE BAR CHART
   ========================================================= */

function renderPriceChart() {

    const width = 1000;
    const height = 300;

    const left = 95;
    const right = 40;
    const top = 25;
    const bottom = 25;

    const chartWidth =
        width - left - right;

    const chartHeight =
        height - top - bottom;


    const maxPrice =
        Math.max(
            ...selectedStocks.map(
                stock => stock.price
            )
        );


    const roundedMax =
        Math.ceil(
            maxPrice / 100
        ) * 100;


    let svg = "";


    /* GRID */

    const gridCount = 4;


    for (
        let i = 0;
        i <= gridCount;
        i++
    ) {

        const value =
            (
                roundedMax /
                gridCount
            ) *
            i;


        const y =
            height -
            bottom -
            (
                value /
                roundedMax
            ) *
            chartHeight;


        svg += `

            <line
                class="price-grid-line"
                x1="${left}"
                x2="${width - right}"
                y1="${y}"
                y2="${y}"
            />

            <text
                class="price-axis-label"
                x="${left - 12}"
                y="${y + 4}"
                text-anchor="end"
            >
                ${Math.round(value)}
            </text>

        `;

    }


    /* BARS */

    const rowHeight =
        chartHeight /
        selectedStocks.length;


    const barHeight =
        Math.min(
            38,
            rowHeight * 0.55
        );


    selectedStocks.forEach(
        (stock, index) => {

            const rowCenter =
                top +
                rowHeight *
                index +
                rowHeight / 2;


            const y =
                rowCenter -
                barHeight / 2;


            const barWidth =
                (
                    stock.price /
                    roundedMax
                ) *
                chartWidth;


            svg += `

                <text
                    class="price-stock-label"
                    x="15"
                    y="${rowCenter + 4}"
                >
                    ${stock.symbol}
                </text>


                <rect
                    class="price-bar"
                    x="${left}"
                    y="${y}"
                    width="${barWidth}"
                    height="${barHeight}"
                    fill="${stock.color}"
                />


                <text
                    class="price-value-label"
                    x="${Math.min(
                        left +
                        barWidth +
                        10,
                        width - 55
                    )}"
                    y="${rowCenter + 4}"
                >
                    ${stock.price.toFixed(2)}
                </text>

            `;

        }
    );


    priceChart.innerHTML =
        svg;

}


/* =========================================================
   FUNDAMENTAL TABLE
   ========================================================= */

function renderFundamentalTable() {

    fundamentalHeader.innerHTML = `

        <th class="metric-column">
            Metric
        </th>

    `;


    selectedStocks.forEach(stock => {

        const th =
            document.createElement("th");


        th.className =
            "stock-table-header";


        th.innerHTML = `

            <span
                class="table-stock-header"
            >

                <span
                    class="table-stock-dot"
                    style="
                        background:
                        ${stock.color}
                    "
                ></span>

                ${stock.symbol}

            </span>

        `;


        th.querySelector(
            ".table-stock-header"
        ).addEventListener(
            "click",
            () => toggleHighlight(
                stock.symbol
            )
        );


        fundamentalHeader.appendChild(
            th
        );

    });


    fundamentalBody.innerHTML = "";


    const metrics = [

        {
            label: "Price",
            key: "price",
            formatter:
                value =>
                    `NPR ${value.toFixed(2)}`
        },

        {
            label: "Change %",
            key: "change",
            formatter:
                value =>
                    formatChange(value)
        },

        {
            label: "EPS",
            key: "eps",
            formatter:
                value =>
                    `NPR ${value.toFixed(2)}`
        },

        {
            label: "P/E",
            key: "pe",
            formatter:
                value =>
                    value.toFixed(2)
        },

        {
            label: "Revenue",
            key: "revenue",
            formatter:
                value => value
        },

        {
            label: "Net Profit",
            key: "profit",
            formatter:
                value => value
        },

        {
            label: "Market Cap",
            key: "marketCap",
            formatter:
                value => value
        },

        {
            label: "Prediction",
            key: "prediction",
            formatter:
                value => value
        }

    ];


    metrics.forEach(metric => {

        const row =
            document.createElement("tr");


        let html = `

            <td class="metric-name">
                ${metric.label}
            </td>

        `;


        selectedStocks.forEach(stock => {

            const value =
                stock[metric.key];


            /* CHANGE */

            if (
                metric.key === "change"
            ) {

                const className =
                    value >= 0
                        ? "positive"
                        : "negative";


                html += `

                    <td
                        class="
                            fundamental-value
                            ${className}
                        "
                    >
                        ${metric.formatter(value)}
                    </td>

                `;


                return;
            }


            /* PREDICTION */

            if (
                metric.key === "prediction"
            ) {

                const isUp =
                    value === "UP";


                html += `

                    <td
                        class="fundamental-value"
                    >

                        <span
                            class="
                                prediction-value
                                ${isUp
                                    ? "up"
                                    : "down"}
                            "
                        >

                            <span>
                                ${isUp
                                    ? "↑"
                                    : "↓"}
                            </span>

                            ${value}

                        </span>

                    </td>

                `;


                return;
            }


            /* NORMAL VALUE */

            html += `

                <td
                    class="fundamental-value"
                >
                    ${metric.formatter(value)}
                </td>

            `;

        });


        row.innerHTML =
            html;


        fundamentalBody.appendChild(
            row
        );

    });

}


/* =========================================================
   HELPERS
   ========================================================= */

function formatChange(value) {

    const sign =
        value >= 0
            ? "+"
            : "";

    return (
        sign +
        value.toFixed(2) +
        "%"
    );

}


function formatPercent(value) {

    const sign =
        value >= 0
            ? "+"
            : "";

    return (
        sign +
        value.toFixed(1) +
        "%"
    );

}


function getDayLabel(daysAgo) {

    if (daysAgo === 0) {
        return "Today";
    }

    return `${daysAgo}d ago`;

}


function calculateNiceStep(
    min,
    max,
    targetTicks
) {

    const roughStep =
        (
            max - min
        ) /
        targetTicks;


    const magnitude =
        Math.pow(
            10,
            Math.floor(
                Math.log10(
                    roughStep
                )
            )
        );


    const normalized =
        roughStep /
        magnitude;


    let niceNormalized;


    if (normalized <= 1) {

        niceNormalized = 1;

    } else if (normalized <= 2) {

        niceNormalized = 2;

    } else if (normalized <= 5) {

        niceNormalized = 5;

    } else {

        niceNormalized = 10;

    }


    return (
        niceNormalized *
        magnitude
    );

}