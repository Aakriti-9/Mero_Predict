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
                item.setAttribute("aria-selected", "false");
            });

            // Hide all panels
            panels.forEach(function (panel) {
                panel.hidden = true;
            });

            // Activate selected tab
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");

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
       CSV FILE UPLOAD UI
    ===================================================== */

    const dropzone = document.getElementById("csvDropzone");
    const fileInput = document.getElementById("csvFileInput");

    if (!dropzone || !fileInput) {
        return;
    }


    /* -----------------------------------------------------
       Open file browser when dropzone is clicked
    ----------------------------------------------------- */

    dropzone.addEventListener("click", function () {

        fileInput.click();

    });


    /* -----------------------------------------------------
       File selected through file browser
    ----------------------------------------------------- */

    fileInput.addEventListener("change", function () {

        if (fileInput.files.length > 0) {

            handleFile(fileInput.files[0]);

        }

    });


    /* -----------------------------------------------------
       Drag over
    ----------------------------------------------------- */

    dropzone.addEventListener("dragover", function (event) {

        event.preventDefault();

        dropzone.classList.add("dragover");

    });


    /* -----------------------------------------------------
       Drag leave
    ----------------------------------------------------- */

    dropzone.addEventListener("dragleave", function () {

        dropzone.classList.remove("dragover");

    });


    /* -----------------------------------------------------
       Drop file
    ----------------------------------------------------- */

    dropzone.addEventListener("drop", function (event) {

        event.preventDefault();

        dropzone.classList.remove("dragover");

        const files = event.dataTransfer.files;

        if (files.length > 0) {

            handleFile(files[0]);

        }

    });


    /* =====================================================
       FILE VALIDATION
    ===================================================== */

    function handleFile(file) {

        const maxSize = 50 * 1024 * 1024; // 50 MB

        const fileName = file.name.toLowerCase();

        // Check file type
        if (!fileName.endsWith(".csv")) {

            showFileMessage(
                "Please select a CSV file.",
                "error"
            );

            fileInput.value = "";

            return;
        }


        // Check file size
        if (file.size > maxSize) {

            showFileMessage(
                "File size must be less than 50 MB.",
                "error"
            );

            fileInput.value = "";

            return;
        }


        // File is valid
        showFileMessage(
            file.name,
            "success"
        );

        console.log("Selected CSV:", file);

    }


    /* =====================================================
       UPDATE DROPZONE MESSAGE
    ===================================================== */

    function showFileMessage(message, type) {

        const icon = dropzone.querySelector("i");
        const heading = dropzone.querySelector("h3");
        const paragraph = dropzone.querySelector("p");


        if (type === "success") {

            icon.className = "bi bi-file-earmark-check";

            heading.textContent = "CSV file selected";

            paragraph.textContent = message;

            dropzone.classList.add("file-selected");

        } else {

            icon.className = "bi bi-exclamation-circle";

            heading.textContent = "Invalid file";

            paragraph.textContent = message;

            dropzone.classList.remove("file-selected");

        }

    }

});