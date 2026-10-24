const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const newTracks = [
    { name: "Say Yes - Loco ft Punch", url: "/music/say-yes-loco-punch.mp3" },
    { name: "Best In Me - Blue", url: "/music/blue-best-in-me.mp3" },
    { name: "Eternal Flame - Human Nature", url: "/music/eternal-flame.mp3" }
];

if (!data.invitation.musicTracks) {
    data.invitation.musicTracks = [];
}

data.invitation.musicTracks.push(...newTracks);

fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
console.log("Added 3 tracks to data.json");
