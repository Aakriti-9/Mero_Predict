// Get every toggle switch on the page
var toggleButtons = document.querySelectorAll(".pref-toggle");

// Run this function whenever any toggle is clicked
function handleToggleClick(event) {

    var clickedToggle = event.currentTarget; // the button that was clicked

    // Check if it's currently active
    var isCurrentlyActive = clickedToggle.classList.contains("active");

    if (isCurrentlyActive) {
        // Turn it off
        clickedToggle.classList.remove("active");
        clickedToggle.setAttribute("aria-checked", "false");
    } else {
        // Turn it on
        clickedToggle.classList.add("active");
        clickedToggle.setAttribute("aria-checked", "true");
    }
}

// Attach the click handler to every toggle
for (var i = 0; i < toggleButtons.length; i++) {
    toggleButtons[i].addEventListener("click", handleToggleClick);
}