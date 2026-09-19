document.addEventListener("DOMContentLoaded", function () {

    const canvas = document.getElementById("nepseChart");

    if (!canvas) {
        console.error("NEPSE chart canvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const labels = [
        "May 1",
        "May 5",
        "May 9",
        "May 13",
        "May 17",
        "May 21",
        "May 25",
        "May 29",
        "Jun 2",
        "Jun 6",
        "Jun 10",
        "Jun 14"
    ];

    const nepseData = [
        2285,
        2298,
        2289,
        2310,
        2302,
        2325,
        2318,
        2338,
        2329,
        2345,
        2337,
        2347.85
    ];


    new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "NEPSE",

                    data: nepseData,

                    borderColor: "#14b8a6",

                    backgroundColor: "rgba(20, 184, 166, 0.10)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.4,

                    pointRadius: 0,

                    pointHoverRadius: 5
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

                    enabled: true,

                    callbacks: {

                        label: function (context) {

                            return " NEPSE: " +
                                context.parsed.y.toLocaleString();

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
                        color: "#64748b"
                    }

                },


                y: {

                    beginAtZero: false,

                    grid: {
                        color: "rgba(148, 163, 184, 0.15)"
                    },

                    ticks: {
                        color: "#64748b"
                    }

                }

            }

        }

    });

});