document.addEventListener('DOMContentLoaded', function () {
    const toasts = document.querySelectorAll('.toast-item');

    toasts.forEach(function (toast) {
        setTimeout(function () {
            toast.classList.add('hide');
            setTimeout(function () {
                toast.remove();
            }, 250);
        }, 4000);
    });
});