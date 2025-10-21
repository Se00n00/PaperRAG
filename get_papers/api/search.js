export default async function handler(req, res) {
    const query = req.query.q || ''
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        query
    )}&limit=5&fields=title,authors,year,abstract,externalIds`;
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Semantic Scholar error' });
        }

        const data = await response.json();
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Internal proxy error' });
    }

}