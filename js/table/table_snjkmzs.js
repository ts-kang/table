import { DiffTable } from './table_base.js';
import * as util from '../util.js';

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
    this.options.level = {
        display: 'Level',
        value: 12,
        render() {
            let select = document.createElement('select');
            select.innerHTML = [...Array(12).keys()]
                .reverse()
                .map(i => `<option value="${i + 1}">☆${i + 1}</option>`)
                .join('');
            select.querySelector(`[value="${this.value}"]`).selected = true;
            select.addEventListener('change', () => this.value = select.value);
            return select;
        },
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
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `env=a280&submit=%E8%A1%A8%E7%A4%BA&cat=0&mode=p1&offi=${this.options.level.value}`,
    }).then(res => res.text()), 'text/html');
    const tableRank = Array.from(html.querySelectorAll('table.rank_p1')).pop();

    tableRank.querySelectorAll('tr.tile_1, tr.tile_2').forEach(tr => {
        const rank = tr.querySelector('td.rank').innerText;
        const songs = Array.from(tr.querySelectorAll('a.music')).map((song, i) => {
            const ret = {
                title: song.innerText.replace(/ \[[BNHAL]\]$/, '')
                    .replace(/ \(BIS\)$/, '')
                    .replace(/ \(HERO\)$/, '')
                    .replace(/ \(ROOT\)$/, '')
                    .replace(/ \(CB\)$/, '')
                    .replace(/ \(SINO\)$/, '')
                    .replace(/ \(COP\)$/, '')
                    .replace(/ \(PEN\)$/, '')
                    .replace(/ \(SPA\)$/, '')
                    .replace(/ \(TRI\)$/, '')
                    .replace(/ \(LC\)$/, '')
                    .replace(/ \(RA\)$/, '')
                    .replace(/ \(SIR\)$/, '')
                    .replace(/ \(EMP\)$/, '')
                    .replace(/ \(DJT\)$/, '')
                    .replace(/ \(GOLD\)$/, '')
                    .replace(/ \(DD\)$/, '')
                    .replace(/ \(HSKY\)$/, '')
                    .replace(/ \(RED\)$/, '')
                    .replace(/ \(10th\)$/, '')
                    .replace(/ \([4-9]th\)$/, '')
                    .replace(/ \(3rd\)$/, '')
                    .replace(/ \(2nd\)$/, '')
                    .replace(/ \(sub\)$/, '')
                    .replace(/ \(1st\)$/, ''),
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
            level: rank,
            name: this.prefix + rank,
            songs: songs,
        });
    });

    this.groups.reverse();

    await this.data.parse();
    await this.data.apply(this);
}
