document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const watchlistGrid =
        document.getElementById("watchlistGrid");

    const watchlistCount =
        document.getElementById("watchlistCount");

    const watchlistGainers =
        document.getElementById("watchlistGainers");

    const watchlistTotalGainers =
        document.getElementById("watchlistTotalGainers");

    const watchlistLosers =
        document.getElementById("watchlistLosers");

    const watchlistTotalLosers =
        document.getElementById("watchlistTotalLosers");

    const watchlistPredictedUp =
        document.getElementById("watchlistPredictedUp");

    const watchlistPredictedTotal =
        document.getElementById("watchlistPredictedTotal");


    // =========================================================
    // FORMAT HELPERS
    // =========================================================

    function formatPrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "—";
        }

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    function formatVolume(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString("en-IN");
    }


    function formatChange(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0.00%";
        }

        return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
    }


    function getInitials(symbol) {

        if (!symbol) {
            return "?";
        }

        return symbol.substring(0, 2).toUpperCase();
    }


    // =========================================================
    // LOAD WATCHLIST
    // =========================================================

    async function loadWatchlist() {

        if (!watchlistGrid) {
            return;
        }

        try {

            const response =
                await fetch("/api/watchlist");

            if (!response.ok) {

                throw new Error(
                    `HTTP error: ${response.status}`
                );

            }

            const data =
                await response.json();

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load watchlist."
                );

            }

            const stocks =
                Array.isArray(data.stocks)
                    ? data.stocks
                    : [];

            renderWatchlist(stocks);

        } catch (error) {

            console.error(
                "Watchlist loading error:",
                error
            );

            watchlistGrid.innerHTML = `

                <div class="watchlist-empty">

                    <i class="bi bi-exclamation-circle"></i>

                    <h3>
                        Unable to load watchlist
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>

            `;

        }

    }


    // =========================================================
    // RENDER WATCHLIST
    // =========================================================

    function renderWatchlist(stocks) {

        const total =
            stocks.length;


        // -----------------------------------------------------
        // EMPTY WATCHLIST
        // -----------------------------------------------------

        if (total === 0) {

            watchlistGrid.innerHTML = `

                <div class="watchlist-empty">

                    <i class="bi bi-star"></i>

                    <h3>
                        Your watchlist is empty
                    </h3>

                    <p>
                        Add stocks below to start tracking them.
                    </p>

                </div>

            `;

            updateSummary(stocks);

            updateAddButtons([]);

            return;
        }


        // -----------------------------------------------------
        // STOCK CARDS
        // -----------------------------------------------------

        watchlistGrid.innerHTML =
            stocks.map(function (stock) {

                const change =
                    Number(stock.change || 0);


                const changeClass =
                    change > 0
                        ? "wsc-positive"
                        : change < 0
                            ? "wsc-negative"
                            : "wsc-neutral";


                const changeIcon =
                    change > 0
                        ? "bi-graph-up-arrow"
                        : change < 0
                            ? "bi-graph-down-arrow"
                            : "bi-dash";


                // -------------------------------------------------
                // PREDICTION
                // -------------------------------------------------

                const prediction =
                    stock.prediction || "—";


                const confidence =
                    stock.confidence !== null &&
                    stock.confidence !== undefined
                        ? Number(stock.confidence)
                        : null;


                const predictionClass =
                    prediction === "UP"
                        ? "wsc-positive"
                        : prediction === "DOWN"
                            ? "wsc-negative"
                            : "wsc-neutral";


                const predictionText =
                    confidence !== null &&
                    Number.isFinite(confidence)
                        ? `${prediction} ${confidence.toFixed(2)}%`
                        : prediction;


                return `

                    <div
                        class="watchlist-stock-card"
                        data-symbol="${stock.symbol}"
                    >

                        <!-- TOP -->

                        <div class="wsc-top">

                            <span class="wsc-badge">
                                ${getInitials(stock.symbol)}
                            </span>


                            <button
                                class="wsc-star active"
                                type="button"
                                data-symbol="${stock.symbol}"
                                aria-label="Remove ${stock.symbol} from watchlist"
                                title="Remove from watchlist"
                            >

                                <i class="bi bi-star-fill"></i>

                            </button>

                        </div>


                        <!-- NAME -->

                        <div class="wsc-name">

                            <strong>
                                ${stock.symbol}
                            </strong>

                            <small>
                                ${stock.symbol}
                            </small>

                        </div>


                        <!-- PRICE -->

                        <div class="wsc-price-row">

                            <span class="wsc-price">
                                ${formatPrice(stock.price)}
                            </span>


                            <span
                                class="wsc-change ${changeClass}"
                            >

                                <i class="bi ${changeIcon}"></i>

                                ${formatChange(change)}

                            </span>

                        </div>


                        <!-- LAST TRADE -->

                        <div class="wsc-subprice-row">

                            <small class="wsc-ltp-label">
                                NPR · Last Trade
                            </small>


                            <small
                                class="wsc-change-pts ${changeClass}"
                            >
                                ${formatChange(change)}
                            </small>

                        </div>


                        <div class="wsc-divider"></div>


                        <!-- STATS -->

                        <div class="wsc-stats">


                            <!-- VOLUME -->

                            <div class="wsc-stat">

                                <small>
                                    VOLUME
                                </small>

                                <strong>
                                    ${formatVolume(stock.volume)}
                                </strong>

                            </div>


                            <!-- TRADE DATE -->

                            <div class="wsc-stat">

                                <small>
                                    TRADE DATE
                                </small>

                                <strong>
                                    ${stock.trade_date || "—"}
                                </strong>

                            </div>


                            <!-- XGBOOST PREDICTION -->

                            <div class="wsc-stat">

                                <small>
                                    PREDICT
                                </small>


                                <span
                                    class="wsc-predict-badge ${predictionClass}"
                                    title="XGBoost prediction confidence"
                                >

                                    <i class="bi bi-lightning-charge-fill"></i>

                                    ${predictionText}

                                </span>

                            </div>

                        </div>

                    </div>

                `;

            }).join("");


        // -----------------------------------------------------
        // UPDATE SUMMARY
        // -----------------------------------------------------

        updateSummary(stocks);


        // -----------------------------------------------------
        // UPDATE ADD BUTTONS
        // -----------------------------------------------------

        updateAddButtons(
            stocks.map(
                stock => stock.symbol
            )
        );


        // -----------------------------------------------------
        // STAR / REMOVE BUTTONS
        // -----------------------------------------------------

        attachStarEvents();

    }


    // =========================================================
    // UPDATE SUMMARY CARDS
    // =========================================================

    function updateSummary(stocks) {

        const total =
            stocks.length;


        const gainers =
            stocks.filter(
                stock =>
                    Number(stock.change) > 0
            ).length;


        const losers =
            stocks.filter(
                stock =>
                    Number(stock.change) < 0
            ).length;


        // -----------------------------------------------------
        // REAL XGBOOST UP PREDICTIONS
        // -----------------------------------------------------

        const predictedUp =
            stocks.filter(
                stock =>
                    stock.prediction === "UP"
            ).length;


        // -----------------------------------------------------
        // WATCHLIST COUNT
        // -----------------------------------------------------

        if (watchlistCount) {

            watchlistCount.textContent =
                `${total} ${
                    total === 1
                        ? "stock"
                        : "stocks"
                } tracked`;

        }


        // -----------------------------------------------------
        // GAINERS
        // -----------------------------------------------------

        if (watchlistGainers) {

            watchlistGainers.textContent =
                gainers;

        }


        if (watchlistTotalGainers) {

            watchlistTotalGainers.textContent =
                `/${total}`;

        }


        // -----------------------------------------------------
        // LOSERS
        // -----------------------------------------------------

        if (watchlistLosers) {

            watchlistLosers.textContent =
                losers;

        }


        if (watchlistTotalLosers) {

            watchlistTotalLosers.textContent =
                `/${total}`;

        }


        // -----------------------------------------------------
        // PREDICTED UP
        // -----------------------------------------------------

        if (watchlistPredictedUp) {

            watchlistPredictedUp.textContent =
                predictedUp;

        }


        if (watchlistPredictedTotal) {

            watchlistPredictedTotal.textContent =
                `/${total}`;

        }

    }


    // =========================================================
    // STAR / REMOVE BUTTONS
    // =========================================================

    function attachStarEvents() {

        document
            .querySelectorAll(".wsc-star")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    async function () {

                        const symbol =
                            button.dataset.symbol;


                        if (!symbol) {
                            return;
                        }


                        button.disabled =
                            true;


                        try {

                            const response =
                                await fetch(
                                    "/api/watchlist/remove",
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body: JSON.stringify({
                                            symbol: symbol
                                        })
                                    }
                                );


                            const data =
                                await response.json();


                            if (
                                !response.ok ||
                                !data.success
                            ) {

                                throw new Error(
                                    data.message ||
                                    "Unable to remove stock."
                                );

                            }


                            await loadWatchlist();


                        } catch (error) {

                            console.error(
                                "Remove watchlist error:",
                                error
                            );


                            alert(
                                error.message ||
                                "Unable to remove stock."
                            );


                            button.disabled =
                                false;

                        }

                    }
                );

            });

    }


    // =========================================================
    // ADD STOCK BUTTONS
    // =========================================================

    function attachAddEvents() {

        /*
         * Event delegation:
         * ONE listener handles all Add buttons.
         *
         * This prevents duplicate listeners
         * when the watchlist is refreshed.
         */

        if (window.watchlistAddListenerAttached) {
            return;
        }

        window.watchlistAddListenerAttached =
            true;


        document.addEventListener(
            "click",
            async function (event) {

                const button =
                    event.target.closest(".asc-add");


                if (!button) {
                    return;
                }


                const symbol =
                    button.dataset.symbol;


                if (
                    !symbol ||
                    button.disabled
                ) {
                    return;
                }


                const chip =
                    button.closest(
                        ".add-stock-chip"
                    );


                button.disabled =
                    true;


                button.textContent =
                    "Adding...";


                try {

                    const response =
                        await fetch(
                            "/api/watchlist/add",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    symbol: symbol
                                })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to add stock."
                        );

                    }


                    button.textContent =
                        "Added";


                    if (chip) {

                        chip.style.opacity =
                            "0.5";

                    }


                    await loadWatchlist();


                } catch (error) {

                    console.error(
                        "Add watchlist error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to add stock."
                    );


                    button.disabled =
                        false;


                    button.textContent =
                        "+ Add";

                }

            }
        );

    }


    // =========================================================
    // UPDATE ADD BUTTONS
    // =========================================================

    function updateAddButtons(
        watchlistSymbols
    ) {

        const symbols =
            watchlistSymbols.map(
                symbol =>
                    String(symbol).toUpperCase()
            );


        document
            .querySelectorAll(".asc-add")
            .forEach(function (button) {

                const symbol =
                    String(
                        button.dataset.symbol || ""
                    ).toUpperCase();


                if (
                    symbols.includes(symbol)
                ) {

                    button.textContent =
                        "Added";


                    button.disabled =
                        true;


                    const chip =
                        button.closest(
                            ".add-stock-chip"
                        );


                    if (chip) {

                        chip.style.opacity =
                            "0.5";

                    }

                } else {

                    button.textContent =
                        "+ Add";


                    button.disabled =
                        false;


                    const chip =
                        button.closest(
                            ".add-stock-chip"
                        );


                    if (chip) {

                        chip.style.opacity =
                            "1";

                    }

                }

            });


        attachAddEvents();

    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadWatchlist();

});

