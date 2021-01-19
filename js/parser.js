import * as util from './util.js';

export async function test() {
    //console.log(await tableParsers.iidxEreterAnalytics());
    console.log(await tables.iidxSnjkmzsRank(12));
    console.log(await tables.iidxEreterAnalytics(12));
    console.log(await playerData.iidxEreterLevel(65076444, 12));
    console.log(await playerData.bmsEreterInsane(34792));
}

export const tables = {
    bmsJson: async url => {
        throw new Error('not implemented');
    },

    iidxEreterAnalytics: async () => {
        const url = 'http://ereter.net/iidxsongs/analytics/perlevel/';

        var diffTable = {
            indices: new Map(),
            levels: [],
        };

        const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');
        const tables = html.querySelectorAll('[data-sort=table]');
        const tableAnalytics = tables[tables.length - 1];

        tableAnalytics.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
            var level;
            const songs = Array.from(tbody.querySelectorAll('tr')).map((row, i) => {
                const fields = row.querySelectorAll('td');
                if (!level)
                    level = fields[0].innerText.substring(1);
                const ret = {
                    title: fields[1].innerText.replace(/ \([A-Z]+\)$/, ''),
                    difficulty: fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1],
                    officialLevel: 12, // ereter analytics page is available only for level 12 currently
                    ereterSongID: parseInt(fields[1].querySelector('a').href.match(/\/iidxranking\/([\d]+)\//)[1]),
                    ereterEst: [3, 5, 7] // easy, hard, ex-hard
                        .map(i => parseFloat(fields[i].querySelector('span').innerText.substring(1))),
                    ereterColor: [3, 5, 7]
                        .map(i => fields[i].querySelector('span').style.color.match(/\b[\d]+\b/g)
                             .map(c => parseInt(c))),
                };
                diffTable.indices.set(ret.title + '\t' + ret.difficulty, [diffTable.levels.length, i]);
                return ret;
            });
            if (!level)
                return;
            diffTable.levels.push({
                level: level,
                songs: songs,
            });
        });

        return diffTable;
    },

    iidxSnjkmzsRank: async level => {
        const url = 'https://zasa.sakura.ne.jp/dp/rank.php';

        var diffTable = {
            indices: new Map(),
            levels: [],
        };

        const html = new DOMParser().parseFromString(await util.readPage(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `env=a280&submit=%E8%A1%A8%E7%A4%BA&cat=0&mode=p1&offi=${level}`,
        }), 'text/html');
        const tables = html.querySelectorAll('table.rank_p1');
        const tableRank = tables[tables.length - 1];

        tableRank.querySelectorAll('tr.tile_1, tr.tile_2').forEach(tr => {
            const rank = tr.querySelector('td.rank').innerText;
            const songs = Array.from(tr.querySelectorAll('a.music')).map((song, i) => {
                const ret = {
                    title: song.innerText.replace(/ \[[BNHAL]\]$/, ''),
                    difficulty: song.innerText.match(/ \[([BNHAL])\]$/)[1]
                        .replace('B', 'BEGINNER')
                        .replace('N', 'NORMAL')
                        .replace('H', 'HYPER')
                        .replace('A', 'ANOTHER')
                        .replace('L', 'LEGGENDARIA'),
                    officialLevel: level,
                    snjkmzsID: song.href.match(/music.php\?id=([\d-]+)/)[1],
                };
                diffTable.indices.set(ret.title + '\t' + ret.difficulty, [diffTable.levels.length, i]);
                return ret;
            });
            diffTable.levels.push({
                level: rank,
                songs: songs,
            });
        });

        return diffTable;
    },
};

export const playerData = {
    iidxEreterLevel: async (iidxID, level) => {
        // ('title\tdifficulty', {rank, percentage, lamp})
        var dataMap = new Map();

        const url = `http://ereter.net/iidxplayerdata/${iidxID}/level/${level}/`;

        const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');
        const tables = html.querySelectorAll('[data-sort=table]');
        const dataTable = tables[tables.length - 1];
        dataTable.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
            var level;
            var songs = [];
            tbody.querySelectorAll('tr').forEach(row => {
                const fields = row.querySelectorAll('td');
                const title = fields[1].innerText.replace(/ \([A-Z]+\)$/, '');
                const difficulty = fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1];
                dataMap.set(title + '\t' + difficulty, {
                    rank: fields[4].children.length > 0
                        ? fields[4].querySelectorAll('span span span')[0].innerText
                        : '',
                    percentage: fields[4].children.length > 0
                        ? parseFloat(fields[4].querySelectorAll('span span span')[1].innerText)
                        : 0,
                    lamp: fields[5].innerText.toUpperCase().trim() || 'NO-PLAY',
                });
            });
        });

        return dataMap;
        /*
        diff_table.forEach((level_table) => {
            var size = level_table.songs.length;

            let level_sum = level_table.songs
                .reduce((total, current) => {
                    if (current.rank === '')
                        --size;
                    total.percentage += current.percentage;
                    total.recommend = current.recommend
                        .map((rec, i) => total.recommend[i] + rec);
                    total.recommend_color = current.recommend_color
                        .map((color, i) =>
                             color.map((c, j) => total.recommend_color[i][j] + c));
                    return total;
                }, {
                    percentage: 0,
                    recommend: [0, 0, 0],
                    recommend_color: [0, 0, 0].map(() => [0, 0, 0])
                });

            level_table.percentage = (level_sum.percentage / size) || 0;
            level_table.rank = ranks[Math.trunc(level_table.percentage / 100 * 9)];
            level_table.recommend =
                level_sum.recommend.map((rec) => Math.floor(rec / level_table.songs.length * 10.0) / 10.0);
            level_table.recommend_color =
                level_sum.recommend_color.map((color) => color.map((c) => parseInt(c / level_table.songs.length)));
            level_table.lamp = level_table.songs
                .reduce((total, current) =>
                        lamps.indexOf(current.lamp) < lamps.indexOf(total.lamp) ? current : total,
                        {lamp: lamps[lamps.length - 1]}).lamp;
        });
        */
    },

    bmsEreterInsane: async lr2id => {
        // title may be duplicated,
        // ('title', {rank, percentage, lamp})
        var dataMap = new Map();

        const url = `http://ereter.net/bmsplayerdata/${lr2id}/`;

        const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');
        const tables = html.querySelectorAll('[data-sort=table]');
        const dataTable = tables[tables.length - 1];
        dataTable.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
            var level;
            var songs = [];
            tbody.querySelectorAll('tr').forEach(row => {
                const fields = row.querySelectorAll('td');
                const title = fields[1].innerText;
                dataMap.set(title, {
                    rank: fields[5].children.length > 0
                        ? fields[5].querySelectorAll('span span span')[0].innerText
                        : '',
                    percentage: fields[5].children.length > 0
                        ? parseFloat(fields[5].querySelectorAll('span span span')[1].innerText)
                        : 0,
                    lamp: fields[6].innerText.toUpperCase().trim() || 'NO-PLAY',
                    bp: fields[7].innerText.trim() !== '' ? parseInt(fields[7].innerText) : -1,
                });
            });
        });

        return dataMap;
    },
}
