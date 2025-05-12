
document.getElementById('search-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const query = document.getElementById('movie-input').value.trim();
    const responseArea = document.getElementById('response-area');

    if (!query) {
        responseArea.innerHTML = '<p>Por favor, digite algo.</p>';
        return;
    }

    responseArea.innerHTML = '<p class="loading">Consultando o Lupa Play...</p>';

    try {
        const res = await fetch('/api/lupa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        responseArea.innerHTML = `<p>${data.response}</p>`;
    } catch (error) {
        responseArea.innerHTML = '<p>Erro ao consultar o Lupa Play.</p>';
    }
});
