import { DiffTable } from './table_base.js';
import * as util from '../util.js'

export function TableSnjkmzsRank() {
    DiffTable.call(this);
    this.prefix = '☆';
    this.cite = 'from SNJ@KMZS beatmaniaIIDX DP非公式難易度表';
    this.dataSources.ereter = {
        display: 'ereter.net',
        instance: async () => await import('../data_source/data_ereter.js').then(m => new m.DataEreter(m.TYPE.IIDX, this.options)),
    };
    this.dataSources.csv = {
        display: 'CSV',
        instance: async () => await import('../data_source/data_csv.js').then(m => new m.DataCSV()),
    };
}

TableSnjkmzsRank.prototype = Object.create(DiffTable.prototype);
TableSnjkmzsRank.prototype.constructor = TableSnjkmzsRank;

TableSnjkmzsRank.prototype.parse = async function() {
    this.groups = [];

    this.display = `IIDX DP Lv.${this.options.level.value} Normal Clear`;

    const url = 'https://zasa.sakura.ne.jp/dp/rank.php';

    const html = new DOMParser().parseFromString(await util.readPage(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `env=a280&submit=%E8%A1%A8%E7%A4%BA&cat=0&mode=p1&offi=${this.options.level.value}`,
    }), 'text/html');
    const tableRank = Array.from(html.querySelectorAll('table.rank_p1')).pop();

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
                officialLevel: this.options.level.value,
                snjkmzsID: song.href.match(/music.php\?id=([\d-]+)/)[1],
            };
            return ret;
        });
        this.groups.push({
            name: rank,
            songs: songs,
        });
    });

    this.groups.reverse();

    await this.data.parse();
    this.data.apply(this);
}
