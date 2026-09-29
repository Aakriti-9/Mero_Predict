document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const watchlistGrid =
        document.getElementById("watchlistGrid");

    const addStocksGrid =
        document.getElementById("addStocksGrid");

    const watchlistCount =
        document.getElementById("watchlistCount");

    const watchlistCountLabel =
        document.getElementById("watchlistCountLabel");

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
    // STOCK SEARCH ELEMENTS
    // =========================================================

    const stockSearchInput =
        document.getElementById("stockSearchInput");

    const clearStockSearch =
        document.getElementById("clearStockSearch");

    const stockSearchInfo =
        document.getElementById("stockSearchInfo");


    // =========================================================
    // AVAILABLE STOCKS
    // =========================================================

    /*
     * Complete list of stocks available to add.
     *
     * Without searching:
     *     Only first 12 stocks are displayed.
     *
     * With searching:
     *     All matching stocks are displayed.
     */

    let availableStocks = [];


    // =========================================================
    // EVENT LISTENER STATE
    // =========================================================

    let addListenerAttached = false;


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

        return String(symbol)
            .trim()
            .substring(0, 2)
            .toUpperCase();

    }


    // =========================================================
    // HTML ESCAPE HELPER
    // =========================================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =========================================================
    // OPEN COMPANY DETAILS
    // =========================================================

    function openCompanyDetails(symbol) {

        if (!symbol) {
            return;
        }

        const cleanSymbol =
            String(symbol)
                .trim()
                .toUpperCase();

        if (!cleanSymbol) {
            return;
        }

        window.location.href =
            `/companies/${encodeURIComponent(cleanSymbol)}`;

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


            // -------------------------------------------------
            // RENDER PERSONAL WATCHLIST
            // -------------------------------------------------

            renderWatchlist(stocks);


            // -------------------------------------------------
            // LOAD AVAILABLE STOCKS
            // -------------------------------------------------

            await loadAvailableStocks(
                stocks.map(
                    stock => stock.symbol
                )
            );


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
    // LOAD AVAILABLE STOCKS
    // =========================================================

    async function loadAvailableStocks(
        currentWatchlistSymbols = []
    ) {

        if (!addStocksGrid) {
            return;
        }

        try {

            addStocksGrid.innerHTML = `

                <div class="add-stocks-loading">

                    <i class="bi bi-hourglass-split"></i>

                    <span>
                        Loading available stocks...
                    </span>

                </div>

            `;


            const response =
                await fetch(
                    "/api/watchlist/available"
                );


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
                    "Unable to load available stocks."
                );

            }


            let stocks =
                Array.isArray(data.stocks)
                    ? data.stocks
                    : [];


            // -------------------------------------------------
            // CURRENT WATCHLIST SYMBOLS
            // -------------------------------------------------

            const watchlistSymbols =
                currentWatchlistSymbols.map(
                    symbol =>
                        String(symbol)
                            .trim()
                            .toUpperCase()
                );


            // -------------------------------------------------
            // REMOVE ALREADY SAVED STOCKS
            // -------------------------------------------------

            stocks =
                stocks.filter(function (stock) {

                    const symbol =
                        String(
                            stock.symbol || ""
                        )
                            .trim()
                            .toUpperCase();

                    return (
                        symbol &&
                        !watchlistSymbols.includes(symbol)
                    );

                });


            // -------------------------------------------------
            // SORT A → Z
            // -------------------------------------------------

            stocks.sort(function (a, b) {

                const symbolA =
                    String(a.symbol || "")
                        .trim()
                        .toUpperCase();

                const symbolB =
                    String(b.symbol || "")
                        .trim()
                        .toUpperCase();

                return symbolA.localeCompare(symbolB);

            });


            // -------------------------------------------------
            // STORE COMPLETE LIST
            // -------------------------------------------------

            availableStocks = stocks;


            // -------------------------------------------------
            // RENDER
            // -------------------------------------------------

            renderAvailableStocks();


        } catch (error) {

            console.error(
                "Available stocks loading error:",
                error
            );


            availableStocks = [];


            addStocksGrid.innerHTML = `

                <div class="add-stocks-empty">

                    <i class="bi bi-exclamation-circle"></i>

                    <span>
                        Unable to load available stocks.
                    </span>

                </div>

            `;


            if (stockSearchInfo) {

                stockSearchInfo.textContent =
                    "Unable to load available stocks.";

            }

        }

    }


    // =========================================================
    // RENDER AVAILABLE STOCKS
    // =========================================================

    function renderAvailableStocks() {

        if (!addStocksGrid) {
            return;
        }


        // -----------------------------------------------------
        // SEARCH VALUE
        // -----------------------------------------------------

        const searchTerm =
            stockSearchInput
                ? stockSearchInput.value
                    .trim()
                    .toUpperCase()
                : "";


        // -----------------------------------------------------
        // FILTER COMPLETE STOCK LIST
        // -----------------------------------------------------

        const filteredStocks =
            availableStocks.filter(function (stock) {

                const symbol =
                    String(
                        stock.symbol || ""
                    )
                        .trim()
                        .toUpperCase();

                return symbol.includes(searchTerm);

            });


        // -----------------------------------------------------
        // CLEAR BUTTON
        // -----------------------------------------------------

        if (clearStockSearch) {

            clearStockSearch.style.display =
                searchTerm
                    ? "flex"
                    : "none";

        }


        // -----------------------------------------------------
        // SEARCH INFORMATION
        // -----------------------------------------------------

        if (stockSearchInfo) {

            if (searchTerm) {

                stockSearchInfo.textContent =
                    `${filteredStocks.length} ${
                        filteredStocks.length === 1
                            ? "stock"
                            : "stocks"
                    } found for "${searchTerm}"`;

            } else {

                const visibleCount =
                    Math.min(
                        12,
                        availableStocks.length
                    );

                stockSearchInfo.textContent =
                    `Showing ${visibleCount} of ` +
                    `${availableStocks.length} available stocks. ` +
                    `Search above to find any stock.`;

            }

        }


        // -----------------------------------------------------
        // NO RESULTS
        // -----------------------------------------------------

        if (filteredStocks.length === 0) {

            addStocksGrid.innerHTML = `

                <div class="add-stocks-empty">

                    <i class="bi bi-search"></i>

                    <h3>
                        No stocks found
                    </h3>

                    <p>
                        ${
                            searchTerm
                                ? `No available stock matches "${escapeHtml(searchTerm)}".`
                                : "There are no more stocks available to add."
                        }
                    </p>

                </div>

            `;

            return;

        }


        // -----------------------------------------------------
        // DISPLAY LIMIT
        //
        // No search:
        //     Show first 12.
        //
        // Search:
        //     Show ALL matching stocks.
        // -----------------------------------------------------

        const visibleStocks =
            searchTerm
                ? filteredStocks
                : filteredStocks.slice(0, 12);


        // -----------------------------------------------------
        // CREATE STOCK CARDS
        // -----------------------------------------------------

        addStocksGrid.innerHTML =
            visibleStocks.map(function (stock) {

                const symbol =
                    String(
                        stock.symbol || ""
                    )
                        .trim()
                        .toUpperCase();


                const safeSymbol =
                    escapeHtml(symbol);


                const change =
                    Number(stock.change || 0);


                const changeClass =
                    change > 0
                        ? "asc-positive"
                        : change < 0
                            ? "asc-negative"
                            : "asc-neutral";


                return `

                    <div
                        class="add-stock-chip"
                        data-symbol="${safeSymbol}"
                    >

                        <span class="asc-badge">
                            ${getInitials(symbol)}
                        </span>


                        <strong class="asc-symbol">
                            ${safeSymbol}
                        </strong>


                        <span
                            class="asc-change ${changeClass}"
                        >
                            ${formatChange(change)}
                        </span>


                        <button
                            class="asc-add"
                            type="button"
                            data-symbol="${safeSymbol}"
                            title="Add ${safeSymbol} to watchlist"
                        >
                            + Add
                        </button>

                    </div>

                `;

            }).join("");


        // Add button events.
        attachAddEvents();

    }


    // =========================================================
    // SEARCH INPUT
    // =========================================================

    if (stockSearchInput) {

        stockSearchInput.addEventListener(
            "input",
            function () {

                renderAvailableStocks();

            }
        );

    }


    // =========================================================
    // CLEAR SEARCH
    // =========================================================

    if (clearStockSearch) {

        clearStockSearch.addEventListener(
            "click",
            function () {

                if (stockSearchInput) {

                    stockSearchInput.value = "";
                    stockSearchInput.focus();

                }

                renderAvailableStocks();

            }
        );

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

            return;

        }


        // -----------------------------------------------------
        // STOCK CARDS
        // -----------------------------------------------------

        watchlistGrid.innerHTML =
            stocks.map(function (stock) {

                const symbol =
                    String(
                        stock.symbol || ""
                    )
                        .trim()
                        .toUpperCase();


                const safeSymbol =
                    escapeHtml(symbol);


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
                    String(
                        stock.prediction || "—"
                    )
                        .trim()
                        .toUpperCase();


                const confidence =
                    stock.confidence !== null &&
                    stock.confidence !== undefined
                        ? Number(stock.confidence)
                        : null;


                /*
                 * Prediction badge classes.
                 *
                 * These match watchlist.css:
                 *
                 * wsc-predict-up
                 * wsc-predict-down
                 * wsc-predict-neutral
                 */

                const predictionClass =
                    prediction === "UP"
                        ? "wsc-predict-up"
                        : prediction === "DOWN"
                            ? "wsc-predict-down"
                            : "wsc-predict-neutral";


                const predictionText =
                    confidence !== null &&
                    Number.isFinite(confidence)
                        ? `${prediction} ${confidence.toFixed(2)}%`
                        : prediction;


                // -------------------------------------------------
                // TRADE DATE
                // -------------------------------------------------

                const tradeDate =
                    stock.trade_date || "—";


                return `

                    <div
                        class="watchlist-stock-card"
                        data-symbol="${safeSymbol}"
                    >


                        <!-- =====================================
                             TOP
                        ====================================== -->

                        <div class="wsc-top">

                            <span class="wsc-badge">
                                ${getInitials(symbol)}
                            </span>


                            <button
                                class="wsc-star active"
                                type="button"
                                data-symbol="${safeSymbol}"
                                aria-label="Remove ${safeSymbol} from watchlist"
                                title="Remove from watchlist"
                            >

                                <i class="bi bi-star-fill"></i>

                            </button>

                        </div>


                        <!-- =====================================
                             COMPANY
                        ====================================== -->

                        <div
                            class="wsc-name wsc-company-link"
                            data-symbol="${safeSymbol}"
                            role="link"
                            tabindex="0"
                            title="View ${safeSymbol} company details"
                        >

                            <strong>
                                ${safeSymbol}
                            </strong>

                            <small>
                                ${safeSymbol}
                            </small>

                        </div>


                        <!-- =====================================
                             PRICE
                        ====================================== -->

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


                        <!-- =====================================
                             LAST TRADE
                        ====================================== -->

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


                        <!-- =====================================
                             STATISTICS
                        ====================================== -->

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
                                    ${escapeHtml(tradeDate)}
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

                                    ${escapeHtml(predictionText)}

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
        // STAR / REMOVE EVENTS
        // -----------------------------------------------------

        attachStarEvents();


        // -----------------------------------------------------
        // COMPANY DETAILS EVENTS
        // -----------------------------------------------------

        attachCompanyDetailsEvents();

    }


    // =========================================================
    // COMPANY DETAILS EVENTS
    // =========================================================

    function attachCompanyDetailsEvents() {

        document
            .querySelectorAll(".wsc-company-link")
            .forEach(function (companyElement) {

                companyElement.addEventListener(
                    "click",
                    function () {

                        const symbol =
                            companyElement.dataset.symbol;

                        openCompanyDetails(symbol);

                    }
                );


                companyElement.addEventListener(
                    "keydown",
                    function (event) {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            const symbol =
                                companyElement.dataset.symbol;

                            openCompanyDetails(symbol);

                        }

                    }
                );

            });

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
        // XGBOOST PREDICTED UP
        // -----------------------------------------------------

        const predictedUp =
            stocks.filter(
                stock =>
                    String(stock.prediction || "")
                        .trim()
                        .toUpperCase() === "UP"
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


        if (watchlistCountLabel) {

            watchlistCountLabel.textContent =
                `${total} ${
                    total === 1
                        ? "Stock"
                        : "Stocks"
                }`;

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
                total;

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
                total;

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
                total;

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


                            // Reload both sections.
                            //
                            // The removed stock becomes
                            // available again.

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

        if (addListenerAttached) {
            return;
        }


        addListenerAttached =
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


                    // Reload everything.
                    //
                    // 1. Stock appears in watchlist.
                    // 2. Stock disappears from available.
                    // 3. Another available stock can appear.

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
    // INITIAL LOAD
    // =========================================================

    loadWatchlist();

});