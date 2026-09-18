// Get all the tab buttons and put them in a list
var tabButtons = document.querySelectorAll(".admin-tab");

// Get each panel individually (plain and simple)
var uploadPanel = document.getElementById("tab-upload");
var companiesPanel = document.getElementById("tab-companies");
var trainPanel = document.getElementById("tab-train");
var statsPanel = document.getElementById("tab-stats");

// Run this function every time any tab button is clicked
function handleTabClick(event) {

    var clickedTab = event.currentTarget; // the button that was clicked
    var tabName = clickedTab.getAttribute("data-tab"); // "upload", "companies", "train", or "stats"

    // Step 1: remove "active" class from every tab
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Step 2: add "active" class to the one that was clicked
    clickedTab.classList.add("active");

    // Step 3: hide every panel
    uploadPanel.hidden = true;
    companiesPanel.hidden = true;
    trainPanel.hidden = true;
    statsPanel.hidden = true;

    // Step 4: show only the matching panel
    if (tabName === "upload") {
        uploadPanel.hidden = false;
    } else if (tabName === "companies") {
        companiesPanel.hidden = false;
    } else if (tabName === "train") {
        trainPanel.hidden = false;
    } else if (tabName === "stats") {
        statsPanel.hidden = false;
    }
}

// Attach the click handler to every tab button
for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener("click", handleTabClick);
}


// -----------------------------
// Drop zone (upload box)
// -----------------------------

var dropzone = document.getElementById("csvDropzone");
var fileInput = document.getElementById("csvFileInput");

// Clicking the styled box opens the real (hidden) file picker
dropzone.addEventListener("click", function () {
    fileInput.click();
});

// When a file is dragged over the box, highlight it
dropzone.addEventListener("dragover", function (event) {
    event.preventDefault(); // needed or the browser blocks the drop
    dropzone.classList.add("dragover");
});

// When the drag leaves the box, remove the highlight
dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("dragover");
});

// When a file is actually dropped
dropzone.addEventListener("drop", function (event) {
    event.preventDefault();
    dropzone.classList.remove("dragover");

    var droppedFiles = event.dataTransfer.files;

    if (droppedFiles.length > 0) {
        fileInput.files = droppedFiles;
        // later: send this file to your Flask upload route
    }
});

// When a file is picked using the normal "click to browse" method
fileInput.addEventListener("change", function () {
    // later: send fileInput.files[0] to your Flask upload route
});