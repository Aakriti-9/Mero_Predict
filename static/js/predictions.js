document.addEventListener('DOMContentLoaded', function () {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const sortBtns = document.querySelectorAll('.sort-btn');
    const grid = document.getElementById('predictionsGrid');

    let currentFilter = 'all';
    let currentSort = 'confidence';

    // Set confidence bar widths from data-width (avoids Jinja inside style="")
    document.querySelectorAll('.confidence-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
    });

    function getCards() {
        return Array.from(grid.querySelectorAll('.prediction-card'));
    }

    function applyFilterAndSort() {
        const cards = getCards();

        cards.forEach(card => {
            const direction = card.dataset.direction;
            const show = currentFilter === 'all' || direction === currentFilter;
            card.style.display = show ? '' : 'none';
        });

        const visibleCards = cards.filter(c => c.style.display !== 'none');
        visibleCards.sort((a, b) => {
            if (currentSort === 'confidence') {
                return parseFloat(b.dataset.confidence) - parseFloat(a.dataset.confidence);
            }
            return Math.abs(parseFloat(b.dataset.change)) - Math.abs(parseFloat(a.dataset.change));
        });

        visibleCards.forEach(card => grid.appendChild(card));
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFilterAndSort();
        });
    });

    sortBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            sortBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            applyFilterAndSort();
        });
    });

    applyFilterAndSort();
});