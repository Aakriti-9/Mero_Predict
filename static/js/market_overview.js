/* =========================================================
   MARKET OVERVIEW CHARTS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       COMMON CHART OPTIONS
    ===================================================== */

    Chart.defaults.font.family =
        'Inter, "Segoe UI", Arial, sans-serif';

    Chart.defaults.color = "#6682b5";


    /* =====================================================
       SECTOR PERFORMANCE
    ===================================================== */

    const sectorCanvas =
        document.getElementById("sectorPerformanceChart");

    if (sectorCanvas) {

        new Chart(sectorCanvas, {

            type: "bar",

            data: {

                labels: [
                    "Banking",
                    "Insurance",
                    "Hydropower",
                    "Dev. Bank",
                    "Finance",
                    "Manufacturing",
                    "Hotels",
                    "Trading"
                ],

                datasets: [

                    {
                        label: "Change %",

                        data: [
                            1.80,
                            0.50,
                            2.40,
                            -0.90,
                            -1.20,
                            -0.40,
                            1.10,
                            0.70
                        ],

                        backgroundColor: [
                            "#20d36b",
                            "#20d36b",
                            "#20d36b",
                            "#ff565c",
                            "#ff565c",
                            "#ff565c",
                            "#20d36b",
                            "#20d36b"
                        ],

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

            }

        });

    }



    /* =====================================================
       MARKET BREADTH DONUT
    ===================================================== */

    const breadthCanvas =
        document.getElementById("marketBreadthChart");

    if (breadthCanvas) {

        new Chart(breadthCanvas, {

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
                            142,
                            73,
                            15
                        ],

                        backgroundColor: [
                            "#20d36b",
                            "#ff4f55",
                            "#7189b0"
                        ],

                        borderColor: "#101a36",

                        borderWidth: 2,

                        hoverOffset: 4

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "62%",

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        backgroundColor: "#111b36",

                        borderColor:
                            "rgba(255,255,255,0.10)",

                        borderWidth: 1,

                        padding: 10

                    }

                }

            }

        });

    }



    /* =====================================================
       DAILY TURNOVER
    ===================================================== */

    const turnoverCanvas =
        document.getElementById("turnoverChart");

    if (turnoverCanvas) {

        new Chart(turnoverCanvas, {

            type: "bar",

            data: {

                labels: [
                    "05-18",
                    "05-19",
                    "05-20",
                    "05-21",
                    "05-22",
                    "05-25",
                    "05-26",
                    "05-27",
                    "05-28",
                    "05-29",
                    "06-01",
                    "06-02",
                    "06-03",
                    "06-04",
                    "06-05",
                    "06-08",
                    "06-09",
                    "06-10",
                    "06-11",
                    "06-12"
                ],

                datasets: [

                    {
                        label: "Turnover",

                        data: [
                            2.1,
                            3.9,
                            1.8,
                            1.2,
                            1.0,
                            4.7,
                            3.0,
                            4.2,
                            4.7,
                            2.5,
                            1.9,
                            2.5,
                            3.6,
                            4.1,
                            3.1,
                            4.8,
                            3.2,
                            1.5,
                            2.0,
                            1.8
                        ],

                        backgroundColor: "#0aa49a",

                        borderRadius: 4,

                        borderSkipped: false

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

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

            }

        });

    }

});