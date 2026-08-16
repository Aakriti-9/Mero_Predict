// =========================================================
// MERO-PREDICT
// Professional NEPSE Historical Chart
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("nepseChart");

    // -----------------------------------------------------
    // Check canvas
    // -----------------------------------------------------

    if (!canvas) {
        console.error("NEPSE chart canvas not found.");
        return;
    }


    // -----------------------------------------------------
    // Check Chart.js
    // -----------------------------------------------------

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }


    // -----------------------------------------------------
    // Historical Data
    // -----------------------------------------------------

    const labels = [
        "Jul 01",
        "Jul 03",
        "Jul 05",
        "Jul 07",
        "Jul 09",
        "Jul 11",
        "Jul 13",
        "Jul 15",
        "Jul 17",
        "Jul 19",
        "Jul 21",
        "Jul 23",
        "Jul 25",
        "Jul 27",
        "Jul 29"
    ];


    const nepseData = [
        2280,
        2295,
        2288,
        2305,
        2298,
        2315,
        2308,
        2330,
        2322,
        2340,
        2355,
        2348,
        2368,
        2359,
        2385
    ];


    // -----------------------------------------------------
    // Canvas Context
    // -----------------------------------------------------

    const ctx = canvas.getContext("2d");


    // -----------------------------------------------------
    // Gradient
    // -----------------------------------------------------

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        280
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


    // -----------------------------------------------------
    // Create Chart
    // -----------------------------------------------------

    new Chart(ctx, {

        type: "line",


        data: {

            labels: labels,

            datasets: [

                {

                    label: "NEPSE Index",

                    data: nepseData,


                    // Line
                    borderColor: "#00d4c7",

                    borderWidth: 3,


                    // Area
                    backgroundColor: gradient,

                    fill: true,


                    // Smoothness
                    tension: 0.4,


                    // Normal points hidden
                    pointRadius: 0,


                    // Hover point
                    pointHoverRadius: 6,

                    pointHoverBackgroundColor:
                        "#00d4c7",

                    pointHoverBorderColor:
                        "#ffffff",

                    pointHoverBorderWidth: 2
                }

            ]
        },


        // -------------------------------------------------
        // Options
        // -------------------------------------------------

        options: {

            responsive: true,

            maintainAspectRatio: false,


            // Smooth interaction
            interaction: {

                mode: "index",

                intersect: false
            },


            // -------------------------------------------------
            // Plugins
            // -------------------------------------------------

            plugins: {

                // No legend
                legend: {

                    display: false
                },


                // Professional tooltip
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

                            return items[0].label;

                        },


                        label: (context) => {

                            return (
                                " NEPSE  " +
                                Number(
                                    context.parsed.y
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )
                            );

                        }
                    }
                }
            },


            // -------------------------------------------------
            // Axes
            // -------------------------------------------------

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

                        color: "#6079ad",

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

                        color: "#6079ad",

                        font: {

                            size: 11
                        },

                        padding: 8,

                        callback: (value) => {

                            return value.toLocaleString();

                        }
                    }
                }
            },


            // -------------------------------------------------
            // Animation
            // -------------------------------------------------

            animation: {

                duration: 1600,

                easing: "easeOutQuart"
            }
        }
    });

});

