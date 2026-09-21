document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // STAR TOGGLE (favorite)
    // =========================================================

    document.querySelectorAll(".wsc-star").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const icon = btn.querySelector("i");
            const isActive = btn.classList.toggle("active");
            

            if (isActive) {
                icon.classList.remove("bi-star");
                icon.classList.add("bi-star-fill");
            } else {
                icon.classList.remove("bi-star-fill");
                icon.classList.add("bi-star");
            }

            // TODO: wire up to backend endpoint, e.g.
            // fetch(`/watchlist/favorite/${symbol}`, { method: "POST" })

        });

    });


    // =========================================================
    // ADD STOCK
    // =========================================================

    document.querySelectorAll(".asc-add").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const symbol = btn.dataset.symbol;
            const chip = btn.closest(".add-stock-chip");

            // TODO: replace with real POST request, e.g.
            // fetch(`/watchlist/add/${symbol}`, { method: "POST" })
            //     .then(() => window.location.reload());

            btn.textContent = "Added";
            btn.disabled = true;
            chip.style.opacity = "0.5";

        });

    });

});