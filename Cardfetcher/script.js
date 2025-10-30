async function fetchCard() {
    const name = document.getElementById('cardName').value;
    if (!name) return;

    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
    const data = await response.json();

    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';

    if (data.data) {
        data.data.slice(0, 100).forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';

            const img = document.createElement('img');
            img.src = card.image_uris ? card.image_uris.normal : '';
            img.alt = card.name;

            cardDiv.appendChild(img);
            grid.appendChild(cardDiv);
        });
    } else {
        grid.innerHTML = '<p>Karte nicht gefunden.</p>';
    }
}