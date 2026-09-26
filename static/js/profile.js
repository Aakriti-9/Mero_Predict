document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       GET ALL TOGGLE BUTTONS
    ===================================================== */

    var toggleButtons =
        document.querySelectorAll(".pref-toggle");


    /* =====================================================
       HANDLE TOGGLE CLICK
    ===================================================== */

    function handleToggleClick(event) {

        var clickedToggle =
            event.currentTarget;


        /* =================================================
           CHECK CURRENT STATE
        ================================================= */

        var isCurrentlyActive =
            clickedToggle.classList.contains(
                "active"
            );


        var newState =
            !isCurrentlyActive;


        /* =================================================
           GET SETTING NAME
        ================================================= */

        var setting =
            clickedToggle.dataset.setting;


        if (!setting) {

            console.warn(
                "Notification setting is missing."
            );

            return;

        }


        /* =================================================
           UPDATE UI IMMEDIATELY
        ================================================= */

        if (newState) {

            clickedToggle.classList.add(
                "active"
            );

        } else {

            clickedToggle.classList.remove(
                "active"
            );

        }


        clickedToggle.setAttribute(
            "aria-checked",
            newState ? "true" : "false"
        );


        /* =================================================
           PREVENT DOUBLE CLICK WHILE SAVING
        ================================================= */

        clickedToggle.disabled = true;


        /* =================================================
           SAVE SETTING TO BACKEND
        ================================================= */

        fetch(
            "/profile/notifications",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    setting: setting,
                    enabled: newState
                })
            }
        )

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Failed to save notification setting."
                );

            }

            return response.json();

        })

        .then(function (data) {

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Could not save notification setting."
                );

            }

        })

        .catch(function (error) {

            console.error(
                "Notification setting error:",
                error
            );


            /* =============================================
               RESTORE PREVIOUS UI STATE
            ============================================= */

            if (isCurrentlyActive) {

                clickedToggle.classList.add(
                    "active"
                );

            } else {

                clickedToggle.classList.remove(
                    "active"
                );

            }


            clickedToggle.setAttribute(
                "aria-checked",
                isCurrentlyActive
                    ? "true"
                    : "false"
            );

        })

        .finally(function () {

            /* =============================================
               ENABLE BUTTON AGAIN
            ============================================= */

            clickedToggle.disabled = false;

        });

    }


    /* =====================================================
       ATTACH CLICK EVENT TO EVERY TOGGLE
    ===================================================== */

    for (
        var i = 0;
        i < toggleButtons.length;
        i++
    ) {

        toggleButtons[i].addEventListener(
            "click",
            handleToggleClick
        );

    }

});

