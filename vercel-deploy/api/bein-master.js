export default async function handler(req, res) {
    const { video, audio } = req.query;
    if (!video) {
        res.status(400).json({ error: 'video parameter required' });
        return;
    }

    let manifest = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS
`;
    if (audio) {
        manifest += `\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Turkish",LANGUAGE="tur",DEFAULT=YES,AUTOSELECT=YES,URI="${audio}"\n`;
        manifest += `\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,AUDIO="audio"\n${video}`;
    } else {
        manifest += `\n#EXT-X-STREAM-INF:BANDWIDTH=4000000\n${video}`;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(manifest.trim());
}
