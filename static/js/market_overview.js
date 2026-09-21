/* =========================================================
   MARKET OVERVIEW CHARTS — Live Edition
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       COMMON CHART OPTIONS
    ===================================================== */

    Chart.defaults.font.family =
        'Inter, "Segoe UI", Arial, sans-serif';

    Chart.defaults.color = "#6682b5";


    /* =====================================================
       SHARED PLUGIN: Live pulse badge (top-right corner)
    ===================================================== */

    function makeLivePulsePlugin(id) {
        let phase = Math.random() * Math.PI * 2;

        return {
            id: id,
            afterDraw(chart) {
                const { ctx, chartArea } = chart;
                if (!chartArea) return;

                phase += 0.06;

                const x = chartArea.right - 8;
                const y = chartArea.top + 4;
                const radius = 3 + Math.sin(phase) * 1.2;

                ctx.save();

                // Glow ring
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(32, 211, 107, " + (0.20 - Math.sin(phase) * 0.08) + ")";
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#20d36b";
                ctx.shadowColor = "#20d36b";
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;

                // "LIVE" label
                ctx.font = "700 9px Inter, sans-serif";
                ctx.fillStyle = "#20d36b";
                ctx.textAlign = "right";
                ctx.textBaseline = "middle";
                ctx.fillText("LIVE", x - 8, y);

                ctx.restore();

                requestAnimationFrame(() => chart.draw());
            }
        };
    }


    /* =====================================================
       SECTOR PERFORMANCE
    ===================================================== */

    const sectorCanvas =
        document.getElementById("sectorPerformanceChart");

    let sectorChart = null;

    if (sectorCanvas) {

        const sectorCtx = sectorCanvas.getContext("2d");

        const sectorLabels = [
            "Banking",
            "Insurance",
            "Hydropower",
            "Dev. Bank",
            "Finance",
            "Manufacturing",
            "Hotels",
            "Trading"
        ];

        let sectorData = [
            1.80,
            0.50,
            2.40,
            -0.90,
            -1.20,
            -0.40,
            1.10,
            0.70
        ];

        function sectorBarColor(value) {
            const gradient = sectorCtx.createLinearGradient(0, 0, 300, 0);
            if (value >= 0) {
                gradient.addColorStop(0, "rgba(32, 211, 107, 0.55)");
                gradient.addColorStop(1, "rgba(32, 211, 107, 1)");
            } else {
                gradient.addColorStop(0, "rgba(255, 86, 92, 1)");
                gradient.addColorStop(1, "rgba(255, 86, 92, 0.55)");
            }
            return gradient;
        }

        sectorChart = new Chart(sectorCanvas, {

            type: "bar",

            data: {

                labels: sectorLabels,

                datasets: [

                    {
                        label: "Change %",

                        data: sectorData,

                        backgroundColor: sectorData.map(sectorBarColor),

                        hoverBackgroundColor: sectorData.map(v =>
                            v >= 0 ? "#2ee87e" : "#ff6b71"
                        ),

                        borderRadius: 5,

                        borderSkipped: false,

                        barThickness: 27
                    }

                ]

            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio: false,

                animation: {
                    duration: 1400,
                    easing: "easeOutQuart",
                    delay: (ctx) =>
                        ctx.type === "data" ? ctx.dataIndex * 90 : 0
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        backgroundColor: "#111b36",

                        borderColor:
                            "rgba(255,255,255,0.10)",

                        borderWidth: 1,

                        titleColor: "#ffffff",

                        bodyColor: "#b7c5df",

                        padding: 12,

                        cornerRadius: 8,

                        displayColors: false,

                        callbacks: {

                            label: function (context) {

                                const value =
                                    context.raw;

                                return " Change: " +
                                    (value > 0 ? "+" : "") +
                                    value +
                                    "%";

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        min: -1.2,

                        max: 3.6,

                        grid: {

                            color:
                                "rgba(120,145,190,0.08)"

                        },

                        ticks: {

                            color: "#6682b5",

                            callback: function (value) {

                                return value + "%";

                            }

                        }

                    },

                    y: {

                        grid: {
                            display: false
                        },

                        ticks: {

                            color: "#dbe4f7",

                            font: {
                                size: 12
                            }

                        }

                    }

                }

            },

            plugins: [makeLivePulsePlugin("sectorLive")]

        });

    }



    /* =====================================================
       MARKET BREADTH DONUT
    ===================================================== */

    const breadthCanvas =
        document.getElementById("marketBreadthChart");

    let breadthChart = null;
    const breadthFixedTotal = 142 + 73 + 15; // stays constant

    if (breadthCanvas) {

        let breadthData = [142, 73, 15];

        function centerTextPluginFactory() {
            return {
                id: "centerText",
                beforeDraw(chart) {
                    const meta = chart.getDatasetMeta(0);
                    if (!meta || !meta.data || !meta.data[0]) return;

                    const { width, height, ctx } = chart;
                    const cx = meta.data[0].x ?? width / 2;
                    const cy = meta.data[0].y ?? height / 2;

                    ctx.save();

                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.font = "700 26px Inter, sans-serif";
                    ctx.fillStyle = "#f4f7ff";
                    ctx.fillText(breadthFixedTotal.toLocaleString(), cx, cy - 10);

                    ctx.font = "500 11px Inter, sans-serif";
                    ctx.fillStyle = "#6682b5";
                    ctx.fillText("Total Stocks", cx, cy + 14);

                    ctx.restore();
                }
            };
        }

        breadthChart = new Chart(breadthCanvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Gainers",
                    "Losers",
                    "Unchanged"
                ],

                datasets: [

                    {
                        data: breadthData,

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

                        borderColor: "#101a36",

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
                    easing: "easeInOutSine"
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        backgroundColor: "#111b36",

                        borderColor:
                            "rgba(255,255,255,0.10)",

                        borderWidth: 1,

                        padding: 10,

                        cornerRadius: 8,

                        displayColors: true

                    }

                }

            },

            plugins: [centerTextPluginFactory(), makeLivePulsePlugin("breadthLive")]

        });

    }



    /* =====================================================
       DAILY TURNOVER
    ===================================================== */

    const turnoverCanvas =
        document.getElementById("turnoverChart");

    let turnoverChart = null;

    if (turnoverCanvas) {

        const turnoverCtx = turnoverCanvas.getContext("2d");

        const turnoverGradient = turnoverCtx.createLinearGradient(0, 0, 0, 220);
        turnoverGradient.addColorStop(0, "#12c9bc");
        turnoverGradient.addColorStop(1, "#0a6d67");

        const turnoverLabels = [
            "05-18", "05-19", "05-20", "05-21", "05-22",
            "05-25", "05-26", "05-27", "05-28", "05-29",
            "06-01", "06-02", "06-03", "06-04", "06-05",
            "06-08", "06-09", "06-10", "06-11", "06-12"
        ];

        let turnoverData = [
            2.1, 3.9, 1.8, 1.2, 1.0,
            4.7, 3.0, 4.2, 4.7, 2.5,
            1.9, 2.5, 3.6, 4.1, 3.1,
            4.8, 3.2, 1.5, 2.0, 1.8
        ];

        turnoverChart = new Chart(turnoverCanvas, {

            type: "bar",

            data: {

                labels: turnoverLabels,

                datasets: [

                    {
                        label: "Turnover",

                        data: turnoverData,

                        backgroundColor: turnoverGradient,

                        hoverBackgroundColor: "#17e0d1",

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
                    easing: "easeOutQuart",
                    delay: (ctx) =>
                        ctx.type === "data" ? ctx.dataIndex * 25 : 0
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        backgroundColor: "#111b36",

                        borderColor:
                            "rgba(255,255,255,0.10)",

                        borderWidth: 1,

                        padding: 10,

                        cornerRadius: 8,

                        displayColors: false,

                        callbacks: {

                            label: function (context) {

                                return " NPR " +
                                    context.raw +
                                    "B";

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

                            color: "#6682b5",

                            maxRotation: 0,

                            autoSkip: false,

                            font: {
                                size: 10
                            }

                        }

                    },

                    y: {

                        beginAtZero: true,

                        max: 6,

                        grid: {

                            color:
                                "rgba(120,145,190,0.08)"

                        },

                        ticks: {

                            color: "#6682b5",

                            callback: function (value) {

                                return value + "B";

                            }

                        }

                    }

                }

            },

            plugins: [makeLivePulsePlugin("turnoverLive")]

        });

    }



    /* =====================================================
       LIVE DATA SIMULATION
       Every few seconds, nudge values slightly and
       smoothly animate the transition — like a live feed
    ===================================================== */

    // --- Sector performance: small random drift ---
    function updateSectorLive() {
        if (!sectorChart) return;

        const data = sectorChart.data.datasets[0].data;

        for (let i = 0; i < data.length; i++) {
            const drift = (Math.random() - 0.5) * 0.3;
            let next = data[i] + drift;
            next = Math.max(-2, Math.min(3.5, next)); // keep within axis bounds
            data[i] = Number(next.toFixed(2));
        }

        sectorChart.data.datasets[0].backgroundColor =
            data.map(v => sectorBarColorFor(sectorChart, v));
        sectorChart.data.datasets[0].hoverBackgroundColor =
            data.map(v => v >= 0 ? "#2ee87e" : "#ff6b71");

        sectorChart.options.animation.delay = 0; // no stagger on live updates
        sectorChart.update();
    }

    function sectorBarColorFor(chart, value) {
        const gradient = chart.ctx.createLinearGradient(0, 0, 300, 0);
        if (value >= 0) {
            gradient.addColorStop(0, "rgba(32, 211, 107, 0.55)");
            gradient.addColorStop(1, "rgba(32, 211, 107, 1)");
        } else {
            gradient.addColorStop(0, "rgba(255, 86, 92, 1)");
            gradient.addColorStop(1, "rgba(255, 86, 92, 0.55)");
        }
        return gradient;
    }


    // --- Market breadth: reshuffle counts, total stays fixed,
    //     and sync the HTML numbers next to the chart ---
    function updateBreadthLive() {
        if (!breadthChart) return;

        const data = breadthChart.data.datasets[0].data;
        const moveAmount = Math.floor(Math.random() * 3) + 1;

        // Randomly shift a small amount between gainers and losers
        if (Math.random() > 0.5 && data[0] > moveAmount) {
            data[0] -= moveAmount;
            data[1] += moveAmount;
        } else if (data[1] > moveAmount) {
            data[1] -= moveAmount;
            data[0] += moveAmount;
        }

        breadthChart.update();

        // Sync the HTML numbers next to the chart
        const gainers = data[0];
        const losers = data[1];
        const unchanged = data[2];

        const mainNumberEl = document.querySelector(".breadth-main-number strong");
        if (mainNumberEl) mainNumberEl.textContent = gainers;

        const gainText = document.querySelector(".gain-text");
        if (gainText) gainText.textContent = gainers;

        const lossText = document.querySelector(".loss-text");
        if (lossText) lossText.textContent = losers;

        const unchangedText = document.querySelector(".unchanged-text");
        if (unchangedText) unchangedText.textContent = unchanged;
    }


    // --- Turnover: nudge today's (last) bar slightly ---
    function updateTurnoverLive() {
        if (!turnoverChart) return;

        const data = turnoverChart.data.datasets[0].data;
        const lastIndex = data.length - 1;

        let next = data[lastIndex] + (Math.random() - 0.5) * 0.4;
        next = Math.max(0.5, Math.min(5.8, next));
        data[lastIndex] = Number(next.toFixed(2));

        turnoverChart.options.animation.delay = 0;
        turnoverChart.update();
    }


    setInterval(updateSectorLive, 3500);
    setInterval(updateBreadthLive, 4000);
    setInterval(updateTurnoverLive, 3000);

});