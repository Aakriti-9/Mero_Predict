// =========================================================
// MERO-PREDICT
// Professional NEPSE Chart — Live Streaming Edition
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("nepseChart");

    if (!canvas) {
        console.error("NEPSE chart canvas not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }


    // -----------------------------------------------------
    // Seed Data
    // -----------------------------------------------------

    const MAX_POINTS = 20;

    const seedLabels = [
        "Jul 01", "Jul 03", "Jul 05", "Jul 07", "Jul 09",
        "Jul 11", "Jul 13", "Jul 15", "Jul 17", "Jul 19",
        "Jul 21", "Jul 23", "Jul 25", "Jul 27", "Jul 29"
    ];

    const seedData = [
        2280, 2295, 2288, 2305, 2298,
        2315, 2308, 2330, 2322, 2340,
        2355, 2348, 2368, 2359, 2385
    ];

    const baselineValue = seedData[0];


    // -----------------------------------------------------
    // Canvas Context
    // -----------------------------------------------------

    const ctx = canvas.getContext("2d");

    function buildGradient() {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 280);
        g.addColorStop(0, "rgba(0, 212, 199, 0.25)");
        g.addColorStop(0.5, "rgba(0, 212, 199, 0.08)");
        g.addColorStop(1, "rgba(0, 212, 199, 0)");
        return g;
    }


    // -----------------------------------------------------
    // PLUGIN: Baseline reference line
    // -----------------------------------------------------

    const baselinePlugin = {
        id: "baselineLine",
        afterDatasetsDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const y = scales.y.getPixelForValue(baselineValue);

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(chartArea.left, y);
            ctx.lineTo(chartArea.right, y);
            ctx.strokeStyle = "rgba(130, 150, 200, 0.22)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    };


    // -----------------------------------------------------
    // PLUGIN: Crosshair on hover
    // -----------------------------------------------------

    const crosshairPlugin = {
        id: "crosshair",
        afterDatasetsDraw(chart) {
            const active = chart.getActiveElements();
            if (!active || active.length === 0) return;

            const { ctx, chartArea } = chart;
            const point = active[0].element;
            const { x, y } = point;

            ctx.save();

            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.strokeStyle = "rgba(0, 212, 199, 0.35)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(chartArea.left, y);
            ctx.lineTo(chartArea.right, y);
            ctx.strokeStyle = "rgba(0, 212, 199, 0.35)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }
    };


    // -----------------------------------------------------
    // PLUGIN: Live pulse marker + price label
    // Pulsing dot at the last point, with a "LIVE" badge
    // and the current price pinned at the right edge
    // -----------------------------------------------------

    let pulsePhase = 0;

    const livePricePlugin = {
        id: "livePrice",
        afterDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0);
            const lastPoint = meta.data[meta.data.length - 1];
            if (!lastPoint) return;

            const { x, y } = lastPoint.getProps(["x", "y"], true);
            const { chartArea } = chart;
            const c = chart.ctx;
            const currentValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];

            c.save();

            // Pulsing glow ring
            const pulseRadius = 4 + Math.sin(pulsePhase) * 3;
            c.beginPath();
            c.arc(x, y, pulseRadius + 6, 0, Math.PI * 2);
            c.fillStyle = "rgba(0, 212, 199, " + (0.22 - Math.sin(pulsePhase) * 0.08) + ")";
            c.fill();

            // Solid core dot
            c.beginPath();
            c.arc(x, y, 4, 0, Math.PI * 2);
            c.fillStyle = "#00d4c7";
            c.shadowColor = "#00d4c7";
            c.shadowBlur = 9;
            c.fill();
            c.shadowBlur = 0;

            // Dashed connector to right edge
            c.beginPath();
            c.setLineDash([2, 3]);
            c.moveTo(x, y);
            c.lineTo(chartArea.right, y);
            c.strokeStyle = "rgba(0, 212, 199, 0.4)";
            c.lineWidth = 1;
            c.stroke();
            c.setLineDash([]);

            // Price label box
            const label = Number(currentValue).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            c.font = "600 11px Inter, sans-serif";
            const textWidth = c.measureText(label).width;
            const boxPadding = 6;
            const boxWidth = textWidth + boxPadding * 2;
            const boxHeight = 20;
            const boxX = chartArea.right - boxWidth;
            const boxY = y - boxHeight / 2;

            c.beginPath();
            c.roundRect(boxX, boxY, boxWidth, boxHeight, 5);
            c.fillStyle = "#00d4c7";
            c.fill();

            c.fillStyle = "#062420";
            c.textBaseline = "middle";
            c.fillText(label, boxX + boxPadding, boxY + boxHeight / 2 + 0.5);

            c.restore();
        }
    };


    // -----------------------------------------------------
    // Create Chart
    // -----------------------------------------------------

    const chart = new Chart(ctx, {

        type: "line",

        data: {
            labels: [...seedLabels],
            datasets: [
                {
                    label: "NEPSE Index",
                    data: [...seedData],

                    borderColor: "#00d4c7",
                    borderWidth: 3,

                    backgroundColor: buildGradient(),
                    fill: true,

                    tension: 0.4,

                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "#00d4c7",
                    pointHoverBorderColor: "#ffffff",
                    pointHoverBorderWidth: 2
                }
            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            layout: {
                padding: { right: 55 }
            },

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: { display: false },

                tooltip: {
                    enabled: true,
                    backgroundColor: "rgba(10, 20, 48, 0.95)",
                    titleColor: "#ffffff",
                    bodyColor: "#aab9e2",
                    borderColor: "rgba(0, 212, 199, 0.35)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: false,

                    callbacks: {
                        title: (items) => items[0].label,
                        label: (context) =>
                            " NEPSE  " +
                            Number(context.parsed.y).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                    }
                }
            },

            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "#6079ad",
                        font: { size: 11 },
                        maxTicksLimit: 7,
                        padding: 8
                    }
                },
                y: {
                    display: true,
                    position: "right",
                    grid: {
                        color: "rgba(130, 150, 200, 0.08)",
                        drawBorder: false
                    },
                    border: { display: false },
                    ticks: {
                        color: "#6079ad",
                        font: { size: 11 },
                        padding: 8,
                        callback: (value) => value.toLocaleString()
                    }
                }
            },

            // ---------------------------------------------
            // RISE-IN ANIMATION (initial load only)
            // ---------------------------------------------

            animation: {
                duration: 2800,
                easing: "easeInOutSine"
            },

            animations: {
                y: {
                    easing: "easeInOutSine",
                    duration: 2800,
                    from: (ctx2) => {
                        if (ctx2.type === "data" && ctx2.mode === "default" && !ctx2.dropped) {
                            ctx2.dropped = true;
                            return ctx2.chart.scales.y.getPixelForValue(
                                Math.min(...seedData) - 40
                            );
                        }
                    }
                }
            }
        },

        plugins: [baselinePlugin, crosshairPlugin, livePricePlugin]
    });


    // -----------------------------------------------------
    // Live streaming — push a new point every few seconds,
    // drop the oldest, so the chart scrolls forward
    // -----------------------------------------------------

    function pushLivePoint() {
        const data = chart.data.datasets[0].data;
        const last = data[data.length - 1];
        const change = (Math.random() - 0.47) * 3.5; // slight upward bias
        const next = Number((last + change).toFixed(2));

        const now = new Date();
        const label = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        chart.data.labels.push(label);
        data.push(next);

        if (chart.data.labels.length > MAX_POINTS) {
            chart.data.labels.shift();
            data.shift();
        }

        chart.data.datasets[0].backgroundColor = buildGradient();
        chart.update("none"); // no full re-animation — smooth stream
    }

    setInterval(pushLivePoint, 2500);


    // -----------------------------------------------------
    // Continuous pulse animation loop
    // -----------------------------------------------------

    function animatePulse() {
        pulsePhase += 0.07;
        chart.draw();
        requestAnimationFrame(animatePulse);
    }

    requestAnimationFrame(animatePulse);

});