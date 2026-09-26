/* =========================================================
   MERO-PREDICT
   ADMIN PANEL JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Mero-Predict Admin Panel JS loaded.");

    /* =====================================================
       HELPER FUNCTIONS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }

    function getTableBody(tableId) {
        const table = getElement(tableId);

        if (!table) {
            return null;
        }

        return table.querySelector("tbody");
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatNumber(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "0";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return escapeHTML(value);
        }

        return number.toLocaleString();
    }

    function formatDate(value) {

        if (!value) {
            return "N/A";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(value);
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    async function fetchJSON(url, options = {}) {

        const response = await fetch(url, {
            ...options,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                ...(options.headers || {})
            }
        });

        let data = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {

            try {
                data = await response.json();
            } catch (error) {
                data = null;
            }
        }

        if (!response.ok) {

            throw new Error(
                data?.message ||
                `Request failed: ${response.status}`
            );
        }

        return data;
    }

    function setText(id, value) {

        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }

    
    /* =====================================================
        TAB SYSTEM
    ===================================================== */

    function initializeTabs() {

        const tabs = document.querySelectorAll(".admin-tab");
        const panels = document.querySelectorAll(".admin-tab-panel");

        if (!tabs.length) {
            console.error("No admin tabs found.");
            return;
        }

        if (!panels.length) {
            console.error("No admin tab panels found.");
            return;
        }

        console.log(
            "Admin tabs found:",
            tabs.length,
            "Panels found:",
            panels.length
        );

        tabs.forEach(function (tab) {

            tab.addEventListener("click", function () {

                const target = tab.getAttribute("data-tab");

                console.log("Admin tab clicked:", target);

                if (!target) {
                    console.error(
                        "This tab does not have a data-tab:",
                        tab
                    );
                    return;
                }

                const targetPanelId = `tab-${target}`;

                const targetPanel =
                    document.getElementById(targetPanelId);

                if (!targetPanel) {

                    console.error(
                        "Target panel not found:",
                        targetPanelId
                    );

                    return;
                }

                /* -----------------------------------------
                    Update tab buttons
                ----------------------------------------- */

                 tabs.forEach(function (item) {

                    const isActive =
                        item === tab;

                    item.classList.toggle(
                        "active",
                        isActive
                    );

                    item.setAttribute(
                        "aria-selected",
                        isActive ? "true" : "false"
                    );
                });


                /* -----------------------------------------
                    Show correct panel
                ----------------------------------------- */

                panels.forEach(function (panel) {

                    panel.hidden =
                     panel !== targetPanel;

                });


                /* -----------------------------------------
                Load tab-specific data
                ----------------------------------------- */

                if (target === "companies") {

                    loadCompanies();

                } else if (target === "train") {

                    loadModelInformation();

                } else if (target === "stats") {

                    loadDataStatistics();

                }

            });

        });

    }


    /* =====================================================
       DASHBOARD STATISTICS
       GET /admin/api/stats
       ===================================================== */

    async function loadAdminStats() {

        try {

            const data =
                await fetchJSON(
                    "/admin/api/stats"
                );

            if (!data || !data.success) {

                throw new Error(
                    data?.message ||
                    "Unable to load statistics."
                );
            }

            setText(
                "totalCompanies",
                formatNumber(
                    data.total_companies
                )
            );

            if (
                data.model_accuracy === null ||
                data.model_accuracy === undefined
            ) {

                setText(
                    "modelAccuracy",
                    "N/A"
                );

            } else {

                setText(
                    "modelAccuracy",
                    `${(
                        Number(
                            data.model_accuracy
                        ) * 100
                    ).toFixed(2)}%`
                );
            }

            setText(
                "trainingSamples",
                formatNumber(
                    data.training_samples
                )
            );

            setText(
                "lastUpdated",
                formatDate(
                    data.latest_date
                )
            );

            renderRecentUploads(
                data.recent_uploads || []
            );

        } catch (error) {

            console.error(
                "Error loading admin statistics:",
                error
            );

            setText(
                "totalCompanies",
                "N/A"
            );

            setText(
                "modelAccuracy",
                "N/A"
            );

            setText(
                "trainingSamples",
                "N/A"
            );

            setText(
                "lastUpdated",
                "N/A"
            );

            renderRecentUploads([]);
        }
    }


    /* =====================================================
       RECENT UPLOADS
       ===================================================== */

    function renderRecentUploads(uploads) {

        const tbody =
            getTableBody(
                "recentUploadsTable"
            );

        if (!tbody) {
            return;
        }

        if (!uploads.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No recent uploads found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            uploads.map(
                function (upload) {

                    const status =
                        upload.status ||
                        "Unknown";

                    let statusClass =
                        "status-pending";

                    if (
                        status.toLowerCase() ===
                        "success"
                    ) {

                        statusClass =
                            "status-success";

                    } else if (
                        status.toLowerCase() ===
                        "failed"
                    ) {

                        statusClass =
                            "status-danger";
                    }

                    return `
                        <tr>

                            <td>
                                ${formatDate(
                                    upload.date
                                )}
                            </td>

                            <td>
                                NEPSE CSV
                            </td>

                            <td>
                                ${formatNumber(
                                    upload.records
                                )}
                            </td>

                            <td>
                                <span
                                    class="upload-status ${statusClass}"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       COMPANY MANAGEMENT
       GET /admin/api/companies
       ===================================================== */

    let companiesData = [];

    let companiesLoaded = false;


    async function loadCompanies() {

        const tbody =
            getTableBody(
                "companiesTable"
            );

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Loading companies...
                    </td>
                </tr>
            `;
        }

        try {

            const data =
                await fetchJSON(
                    "/admin/api/companies"
                );

            if (
                !data ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    "Unable to load companies."
                );
            }

            companiesData =
                Array.isArray(
                    data.companies
                )
                    ? data.companies
                    : [];

            companiesLoaded = true;

            console.log(
                "Companies loaded:",
                companiesData.length
            );

            populateSectorFilter(
                companiesData
            );

            applyCompanyFilters();

        } catch (error) {

            console.error(
                "Error loading companies:",
                error
            );

            companiesData = [];

            companiesLoaded = false;

            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            Unable to load companies.
                        </td>
                    </tr>
                `;
            }

            setText(
                "companyCount",
                "0"
            );
        }
    }


    /* =====================================================
       RENDER COMPANIES
       ===================================================== */

    function renderCompanies(companies) {

        const tbody =
            getTableBody(
                "companiesTable"
            );

        if (!tbody) {

            console.warn(
                "Companies table body not found."
            );

            return;
        }

        const emptyState =
            getElement(
                "companyEmptyState"
            );

        if (!companies.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No companies found.
                    </td>
                </tr>
            `;

            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        tbody.innerHTML =
            companies.map(
                function (company) {

                    const status =
                        company.status ||
                        "Active";

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        company.symbol
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    company.sector ||
                                    "N/A"
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    company.records
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    company.first_date
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    company.latest_date
                                )}
                            </td>

                            <td>
                                <span
                                    class="upload-status status-success"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       COMPANY SEARCH
       ===================================================== */

    function initializeCompanySearch() {

        const search =
            getElement(
                "companySearch"
            );

        if (!search) {

            console.error(
                "companySearch element not found."
            );

            return;
        }

        console.log(
            "Company search initialized."
        );

        search.addEventListener(
            "input",
            function () {

                console.log(
                    "Company search:",
                    search.value
                );

                applyCompanyFilters();
            }
        );
    }


    /* =====================================================
       SECTOR FILTER
       ===================================================== */

    function initializeSectorFilter() {

        const filter =
            getElement(
                "sectorFilter"
            );

        if (!filter) {

            console.error(
                "sectorFilter element not found."
            );

            return;
        }

        console.log(
            "Sector filter initialized."
        );

        filter.addEventListener(
            "change",
            function () {

                console.log(
                    "Sector selected:",
                    filter.value
                );

                applyCompanyFilters();
            }
        );
    }


    /* =====================================================
       POPULATE SECTOR FILTER
       ===================================================== */

    function populateSectorFilter(
        companies
    ) {

        const filter =
            getElement(
                "sectorFilter"
            );

        if (!filter) {
            return;
        }

        const currentValue =
            filter.value || "all";

        const sectors = [
            ...new Set(
                companies.map(
                    function (company) {

                        return (
                            company.sector ||
                            "N/A"
                        );
                    }
                )
            )
        ].sort(
            function (a, b) {

                return String(a).localeCompare(
                    String(b)
                );
            }
        );

        filter.innerHTML = `
            <option value="all">
                All Sectors
            </option>

            ${sectors.map(
                function (sector) {

                    return `
                        <option
                            value="${escapeHTML(
                                sector
                            )}"
                        >
                            ${escapeHTML(
                                sector
                            )}
                        </option>
                    `;
                }
            ).join("")}
        `;

        const optionExists =
            Array.from(
                filter.options
            ).some(
                function (option) {

                    return (
                        option.value ===
                        currentValue
                    );
                }
            );

        if (optionExists) {
            filter.value = currentValue;
        } else {
            filter.value = "all";
        }
    }


    /* =====================================================
       APPLY SEARCH + SECTOR FILTER
       ===================================================== */

    function applyCompanyFilters() {

        const search =
            getElement(
                "companySearch"
            );

        const filter =
            getElement(
                "sectorFilter"
            );

        const searchValue =
            search
                ? search.value
                    .trim()
                    .toLowerCase()
                : "";

        const sectorValue =
            filter
                ? filter.value
                : "all";

        console.log(
            "Applying company filters:",
            {
                search: searchValue,
                sector: sectorValue,
                total: companiesData.length
            }
        );

        if (!companiesLoaded) {

            console.log(
                "Company data is not loaded yet."
            );

            return;
        }

        const filteredCompanies =
            companiesData.filter(
                function (company) {

                    const symbol =
                        String(
                            company.symbol ||
                            ""
                        )
                            .trim()
                            .toLowerCase();

                    const name =
                        String(
                            company.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase();

                    const sector =
                        String(
                            company.sector ||
                            "N/A"
                        )
                            .trim();

                    const matchesSearch =
                        searchValue === "" ||
                        symbol.includes(
                            searchValue
                        ) ||
                        name.includes(
                            searchValue
                        );

                    const matchesSector =
                        sectorValue === "all" ||
                        sector ===
                        sectorValue;

                    return (
                        matchesSearch &&
                        matchesSector
                    );
                }
            );

        console.log(
            "Filtered companies:",
            filteredCompanies.length
        );

        renderCompanies(
            filteredCompanies
        );

        setText(
            "companyCount",
            formatNumber(
                filteredCompanies.length
            )
        );
    }


    /* =====================================================
       MODEL INFORMATION
       GET /admin/api/model
       ===================================================== */

    async function loadModelInformation() {

        try {

            const data =
                await fetchJSON(
                    "/admin/api/model"
                );

            if (
                !data ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    "Unable to load model."
                );
            }

            updateMetric(
                "trainAccuracy",
                "accuracyBar",
                data.accuracy
            );

            updateMetric(
                "trainPrecision",
                "precisionBar",
                data.precision
            );

            updateMetric(
                "trainRecall",
                "recallBar",
                data.recall
            );

            updateMetric(
                "trainF1",
                "f1Bar",
                data.f1
            );

            updateMetric(
                "trainRocAuc",
                "rocAucBar",
                data.roc_auc
            );

        } catch (error) {

            console.error(
                "Error loading model information:",
                error
            );

            updateMetric(
                "trainAccuracy",
                "accuracyBar",
                null
            );

            updateMetric(
                "trainPrecision",
                "precisionBar",
                null
            );

            updateMetric(
                "trainRecall",
                "recallBar",
                null
            );

            updateMetric(
                "trainF1",
                "f1Bar",
                null
            );

            updateMetric(
                "trainRocAuc",
                "rocAucBar",
                null
            );
        }
    }


    /* =====================================================
       UPDATE MODEL METRIC
       ===================================================== */

    function updateMetric(
        textId,
        barId,
        value
    ) {

        const textElement =
            getElement(textId);

        const barElement =
            getElement(barId);

        if (
            value === null ||
            value === undefined ||
            Number.isNaN(
                Number(value)
            )
        ) {

            if (textElement) {
                textElement.textContent =
                    "N/A";
            }

            if (barElement) {
                barElement.style.width =
                    "0%";
            }

            return;
        }

        const percentage =
            Number(value) * 100;

        if (textElement) {

            textElement.textContent =
                `${percentage.toFixed(2)}%`;
        }

        if (barElement) {

            barElement.style.width =
                `${Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                )}%`;
        }
    }


    /* =====================================================
       TRAIN MODEL
       POST /admin/api/train-model
       ===================================================== */

    function initializeTraining() {

        const button =
            document.querySelector(
                ".btn-start-training"
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            startTraining
        );
    }


    async function startTraining(event) {

        event.preventDefault();

        const button =
            event.currentTarget;

        const status =
            getElement(
                "trainingStatus"
            );

        const originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
            ></span>
            Training...
        `;

        if (status) {

            status.hidden = false;

            status.classList.remove(
                "success",
                "error"
            );

            const spinner =
                status.querySelector(
                    ".training-spinner"
                );

            if (spinner) {
                spinner.style.display = "";
            }

            const strong =
                status.querySelector(
                    "strong"
                );

            const paragraph =
                status.querySelector(
                    "p"
                );

            if (strong) {

                strong.textContent =
                    "Starting model training...";
            }

            if (paragraph) {

                paragraph.textContent =
                    "Please wait while the model is being trained.";
            }
        }

        try {

            const response =
                await fetch(
                    "/admin/api/train-model",
                    {
                        method: "POST",
                        headers: {
                            "X-Requested-With":
                                "XMLHttpRequest"
                        }
                    }
                );

            let data = null;

            try {

                data =
                    await response.json();

            } catch (error) {

                data = null;
            }

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    `Training failed (${response.status}).`
                );
            }

            if (
                !data ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    "Model training was not completed."
                );
            }

            if (status) {

                status.classList.remove(
                    "error"
                );

                status.classList.add(
                    "success"
                );

                const spinner =
                    status.querySelector(
                        ".training-spinner"
                    );

                if (spinner) {
                    spinner.style.display =
                        "none";
                }

                const strong =
                    status.querySelector(
                        "strong"
                    );

                const paragraph =
                    status.querySelector(
                        "p"
                    );

                if (strong) {

                    strong.textContent =
                        "Model training completed.";
                }

                if (paragraph) {

                    paragraph.textContent =
                        data.message ||
                        "Model trained and saved successfully.";
                }
            }

            updateMetric(
                "trainAccuracy",
                "accuracyBar",
                data.accuracy
            );

            updateMetric(
                "trainPrecision",
                "precisionBar",
                data.precision
            );

            updateMetric(
                "trainRecall",
                "recallBar",
                data.recall
            );

            updateMetric(
                "trainF1",
                "f1Bar",
                data.f1
            );

            updateMetric(
                "trainRocAuc",
                "rocAucBar",
                data.roc_auc
            );

            if (
                data.accuracy !== null &&
                data.accuracy !== undefined
            ) {

                setText(
                    "modelAccuracy",
                    `${(
                        Number(
                            data.accuracy
                        ) * 100
                    ).toFixed(2)}%`
                );
            }

        } catch (error) {

            console.error(
                "Training error:",
                error
            );

            if (status) {

                status.classList.remove(
                    "success"
                );

                status.classList.add(
                    "error"
                );

                const spinner =
                    status.querySelector(
                        ".training-spinner"
                    );

                if (spinner) {
                    spinner.style.display =
                        "none";
                }

                const strong =
                    status.querySelector(
                        "strong"
                    );

                const paragraph =
                    status.querySelector(
                        "p"
                    );

                if (strong) {

                    strong.textContent =
                        "Training failed.";
                }

                if (paragraph) {

                    paragraph.textContent =
                        error.message;
                }
            }

        } finally {

            button.disabled = false;
            button.innerHTML =
                originalText;
        }
    }


    /* =====================================================
       DATA STATISTICS
       GET /admin/api/data-statistics
       ===================================================== */

    async function loadDataStatistics() {

        try {

            const data =
                await fetchJSON(
                    "/admin/api/data-statistics"
                );

            if (
                !data ||
                !data.success
            ) {

                throw new Error(
                    data?.message ||
                    "Unable to load statistics."
                );
            }

            setText(
                "totalTradingDays",
                formatNumber(
                    data.total_trading_days
                )
            );

            setText(
                "totalPriceRecords",
                formatNumber(
                    data.total_price_records
                )
            );

            setText(
                "statsCompanyCount",
                formatNumber(
                    data.total_companies
                )
            );

            setText(
                "firstTradingDate",
                formatDate(
                    data.first_trading_date
                )
            );

            setText(
                "latestTradingDate",
                formatDate(
                    data.latest_trading_date
                )
            );

            setText(
                "totalSectors",
                formatNumber(
                    data.total_sectors
                )
            );

            renderSectorStatistics(
                data.sectors || []
            );

            renderFeatureImportance(
                data.feature_importance || []
            );

        } catch (error) {

            console.error(
                "Error loading data statistics:",
                error
            );

            setText(
                "totalTradingDays",
                "N/A"
            );

            setText(
                "totalPriceRecords",
                "N/A"
            );

            setText(
                "statsCompanyCount",
                "N/A"
            );

            setText(
                "firstTradingDate",
                "N/A"
            );

            setText(
                "latestTradingDate",
                "N/A"
            );

            setText(
                "totalSectors",
                "N/A"
            );

            renderSectorStatistics([]);
            renderFeatureImportance([]);
        }
    }


    /* =====================================================
       SECTOR STATISTICS
       ===================================================== */

    function renderSectorStatistics(
        sectors
    ) {

        const table =
            getElement(
                "sectorStatsTable"
            );

        if (!table) {
            return;
        }

        const tbody =
            table.querySelector(
                "tbody"
            );

        if (!tbody) {
            return;
        }

        if (!sectors.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No sector statistics available.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            sectors.map(
                function (sector) {

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    sector.sector ||
                                    sector.name ||
                                    "N/A"
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    sector.companies ||
                                    sector.company_count ||
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    sector.records ||
                                    sector.record_count ||
                                    0
                                )}
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       FEATURE IMPORTANCE
       ===================================================== */

    function renderFeatureImportance(
        features
    ) {

        const container =
            getElement(
                "featureImportanceList"
            );

        if (!container) {
            return;
        }

        if (!features.length) {

            container.innerHTML = `
                <div class="feature-loading">

                    <i class="bi bi-bar-chart"></i>

                    <span>
                        No feature importance data available.
                    </span>

                </div>
            `;

            return;
        }

        container.innerHTML =
            features.map(
                function (feature) {

                    const name =
                        feature.feature ||
                        feature.name ||
                        "Unknown";

                    const importance =
                        Number(
                            feature.importance ||
                            0
                        );

                    const percentage =
                        importance * 100;

                    return `
                        <div
                            class="feature-importance-item"
                        >

                            <div
                                class="feature-info"
                            >

                                <span
                                    class="feature-name"
                                >
                                    ${escapeHTML(
                                        name
                                    )}
                                </span>

                                <span
                                    class="feature-value"
                                >
                                    ${percentage.toFixed(2)}%
                                </span>

                            </div>

                            <div
                                class="feature-progress"
                            >

                                <div
                                    class="feature-progress-bar"
                                    style="width:${Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            percentage
                                        )
                                    )}%"
                                ></div>

                            </div>

                        </div>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       CSV UPLOAD
       POST /admin/upload
       ===================================================== */

    function initializeUpload() {

        const dropzone =
            getElement(
                "csvDropzone"
            );

        const fileInput =
            getElement(
                "csvFileInput"
            );

        if (
            !dropzone ||
            !fileInput
        ) {
            return;
        }

        dropzone.addEventListener(
            "click",
            function (event) {

                if (
                    event.target !==
                    fileInput
                ) {

                    fileInput.click();
                }
            }
        );

        fileInput.addEventListener(
            "change",
            async function () {

                if (
                    fileInput.files &&
                    fileInput.files.length
                ) {

                    await uploadFiles(
                        fileInput.files
                    );
                }
            }
        );

        dropzone.addEventListener(
            "dragover",
            function (event) {

                event.preventDefault();

                dropzone.classList.add(
                    "dragover"
                );
            }
        );

        dropzone.addEventListener(
            "dragleave",
            function () {

                dropzone.classList.remove(
                    "dragover"
                );
            }
        );

        dropzone.addEventListener(
            "drop",
            async function (event) {

                event.preventDefault();

                dropzone.classList.remove(
                    "dragover"
                );

                const files =
                    event.dataTransfer.files;

                if (
                    files &&
                    files.length
                ) {

                    await uploadFiles(
                        files
                    );
                }
            }
        );
    }


    /* =====================================================
       UPLOAD FILES
       ===================================================== */

    async function uploadFiles(
        files
    ) {

        const fileArray =
            Array.from(files);

        const validFiles =
            fileArray.filter(
                function (file) {

                    const isCSV =
                        file.name
                            .toLowerCase()
                            .endsWith(
                                ".csv"
                            );

                    const maxSize =
                        50 * 1024 * 1024;

                    return (
                        isCSV &&
                        file.size <=
                        maxSize
                    );
                }
            );

        if (!validFiles.length) {

            alert(
                "Please select a valid CSV file under 50MB."
            );

            return;
        }

        const dropzone =
            getElement(
                "csvDropzone"
            );

        if (dropzone) {

            dropzone.classList.add(
                "uploading"
            );

            const heading =
                dropzone.querySelector(
                    "h3"
                );

            if (heading) {

                heading.textContent =
                    "Uploading CSV data...";
            }
        }

        const formData =
            new FormData();

        validFiles.forEach(
            function (file) {

                formData.append(
                    "files",
                    file
                );
            }
        );

        try {

            const response =
                await fetch(
                    "/admin/upload",
                    {
                        method: "POST",
                        body: formData,
                        headers: {
                            "X-Requested-With":
                                "XMLHttpRequest"
                        }
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Upload failed (${response.status}).`
                );
            }

            window.location.reload();

        } catch (error) {

            console.error(
                "CSV upload error:",
                error
            );

            alert(
                error.message ||
                "CSV upload failed."
            );

            if (dropzone) {

                dropzone.classList.remove(
                    "uploading"
                );

                const heading =
                    dropzone.querySelector(
                        "h3"
                    );

                if (heading) {

                    heading.textContent =
                        "Drop CSV file here or click to browse";
                }
            }
        }
    }


    /* =====================================================
       INITIALIZE EVERYTHING
       ===================================================== */

    initializeTabs();

    initializeUpload();

    initializeCompanySearch();

    initializeSectorFilter();

    initializeTraining();


    /* =====================================================
       LOAD INITIAL DATA
       ===================================================== */

    loadAdminStats();

});

