document.addEventListener("DOMContentLoaded", function () {

    const tableBody = document.getElementById("companiesTableBody");
    const searchInput = document.getElementById("companyTableSearch");
    const topSearchInput = document.getElementById("companySearch");
    const sectorFilter = document.getElementById("sectorFilter");
    const resultCount = document.getElementById("resultCount");
    const emptyState = document.getElementById("emptyState");

    if (!tableBody) {
        return;
    }


    /* =====================================================
       GET COMPANY ROWS
    ===================================================== */

    const rows = Array.from(
        tableBody.querySelectorAll("tr")
    );


    /* =====================================================
       FILTER COMPANIES
    ===================================================== */

    function filterCompanies() {

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedSector = sectorFilter
            ? sectorFilter.value
            : "all";

        let visibleCount = 0;


        rows.forEach(function (row) {

            const companyText =
                row.textContent.toLowerCase();

            const sector =
                row.dataset.sector || "";


            const matchesSearch =
                companyText.includes(searchTerm);

            const matchesSector =
                selectedSector === "all" ||
                sector === selectedSector;


            if (matchesSearch && matchesSector) {

                row.style.display = "";
                visibleCount++;

            } else {

                row.style.display = "none";

            }

        });


        /* =================================================
           UPDATE RESULT COUNT
        ================================================= */

        if (resultCount) {
            resultCount.textContent = visibleCount;
        }


        /* =================================================
           EMPTY STATE
        ================================================= */

        if (emptyState) {

            if (visibleCount === 0) {
                emptyState.style.display = "block";
            } else {
                emptyState.style.display = "none";
            }

        }

    }


    /* =====================================================
       MAIN SEARCH
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterCompanies
        );

    }


    /* =====================================================
       TOPBAR SEARCH
    ===================================================== */

    if (topSearchInput) {

        topSearchInput.addEventListener(
            "input",
            function () {

                if (searchInput) {

                    searchInput.value =
                        topSearchInput.value;

                    filterCompanies();

                }

            }
        );

    }


    /* =====================================================
       SECTOR FILTER
    ===================================================== */

    if (sectorFilter) {

        sectorFilter.addEventListener(
            "change",
            filterCompanies
        );

    }


    /* =====================================================
       VIEW COMPANY BUTTONS
    ===================================================== */

    const viewButtons =
        document.querySelectorAll(
            ".view-company-btn"
        );


    viewButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const symbol =
                    button.dataset.symbol;

                if (!symbol) {
                    return;
                }

                /*
                 * Temporary UI behavior.
                 *
                 * Later this button can redirect to:
                 * /companies/NABIL
                 *
                 * and show real company information.
                 */

                alert(
                    "Company details for " +
                    symbol +
                    " will be available here."
                );

            }
        );

    });


    /* =====================================================
       PAGINATION UI
    ===================================================== */

    const paginationButtons =
        document.querySelectorAll(
            ".pagination-btn:not(.disabled)"
        );


    paginationButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                paginationButtons.forEach(
                    function (btn) {
                        btn.classList.remove("active");
                    }
                );

                /*
                 * Only visual for now.
                 * Real pagination will be connected
                 * to the database later.
                 */

                if (
                    !button.querySelector("i") &&
                    button.textContent.trim() !== ""
                ) {
                    button.classList.add("active");
                }

            }
        );

    });


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    filterCompanies();

});