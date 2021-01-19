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

    iidxEreterAnalytics: async options => {
        const url = options.userId
              ? `http://ereter.net/iidxplayerdata/${options.userId}/analytics/perlevel/`
              : `http://ereter.net/iidxsongs/analytics/perlevel/`;
        return ereterParser_table(url, true, options.userId);
    },

    iidxSnjkmzsRank: async options => {
        const url = 'https://zasa.sakura.ne.jp/dp/rank.php';

        var diffTable = {
            from: 'SNJ@KMZS beatmaniaIIDX DP非公式難易度表',
            prefix: '☆',
            indices: new Map(),
            levels: [],
        };

        const html = new DOMParser().parseFromString(await util.readPage(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `env=a280&submit=%E8%A1%A8%E7%A4%BA&cat=0&mode=p1&offi=${options.level}`,
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
                    officialLevel: options.level,
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

    bmsEreterInsaneAnalytics: async options => {
        const url = options.userId
              ? `http://ereter.net/bmsplayerdata/${options.userId}/dpbms/analytics/perlevel/`
              : `http://ereter.net/bmssongs/dpbms/analytics/perlevel/`;
        return ereterParser_table(url, false, options.userId);
    },
};

export const playerData = {
    iidxEreterLevel: async options => {
        // ('title\tdifficulty', {rank, percentage, lamp})
        var data = {
            userId: options.userId,
            records: new Map(),
        };

        const url = `http://ereter.net/iidxplayerdata/${options.userId}/level/${options.level}/`;

        const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');

        data.username = html.querySelector('.content > h3').innerText;

        const tables = html.querySelectorAll('[data-sort=table]');
        const dataTable = tables[tables.length - 1];
        dataTable.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
            var level;
            var songs = [];
            tbody.querySelectorAll('tr').forEach(row => {
                const fields = row.querySelectorAll('td');
                const title = fields[1].innerText.replace(/ \([A-Z]+\)$/, '');
                const difficulty = fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1];
                data.records.set(title + '\t' + difficulty, {
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

        return data;
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

    bmsEreterInsane: async options =>
        ereterBMSParser_playerdata(`http://ereter.net/bmsplayerdata/${options.userId}/`),

    bmsEreterOverjoy: async options =>
        ereterBMSParser_playerdata(`http://ereter.net/bmsplayerdata/${options.userId}/dpoverjoy/songs/perlevel/`),
}

// for IIDX and Insane BMS analytics page
// use json parser for Overjoy table
async function ereterParser_table(url, iidx, id) {
        const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');

        var diffTable = {
            from: '<span style="color: #ce8ef9"><span style="color: #91e1ff">ereter</span>\'s dp laboratory</span> & difficulty table from ' + iidx ? 'SNJ@KMZS beatmaniaIIDX DP非公式難易度表' : 'GENOCIDE - bms難易度表 -',
            prefix: iidx ? '☆' : '★',
            indices: new Map(),
            levels: [],
        };

        if (id) {
            let user = html.querySelector('.content > h3');
            diffTable.userInfo = {};
            diffTable.userInfo.id = id;
            diffTable.userInfo.username = user.innerText.replace(/ - .*$/, '');
            diffTable.userInfo.clearAbility = user.querySelector('span').innerText.substring(1);
            diffTable.userInfo.clearAbility_color = user.querySelector('span').style.color;
        }

        const tables = html.querySelectorAll(id ? '[data-sort=table-perlevel]' : '[data-sort=table]');
        const tableAnalytics = tables[tables.length - 1];

        tableAnalytics.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
            var level;
            const songs = Array.from(tbody.querySelectorAll('tr')).map((row, i) => {
                const fields = row.querySelectorAll('td');
                if (!level)
                    level = fields[0].innerText.substring(1);
                var ret = {
                    ereterID: parseInt(fields[1].querySelector('a').href.match(/ranking\/([\d]+)\//)[1]),
                    // [EASY, HARD, EX-HARD] for IIDX, [EASY, HARD] for BMS
                    ereterEst: (iidx ? [3, 5, 7] : [4, 6])
                        .map(i => parseFloat(fields[i].querySelector('span').innerText.substring(1))),
                    ereterColor: (iidx ? [3, 5, 7] : [4, 6])
                        .map(i => fields[i].querySelector('span').style.color.match(/\b[\d]+\b/g)
                             .map(c => parseInt(c))),
                };
                if (iidx) {
                    ret.title = fields[1].innerText.replace(/ \([A-Z]+\)$/, '');
                    ret.difficulty = fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1];
                    // ereter analytics page is available only for level 12 currently
                    ret.officialLevel = 12;
                } else {
                    ret.title = fields[1].innerText;
                }
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
}

async function ereterBMSParser_playerdata(url) {
        // title can be duplicated,
        // ('title', {rank, percentage, lamp})
        var dataMap = new Map();

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
}
