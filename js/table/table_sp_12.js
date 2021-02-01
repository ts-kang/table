import { TableDiscrimination } from './table_discrimination.js';
import * as util from '../util.js';

const RANKS = ['F', 'E', 'D', 'C', 'B', 'B+', 'A', 'A+', 'S', 'S+'];

export const TYPE = {NORMAL: 0, HARD: 1};

export function TableSP12(type) {
    TableDiscrimination.call(this);
    this.prefix = '☆';
    this.type = type;
    this.cite = 'from beatmaniaIIDX SP☆12難易度議論スレ';
    this.dataSources.csv = {
        display: 'CSV',
        instance: async () => await import('../data_source/data_csv.js').then(m => new m.DataCSV()),
    };
}

TableSP12.prototype = Object.create(TableDiscrimination.prototype);
TableSP12.prototype.constructor = TableSP12;

TableSP12.prototype.parse = async function() {
    this.groups = [];

    this.display = `IIDX SP Lv.12 ${['Normal', 'Hard'][this.type]} Clear`;

    const url = 'https://iidx-sp12.github.io/songs.json';

    const jsonArr = await util.readPage(url).then(res => res.json());

    jsonArr.forEach(song => {
        const rankName = song[['normal', 'hard'][this.type]].trim() || 'Unclassified';
        let group = this.groups.filter(group => group.name === rankName).pop();
        if (!group) {
            group = {
                name: rankName,
                songs: [],
            };
            if (rankName !== 'Unclassified') {
                group.rank = rankName.match(/[SA-F]\+?$/)[0];
                group.discrimination = rankName.startsWith('個人差');
            }
            this.groups.push(group);
        }
        group.songs.push({
            title: song.name,
            difficulty: song.difficulty
                .replace('B', 'BEGINNER')
                .replace('N', 'NORMAL')
                .replace('H', 'HYPER')
                .replace('A', 'ANOTHER')
                .replace('L', 'LEGGENDARIA'),
            officialLevel: 12,
        });
    });

    this.groups.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) || (a.discrimination ? 1 : 0) - (b.discrimination ? 1 : 0) || 1);

    await this.data.parse();
    await this.data.apply(this);
};
