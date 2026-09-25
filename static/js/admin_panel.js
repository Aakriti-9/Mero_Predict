document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       TAB SWITCHING
    ===================================================== */

    const tabs = document.querySelectorAll(".admin-tab");
    const panels = document.querySelectorAll(".admin-tab-panel");

    tabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            const selectedTab = tab.dataset.tab;

            // Remove active state from all tabs
            tabs.forEach(function (item) {

                item.classList.remove("active");

                item.setAttribute(
                    "aria-selected",
                    "false"
                );

            });

            // Hide all panels
            panels.forEach(function (panel) {

                panel.hidden = true;

            });

            // Activate selected tab
            tab.classList.add("active");

            tab.setAttribute(
                "aria-selected",
                "true"
            );

            // Show selected panel
            const selectedPanel = document.getElementById(
                "tab-" + selectedTab
            );

            if (selectedPanel) {

                selectedPanel.hidden = false;

            }

        });

    });


    /* =====================================================
       LOAD REAL ADMIN STATISTICS
    ===================================================== */

    function loadAdminStats() {

        fetch("/admin/api/stats")

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Failed to load admin statistics."
                );

            }

            return response.json();

        })

        .then(function (data) {

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Could not load admin statistics."
                );

            }


            /* =================================================
               UPDATE STATISTICS CARDS
            ================================================= */

            const totalCompanies =
                document.getElementById(
                    "totalCompanies"
                );

            const modelAccuracy =
                document.getElementById(
                    "modelAccuracy"
                );

            const trainingSamples =
                document.getElementById(
                    "trainingSamples"
                );

            const lastUpdated =
                document.getElementById(
                    "lastUpdated"
                );


            // Total companies
            if (totalCompanies) {

                totalCompanies.textContent =
                    Number(
                        data.total_companies
                    ).toLocaleString();

            }


            // Model accuracy
            if (modelAccuracy) {

                modelAccuracy.textContent =
                    Number(
                        data.model_accuracy
                    ).toFixed(2) + "%";

            }


            // Training samples
            if (trainingSamples) {

                trainingSamples.textContent =
                    Number(
                        data.training_samples
                    ).toLocaleString();

            }


            // Latest uploaded/trading date
            if (lastUpdated) {

                lastUpdated.textContent =
                    formatDate(
                        data.latest_date
                    );

            }


            /* =================================================
               UPDATE RECENT UPLOADS TABLE
            ================================================= */

            updateRecentUploads(
                data.recent_uploads
            );

        })

        .catch(function (error) {

            console.error(
                "Admin statistics error:",
                error
            );

        });

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {

            return "N/A";

        }


        const date =
            new Date(
                dateString + "T00:00:00"
            );


        if (isNaN(date.getTime())) {

            return dateString;

        }


        return date.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    }


    /* =====================================================
       UPDATE RECENT UPLOADS
    ===================================================== */

    function updateRecentUploads(uploads) {

        const tableBody =
            document.querySelector(
                "#recentUploadsTable tbody"
            );


        if (!tableBody) {

            return;

        }


        // Clear old rows
        tableBody.innerHTML = "";


        /* =================================================
           NO UPLOADS
        ================================================= */

        if (
            !uploads ||
            uploads.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="4">
                        No recent uploads found.
                    </td>

                </tr>
            `;

            return;

        }


        /* =================================================
           CREATE ROWS
        ================================================= */

        uploads.forEach(function (upload) {

            const row =
                document.createElement("tr");


            /*
             * The database currently stores the trade date,
             * not the original uploaded filename.
             *
             * Therefore the filename is generated from
             * the trade date.
             */

            const generatedFileName =
                upload.date
                    ? `NEPSE_${upload.date.replaceAll("-", "_")}.csv`
                    : "NEPSE_data.csv";


            row.innerHTML = `

                <td>
                    ${formatDate(upload.date)}
                </td>


                <td>
                    ${generatedFileName}
                </td>


                <td>
                    ${Number(
                        upload.records || 0
                    ).toLocaleString()}
                </td>


                <td>

                    <span class="status-badge status-success">

                        <i class="bi bi-check-circle-fill"></i>

                        ${upload.status || "Success"}

                    </span>

                </td>

            `;


            tableBody.appendChild(row);

        });

    }


    /* =====================================================
       LOAD ADMIN STATS
    ===================================================== */

    loadAdminStats();


    /* =====================================================
       CSV FILE UPLOAD
    ===================================================== */

    const dropzone =
        document.getElementById("csvDropzone");

    const fileInput =
        document.getElementById("csvFileInput");


    if (!dropzone || !fileInput) {

        return;

    }


    /* =====================================================
       OPEN FILE BROWSER
    ===================================================== */

    dropzone.addEventListener("click", function () {

        fileInput.click();

    });


    /* =====================================================
       FILE SELECTED FROM BROWSER
    ===================================================== */

    fileInput.addEventListener("change", function () {

        const files =
            fileInput.files;


        if (files.length === 0) {

            return;

        }


        handleFiles(files);

    });


    /* =====================================================
       DRAG OVER
    ===================================================== */

    dropzone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            dropzone.classList.add(
                "dragover"
            );

        }
    );


    /* =====================================================
       DRAG LEAVE
    ===================================================== */

    dropzone.addEventListener(
        "dragleave",
        function () {

            dropzone.classList.remove(
                "dragover"
            );

        }
    );


    /* =====================================================
       DROP FILES
    ===================================================== */

    dropzone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            dropzone.classList.remove(
                "dragover"
            );


            const files =
                event.dataTransfer.files;


            if (files.length === 0) {

                return;

            }


            handleFiles(files);

        }
    );


    /* =====================================================
       HANDLE MULTIPLE FILES
    ===================================================== */

    function handleFiles(files) {

        const maxSize =
            50 * 1024 * 1024; // 50 MB


        const validFiles = [];

        const invalidFiles = [];


        // Validate every selected file
        for (const file of files) {

            const fileName =
                file.name.toLowerCase();


            /* =============================================
               CHECK CSV EXTENSION
            ============================================= */

            if (!fileName.endsWith(".csv")) {

                invalidFiles.push(
                    `${file.name}: Not a CSV file`
                );

                continue;

            }


            /* =============================================
               CHECK FILE SIZE
            ============================================= */

            if (file.size > maxSize) {

                invalidFiles.push(
                    `${file.name}: Larger than 50 MB`
                );

                continue;

            }


            validFiles.push(file);

        }


        /* =================================================
           NO VALID FILES
        ================================================= */

        if (validFiles.length === 0) {

            showFileMessage(
                "No valid CSV files selected.",
                "error"
            );


            fileInput.value = "";

            return;

        }


        /* =================================================
           SHOW SELECTED FILES
        ================================================= */

        showSelectedFiles(
            validFiles
        );


        /* =================================================
           SHOW INVALID FILES IN CONSOLE
        ================================================= */

        if (invalidFiles.length > 0) {

            console.warn(
                "Invalid files:",
                invalidFiles
            );

        }


        /* =================================================
           UPLOAD VALID FILES
        ================================================= */

        uploadFiles(
            validFiles
        );

    }


    /* =====================================================
       SHOW SELECTED FILES
    ===================================================== */

    function showSelectedFiles(files) {

        const icon =
            dropzone.querySelector("i");

        const heading =
            dropzone.querySelector("h3");

        const paragraph =
            dropzone.querySelector("p");


        /* =================================================
           CHANGE ICON
        ================================================= */

        icon.className =
            "bi bi-file-earmark-check";


        /* =================================================
           SINGLE FILE
        ================================================= */

        if (files.length === 1) {

            heading.textContent =
                "CSV file selected";


            paragraph.textContent =
                files[0].name;

        }


        /* =================================================
           MULTIPLE FILES
        ================================================= */

        else {

            heading.textContent =
                `${files.length} CSV files selected`;


            paragraph.textContent =
                "Preparing files for upload...";

        }


        dropzone.classList.add(
            "file-selected"
        );

    }


    /* =====================================================
       UPLOAD FILES TO FLASK
    ===================================================== */

    function uploadFiles(files) {

        const formData =
            new FormData();


        /* =================================================
           ADD EVERY FILE
        ================================================= */

        files.forEach(function (file) {

            formData.append(
                "files",
                file
            );

        });


        const heading =
            dropzone.querySelector("h3");

        const paragraph =
            dropzone.querySelector("p");


        /* =================================================
           UPLOAD MESSAGE
        ================================================= */

        heading.textContent =
            `Uploading ${files.length} file(s)...`;


        paragraph.textContent =
            "Please wait while the data is imported.";


        /* =================================================
           SEND TO FLASK
        ================================================= */

        fetch(
            "/admin/upload",
            {
                method: "POST",
                body: formData
            }
        )

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Upload request failed."
                );

            }

            return response.text();

        })

        .then(function () {

            /* =============================================
               SUCCESS MESSAGE
            ============================================= */

            showFileMessage(
                `${files.length} file(s) uploaded successfully.`,
                "success"
            );


            /* =============================================
               RELOAD PAGE
            ============================================= */

            setTimeout(function () {

                window.location.reload();

            }, 1000);

        })

        .catch(function (error) {

            console.error(
                "Upload error:",
                error
            );


            showFileMessage(
                "Upload failed. Please try again.",
                "error"
            );

        });

    }


    /* =====================================================
       UPDATE DROPZONE MESSAGE
    ===================================================== */

    function showFileMessage(
        message,
        type
    ) {

        const icon =
            dropzone.querySelector("i");

        const heading =
            dropzone.querySelector("h3");

        const paragraph =
            dropzone.querySelector("p");


        /* =================================================
           SUCCESS
        ================================================= */

        if (type === "success") {

            icon.className =
                "bi bi-check-circle-fill";


            heading.textContent =
                "Upload successful";


            paragraph.textContent =
                message;


            dropzone.classList.add(
                "file-selected"
            );

        }


        /* =================================================
           ERROR
        ================================================= */

        else {

            icon.className =
                "bi bi-exclamation-circle";


            heading.textContent =
                "Upload failed";


            paragraph.textContent =
                message;


            dropzone.classList.remove(
                "file-selected"
            );

        }

    }

});

