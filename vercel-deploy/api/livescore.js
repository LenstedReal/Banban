export default async function handler(req, res) {
    try {
        const url = new URL(req.url, 'http://localhost');
        const customDate = url.searchParams.get('date');
        const dayOffset = parseInt(url.searchParams.get('day') || '0', 10) || 0;

        let dateStr;
        if (customDate && /^\d{8}$/.test(customDate)) {
            dateStr = customDate;
        } else {
            const target = new Date();
            target.setDate(target.getDate() + dayOffset);
            dateStr = target.getFullYear() +
                String(target.getMonth() + 1).padStart(2, '0') +
                String(target.getDate()).padStart(2, '0');
        }

        const response = await fetch(
            `https://prod-public-api.livescore.com/v1/api/app/date/soccer/${dateStr}/-3?MD=1`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=60');
        res.status(200).json(data);
    } catch (e) {
        res.status(500).json({ Stages: [], error: e.message });
    }
}
