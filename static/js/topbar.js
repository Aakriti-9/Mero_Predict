// =========================================================
// MERO-PREDICT
// TOPBAR COMPANY SEARCH
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const searchInput =
        document.getElementById("companySearch");

    // Stop if this page does not have the topbar search
    if (!searchInput) {
        return;
    }


    // ---------------------------------------------------------
    // VARIABLES
    // ---------------------------------------------------------

    let companies = [];
    let activeIndex = -1;

    const searchWrapper =
        searchInput.closest(".dashboard-search");


    // ---------------------------------------------------------
    // CREATE SEARCH RESULTS DROPDOWN
    // ---------------------------------------------------------

    const resultsContainer =
        document.createElement("div");

    resultsContainer.className =
        "topbar-search-results";

    resultsContainer.style.display =
        "none";

    searchWrapper.appendChild(
        resultsContainer
    );


    // ---------------------------------------------------------
    // LOAD COMPANIES
    // ---------------------------------------------------------

    async function loadCompanies() {

        try {

            const response =
                await fetch("/api/companies");

            if (!response.ok) {
                throw new Error(
                    "Failed to load companies"
                );
            }

            const data =
                await response.json();

            if (
                data.success &&
                Array.isArray(data.companies)
            ) {

                companies =
                    data.companies;

                console.log(
                    "Topbar companies loaded:",
                    companies.length
                );

            } else {

                throw new Error(
                    "Invalid company data"
                );

            }

        } catch (error) {

            console.error(
                "Topbar search error:",
                error
            );

        }

    }


    // ---------------------------------------------------------
    // SHOW SEARCH RESULTS
    // ---------------------------------------------------------

    function showResults(searchTerm) {

        const term =
            String(searchTerm || "")
                .trim()
                .toLowerCase();


        // Reset active result
        activeIndex = -1;


        // Clear old results
        resultsContainer.innerHTML = "";


        // Hide for empty search
        if (!term) {

            resultsContainer.style.display =
                "none";

            return;

        }


        // -----------------------------------------------------
        // CHECK WHETHER DATA HAS LOADED
        // -----------------------------------------------------

        if (companies.length === 0) {

            resultsContainer.innerHTML = `
                <div class="topbar-search-empty">
                    Loading companies...
                </div>
            `;

            resultsContainer.style.display =
                "block";

            return;

        }


        // -----------------------------------------------------
        // FIND MATCHING COMPANIES
        // -----------------------------------------------------

        const matches =
            companies
                .filter(function (company) {

                    const symbol =
                        String(
                            company.symbol || ""
                        ).trim().toLowerCase();

                    const sector =
                        String(
                            company.sector || ""
                        ).trim().toLowerCase();


                    return (
                        symbol.includes(term) ||
                        sector.includes(term)
                    );

                })
                .slice(0, 8);


        // -----------------------------------------------------
        // NO RESULTS
        // -----------------------------------------------------

        if (matches.length === 0) {

            resultsContainer.innerHTML = `
                <div class="topbar-search-empty">
                    <i class="bi bi-search"></i>
                    <span>No companies found</span>
                </div>
            `;

            resultsContainer.style.display =
                "block";

            return;

        }


        // -----------------------------------------------------
        // CREATE RESULTS
        // -----------------------------------------------------

        matches.forEach(function (company, index) {

            const result =
                document.createElement("div");

            result.className =
                "topbar-search-item";

            result.dataset.index =
                index;


            result.innerHTML = `
                <div class="search-result-icon">
                    <i class="bi bi-building"></i>
                </div>

                <div class="search-result-info">

                    <div class="search-result-symbol">
                        ${escapeHtml(company.symbol)}
                    </div>

                    <div class="search-result-sector">
                        ${escapeHtml(company.sector)}
                    </div>

                </div>
            `;


            // -------------------------------------------------
            // CLICK RESULT
            // -------------------------------------------------

            result.addEventListener(
                "click",
                function () {

                    openCompany(
                        company.symbol
                    );

                }
            );


            resultsContainer.appendChild(
                result
            );

        });


        resultsContainer.style.display =
            "block";

    }


    // ---------------------------------------------------------
    // OPEN COMPANY
    // ---------------------------------------------------------

    function openCompany(symbol) {

        if (!symbol) {
            return;
        }

        window.location.href =
            `/companies/${encodeURIComponent(
                symbol
            )}`;

    }


    // ---------------------------------------------------------
    // UPDATE ACTIVE RESULT
    // ---------------------------------------------------------

    function updateActiveResult() {

        const results =
            resultsContainer.querySelectorAll(
                ".topbar-search-item"
            );


        results.forEach(function (result) {

            result.classList.remove(
                "active"
            );

        });


        if (
            activeIndex >= 0 &&
            activeIndex < results.length
        ) {

            results[activeIndex]
                .classList.add("active");

            results[activeIndex]
                .scrollIntoView({
                    block: "nearest"
                });

        }

    }


    // ---------------------------------------------------------
    // ESCAPE HTML
    // ---------------------------------------------------------

    function escapeHtml(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ---------------------------------------------------------
    // SEARCH INPUT
    // ---------------------------------------------------------

    searchInput.addEventListener(
        "input",
        function () {

            showResults(
                searchInput.value
            );

        }
    );


    // ---------------------------------------------------------
    // KEYBOARD NAVIGATION
    // ---------------------------------------------------------

    searchInput.addEventListener(
        "keydown",
        function (event) {

            const results =
                resultsContainer.querySelectorAll(
                    ".topbar-search-item"
                );


            // -----------------------------------------------
            // ARROW DOWN
            // -----------------------------------------------

            if (event.key === "ArrowDown") {

                if (results.length === 0) {
                    return;
                }

                event.preventDefault();

                activeIndex++;

                if (
                    activeIndex >=
                    results.length
                ) {

                    activeIndex = 0;

                }

                updateActiveResult();

            }


            // -----------------------------------------------
            // ARROW UP
            // -----------------------------------------------

            else if (
                event.key === "ArrowUp"
            ) {

                if (results.length === 0) {
                    return;
                }

                event.preventDefault();

                activeIndex--;

                if (activeIndex < 0) {

                    activeIndex =
                        results.length - 1;

                }

                updateActiveResult();

            }


            // -----------------------------------------------
            // ENTER
            // -----------------------------------------------

            else if (
                event.key === "Enter"
            ) {

                if (
                    activeIndex >= 0 &&
                    activeIndex < results.length
                ) {

                    event.preventDefault();

                    results[activeIndex]
                        .click();

                } else if (
                    results.length > 0
                ) {

                    event.preventDefault();

                    results[0].click();

                }

            }


            // -----------------------------------------------
            // ESCAPE
            // -----------------------------------------------

            else if (
                event.key === "Escape"
            ) {

                resultsContainer.style.display =
                    "none";

                activeIndex = -1;

            }

        }
    );


    // ---------------------------------------------------------
    // CLOSE RESULTS WHEN CLICKING OUTSIDE
    // ---------------------------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            if (
                !searchWrapper.contains(
                    event.target
                )
            ) {

                resultsContainer.style.display =
                    "none";

                activeIndex = -1;

            }

        }
    );


    // ---------------------------------------------------------
    // LOAD DATA
    // ---------------------------------------------------------

    loadCompanies();

});

