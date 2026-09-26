document.addEventListener("DOMContentLoaded", function () {


/* =====================================================
   ELEMENTS
===================================================== */

const tableBody =
    document.getElementById("companiesTableBody");

const searchInput =
    document.getElementById("companyTableSearch");

const topSearchInput =
    document.getElementById("companySearch");

const sectorFilter =
    document.getElementById("sectorFilter");

const resultCount =
    document.getElementById("resultCount");

const totalCompanies =
    document.getElementById("totalCompanies");

const emptyState =
    document.getElementById("emptyState");

const loading =
    document.getElementById("companiesLoading");

const pageInfo =
    document.getElementById("pageInfo");

const pagination =
    document.getElementById("pagination");


if (!tableBody) {
    return;
}


/* =====================================================
   STATE
===================================================== */

let companies = [];

let filteredCompanies = [];

let currentPage = 1;

const rowsPerPage = 10;


/* =====================================================
   SORT STATE
===================================================== */

let currentSort = "symbol";

let sortDirection = "asc";


/* =====================================================
   LOAD COMPANIES
===================================================== */

async function loadCompanies() {

    try {

        if (loading) {
            loading.style.display = "flex";
        }


        const response =
            await fetch("/api/companies");


        if (!response.ok) {

            throw new Error(
                "Failed to load companies."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load companies."
            );

        }


        companies =
            data.companies || [];


        filteredCompanies =
            [...companies];


        /* =============================================
           TOTAL COUNT
        ============================================== */

        if (totalCompanies) {

            totalCompanies.textContent =
                data.total_companies ||
                companies.length;

        }


        /* =============================================
           SECTOR FILTER
        ============================================== */

        populateSectors();


        /* =============================================
           INITIAL SORT
        ============================================== */

        sortCompanies();


        /* =============================================
           RENDER
        ============================================== */

        currentPage = 1;

        renderCompanies();


    } catch (error) {

        console.error(
            "Companies loading error:",
            error
        );


        tableBody.innerHTML = "";


        if (emptyState) {

            emptyState.style.display =
                "block";

            emptyState.innerHTML = `

                <div class="empty-icon">

                    <i class="bi bi-exclamation-circle"></i>

                </div>

                <h3>
                    Unable to load companies
                </h3>

                <p>
                    Please refresh the page and try again.
                </p>

            `;

        }

    } finally {

        if (loading) {
            loading.style.display = "none";
        }

    }

}


/* =====================================================
   POPULATE SECTORS
===================================================== */

function populateSectors() {

    if (!sectorFilter) {
        return;
    }


    const sectors =
        [...new Set(
            companies
                .map(company => company.sector)
                .filter(Boolean)
        )].sort();


    sectorFilter.innerHTML = `

        <option value="all">
            All Sectors
        </option>

    `;


    sectors.forEach(function (sector) {

        const option =
            document.createElement("option");


        option.value =
            sector;


        option.textContent =
            sector;


        sectorFilter.appendChild(option);

    });

}


/* =====================================================
   FILTER COMPANIES
===================================================== */

function filterCompanies() {

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedSector =
        sectorFilter
            ? sectorFilter.value
            : "all";


    filteredCompanies =
        companies.filter(function (company) {


            const symbol =
                String(
                    company.symbol || ""
                ).toLowerCase();


            const sector =
                String(
                    company.sector || ""
                ).toLowerCase();


            const matchesSearch =
                symbol.includes(
                    searchTerm
                );


            const matchesSector =
                selectedSector === "all" ||
                company.sector ===
                selectedSector;


            return (
                matchesSearch &&
                matchesSector
            );

        });


    currentPage = 1;


    sortCompanies();

    renderCompanies();

}


/* =====================================================
   SORT COMPANIES
===================================================== */

function sortCompanies() {

    filteredCompanies.sort(
        function (a, b) {

            let valueA =
                a[currentSort];

            let valueB =
                b[currentSort];


            /* -----------------------------------------
               Text sorting
            ----------------------------------------- */

            if (
                currentSort === "symbol" ||
                currentSort === "sector"
            ) {

                valueA =
                    String(
                        valueA || ""
                    ).toLowerCase();


                valueB =
                    String(
                        valueB || ""
                    ).toLowerCase();


                if (valueA < valueB) {
                    return sortDirection === "asc"
                        ? -1
                        : 1;
                }


                if (valueA > valueB) {
                    return sortDirection === "asc"
                        ? 1
                        : -1;
                }


                return 0;

            }


            /* -----------------------------------------
               Numeric sorting
            ----------------------------------------- */

            valueA =
                Number(valueA || 0);


            valueB =
                Number(valueB || 0);


            return sortDirection === "asc"
                ? valueA - valueB
                : valueB - valueA;

        }
    );

}


/* =====================================================
   UPDATE SORT ICONS
===================================================== */

function updateSortIcons() {

    const headers =
        document.querySelectorAll(
            ".companies-table th[data-sort]"
        );


    headers.forEach(function (header) {

        const icon =
            header.querySelector(
                ".sort-icon"
            );


        if (!icon) {
            return;
        }


        const sortField =
            header.dataset.sort;


        if (
            sortField ===
            currentSort
        ) {

            icon.className =
                sortDirection === "asc"
                    ? "bi bi-chevron-up sort-icon"
                    : "bi bi-chevron-down sort-icon";

        } else {

            icon.className =
                "bi bi-chevron-expand sort-icon";

        }

    });

}


/* =====================================================
   RENDER TABLE
===================================================== */

function renderCompanies() {

    tableBody.innerHTML = "";


    const total =
        filteredCompanies.length;


    /* =============================================
       EMPTY STATE
    ============================================== */

    if (total === 0) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }


        if (resultCount) {
            resultCount.textContent =
                "0";
        }


        if (pageInfo) {

            pageInfo.textContent =
                "Showing 0–0 of 0 companies";

        }


        if (pagination) {
            pagination.innerHTML = "";
        }


        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    /* =============================================
       PAGE CALCULATION
    ============================================== */

    const totalPages =
        Math.ceil(
            total / rowsPerPage
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    const startIndex =
        (currentPage - 1) *
        rowsPerPage;


    const endIndex =
        Math.min(
            startIndex +
            rowsPerPage,
            total
        );


    const pageCompanies =
        filteredCompanies.slice(
            startIndex,
            endIndex
        );


    /* =============================================
       RESULT COUNT
    ============================================== */

    if (resultCount) {

        resultCount.textContent =
            pageCompanies.length;

    }


    /* =============================================
       CREATE ROWS
    ============================================== */

    pageCompanies.forEach(
        function (company) {

            const row =
                createCompanyRow(
                    company
                );


            tableBody.appendChild(
                row
            );

        }
    );


    /* =============================================
       PAGE INFO
    ============================================== */

    if (pageInfo) {

        pageInfo.textContent =
            `Showing ${startIndex + 1}–${endIndex} of ${total} companies`;

    }


    /* =============================================
       PAGINATION
    ============================================== */

    renderPagination(
        totalPages
    );


    /* =============================================
       SORT ICONS
    ============================================== */

    updateSortIcons();

}


/* =====================================================
   CREATE COMPANY ROW
===================================================== */

function createCompanyRow(company) {

    const row =
        document.createElement("tr");


    const symbol =
        company.symbol || "-";


    const sector =
        company.sector || "Others";


    const price =
        Number(
            company.price || 0
        );


    const change =
        Number(
            company.change || 0
        );


    const changePercent =
        Number(
            company.change_percent || 0
        );


    /* =============================================
       CHANGE CLASS
    ============================================== */

    let changeClass =
        "neutral";


    if (change > 0) {

        changeClass =
            "positive";

    }

    else if (change < 0) {

        changeClass =
            "negative";

    }


    /* =============================================
       SECTOR CLASS
    ============================================== */

    const sectorClass =
        getSectorClass(
            sector
        );


    /* =============================================
       ROW HTML
    ============================================== */

    row.innerHTML = `

        <!-- Symbol -->

        <td>

            <span class="stock-symbol">

                ${escapeHtml(symbol)}

            </span>

        </td>


        <!-- Sector -->

        <td>

            <span
                class="sector-badge ${sectorClass}"
            >

                ${escapeHtml(sector)}

            </span>

        </td>


        <!-- Last Price -->

        <td class="price">

            NPR ${price.toFixed(2)}

        </td>


        <!-- Change -->

        <td class="${changeClass}">

            ${formatSigned(change)}

        </td>


        <!-- Change % -->

        <td class="${changeClass}">

            ${formatSigned(changePercent)}%

        </td>


        <!-- Action -->

        <td>

            <button
                type="button"
                class="view-company-btn"
                data-symbol="${escapeHtml(symbol)}"
            >

                <i class="bi bi-arrow-up-right"></i>

                View

            </button>

        </td>

    `;


    return row;

}


/* =====================================================
   SECTOR CLASS
===================================================== */

function getSectorClass(sector) {

    const value =
        sector
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /(^-|-$)/g,
                ""
            );


    return value ||
        "others";

}


/* =====================================================
   SIGNED NUMBER
===================================================== */

function formatSigned(value) {

    if (value > 0) {

        return "+" +
            value.toFixed(2);

    }


    if (value < 0) {

        return value.toFixed(2);

    }


    return "0.00";

}


/* =====================================================
   PAGINATION
===================================================== */

function renderPagination(totalPages) {

    if (!pagination) {
        return;
    }


    pagination.innerHTML = "";


    /* =============================================
       PREVIOUS
    ============================================== */

    const previous =
        document.createElement("button");


    previous.type =
        "button";


    previous.className =
        "pagination-btn";


    previous.innerHTML =
        `<i class="bi bi-chevron-left"></i>`;


    if (currentPage === 1) {

        previous.disabled =
            true;


        previous.classList.add(
            "disabled"
        );

    }


    previous.addEventListener(
        "click",
        function () {

            if (
                currentPage > 1
            ) {

                currentPage--;

                renderCompanies();

            }

        }
    );


    pagination.appendChild(
        previous
    );


    /* =============================================
       PAGE NUMBERS
    ============================================== */

    const maxVisiblePages =
        5;


    let startPage =
        Math.max(
            1,
            currentPage - 2
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxVisiblePages -
            1
        );


    if (
        endPage -
        startPage <
        maxVisiblePages - 1
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxVisiblePages +
                1
            );

    }


    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "pagination-btn";


        button.textContent =
            page;


        if (
            page ===
            currentPage
        ) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            function () {

                currentPage =
                    page;


                renderCompanies();

            }
        );


        pagination.appendChild(
            button
        );

    }


    /* =============================================
       NEXT
    ============================================== */

    const next =
        document.createElement(
            "button"
        );


    next.type =
        "button";


    next.className =
        "pagination-btn";


    next.innerHTML =
        `<i class="bi bi-chevron-right"></i>`;


    if (
        currentPage ===
        totalPages
    ) {

        next.disabled =
            true;


        next.classList.add(
            "disabled"
        );

    }


    next.addEventListener(
        "click",
        function () {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderCompanies();

            }

        }
    );


    pagination.appendChild(
        next
    );

}


/* =====================================================
   TABLE SEARCH
===================================================== */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            if (topSearchInput) {

                topSearchInput.value =
                    searchInput.value;

            }


            filterCompanies();

        }
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

            }


            filterCompanies();

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
   TABLE SORTING
===================================================== */

document.querySelectorAll(
    ".companies-table th[data-sort]"
).forEach(
    function (header) {

        header.addEventListener(
            "click",
            function () {

                const field =
                    header.dataset.sort;


                if (
                    currentSort ===
                    field
                ) {

                    sortDirection =
                        sortDirection ===
                        "asc"
                            ? "desc"
                            : "asc";

                } else {

                    currentSort =
                        field;

                    sortDirection =
                        "asc";

                }


                sortCompanies();

                currentPage =
                    1;

                renderCompanies();

            }
        );

    }
);


/* =====================================================
   VIEW COMPANY
===================================================== */

tableBody.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                ".view-company-btn"
            );


        if (!button) {
            return;
        }


        const symbol =
            button.dataset.symbol;


        if (!symbol) {
            return;
        }


        /* -----------------------------------------
           Open company detail page
        ------------------------------------------ */

        window.location.href =
            `/companies/${encodeURIComponent(symbol)}`;

    }
);


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   START
===================================================== */

loadCompanies();


});
