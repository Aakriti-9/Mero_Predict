document.addEventListener("DOMContentLoaded", () => {

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationDropdown =
        document.getElementById("notificationDropdown");

    const notificationList =
        document.getElementById("notificationList");

    const notificationCount =
        document.getElementById("notificationCount");

    const notificationStatus =
        document.getElementById("notificationStatus");

    const markAllNotifications =
        document.getElementById("markAllNotifications");


    /* =========================================================
       CHECK REQUIRED ELEMENTS
    ========================================================= */

    if (
        !notificationButton ||
        !notificationDropdown ||
        !notificationList ||
        !notificationCount
    ) {
        return;
    }


    /* =========================================================
       NOTIFICATION ICONS
    ========================================================= */

    function getNotificationIcon(type) {

        switch (type) {

            case "prediction":
                return "bi-cpu";

            case "top_mover":
                return "bi-graph-up-arrow";

            case "model":
                return "bi-robot";

            default:
                return "bi-bell";

        }

    }


    /* =========================================================
       ESCAPE HTML
    ========================================================= */

    function escapeHtml(value) {

        const div = document.createElement("div");

        div.textContent = value ?? "";

        return div.innerHTML;

    }


    /* =========================================================
       RELATIVE TIME
    ========================================================= */

    function getRelativeTime(dateString) {

        if (!dateString) {
            return "";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const now = new Date();

        const difference =
            Math.floor((now - date) / 1000);


        if (difference < 60) {
            return "Just now";
        }

        if (difference < 3600) {

            const minutes =
                Math.floor(difference / 60);

            return `${minutes}m ago`;

        }

        if (difference < 86400) {

            const hours =
                Math.floor(difference / 3600);

            return `${hours}h ago`;

        }

        if (difference < 604800) {

            const days =
                Math.floor(difference / 86400);

            return `${days}d ago`;

        }

        return date.toLocaleDateString();

    }


    /* =========================================================
       LOAD NOTIFICATIONS
    ========================================================= */

    async function loadNotifications() {

        try {

            const response =
                await fetch("/api/notifications");

            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load notifications."
                );

            }


            /* =================================================
               UPDATE UNREAD COUNT
            ================================================= */

            const unreadCount =
                Number(data.unread_count) || 0;


            if (unreadCount > 0) {

                notificationCount.textContent =
                    unreadCount;

                notificationCount.classList.add("show");

            } else {

                notificationCount.textContent = "";

                notificationCount.classList.remove("show");

            }


            /* =================================================
               UPDATE STATUS
            ================================================= */

            if (notificationStatus) {

                if (unreadCount > 0) {

                    notificationStatus.textContent =
                        `${unreadCount} unread`;

                } else {

                    notificationStatus.textContent =
                        "All caught up";

                }

            }


            /* =================================================
               EMPTY NOTIFICATIONS
            ================================================= */

            if (
                !data.notifications ||
                data.notifications.length === 0
            ) {

                notificationList.innerHTML = `
                    <div class="notification-empty">

                        <i class="bi bi-bell"></i>

                        <p>
                            No notifications yet.
                        </p>

                    </div>
                `;

                return;

            }


            /* =================================================
               RENDER NOTIFICATIONS
            ================================================= */

            notificationList.innerHTML =
                data.notifications.map(notification => {

                    const unreadClass =
                        notification.is_read
                            ? ""
                            : "unread";


                    const icon =
                        getNotificationIcon(
                            notification.type
                        );


                    return `
                        <div
                            class="notification-item ${unreadClass}"
                            data-id="${notification.id}"
                        >

                            <div class="notification-item-icon">

                                <i class="bi ${icon}"></i>

                            </div>


                            <div class="notification-item-content">

                                <div class="notification-item-title">

                                    ${escapeHtml(
                                        notification.title
                                    )}

                                </div>


                                <div class="notification-item-message">

                                    ${escapeHtml(
                                        notification.message
                                    )}

                                </div>


                                <div class="notification-item-time">

                                    ${getRelativeTime(
                                        notification.created_at
                                    )}

                                </div>

                            </div>


                            ${
                                !notification.is_read
                                    ? `
                                        <span
                                            class="notification-unread-marker"
                                        ></span>
                                      `
                                    : ""
                            }

                        </div>
                    `;

                }).join("");

        } catch (error) {

            console.error(
                "Notification error:",
                error
            );


            notificationList.innerHTML = `
                <div class="notification-empty">

                    <i class="bi bi-exclamation-circle"></i>

                    <p>
                        Unable to load notifications.
                    </p>

                </div>
            `;


            if (notificationStatus) {

                notificationStatus.textContent =
                    "Unavailable";

            }

        }

    }


    /* =========================================================
       OPEN / CLOSE DROPDOWN
    ========================================================= */

    notificationButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            const isOpen =
                notificationDropdown.classList.contains("show");


            notificationDropdown.classList.toggle(
                "show"
            );


            notificationButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

        }
    );


    /* =========================================================
       CLOSE WHEN CLICKING OUTSIDE
    ========================================================= */

    document.addEventListener(
        "click",
        (event) => {

            if (
                !notificationDropdown.contains(event.target) &&
                !notificationButton.contains(event.target)
            ) {

                notificationDropdown.classList.remove(
                    "show"
                );

                notificationButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =========================================================
       MARK ALL AS READ
    ========================================================= */

    if (markAllNotifications) {

        markAllNotifications.addEventListener(
            "click",
            async () => {

                try {

                    const response =
                        await fetch(
                            "/api/notifications/read-all",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                }
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to mark notifications as read."
                        );

                    }


                    await loadNotifications();

                } catch (error) {

                    console.error(
                        "Mark notifications read error:",
                        error
                    );

                }

            }
        );

    }


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    loadNotifications();


    /* =========================================================
       REFRESH EVERY 60 SECONDS
    ========================================================= */

    setInterval(
        loadNotifications,
        60000
    );

});