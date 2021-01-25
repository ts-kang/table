import * as util from '../util.js';
import { DataSource } from './data_base.js';

export function DataCSV() {
    DataSource.call(this);
    this.options.csvFile = {
        value: undefined,
        render() {
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = 'text/csv';
            input.addEventListener('change', () => this.value = input.files[0]);
            return input;
        },
    };
    this.options.username = {
        input: undefined,
        get value() {
            if (this.input)
                return this.input.value;
            return '';
        },
        render() {
            let input = document.createElement('input');
            input.type = 'text';
            input.style.width = '8rem';
            input.placeholder = 'Username';
            this.input = input;
            return input;
        },
    };
}

DataCSV.prototype = Object.create(DataSource.prototype);
DataCSV.prototype.constructor = DataCSV;

DataCSV.prototype.parse = async function() {
    await util.loadLibrary('papaparse.min.js');

    await new Promise((resolve, _) => Papa.parse(this.options.csvFile.value, {
        header: true,
        step: row => {
            if (row.errors.length > 0)
                return;

            const title = row.data['タイトル']
                  .replace('，', ',');
            const version = row.data['バージョン'];
            ['BEGINNER', 'NORMAL', 'HYPER', 'ANOTHER', 'LEGGENDARIA'].forEach(diff => {
                const lamp = row.data[diff + ' クリアタイプ']
                      .replace(/ CLEAR$/, '')
                      .replace('EX HARD', 'EX-HARD')
                      .replace('NO PLAY', 'NO-PLAY');
                const rank = row.data[diff + ' DJ LEVEL']
                      .replace('---', '');
                const score = row.data[diff + ' スコア'];

                // ('title\tdifficulty', {lamp, rank, score})
                if (lamp != 'NO-PLAY' || rank)
                    this.records.set(title + '\t' + diff, {lamp: lamp, rank: rank, score: score});
            });
        },
        complete: () => resolve(),
    }));

    this.player.username = this.options.username.value;
};

DataCSV.prototype.apply = function(table) {
    table.groups.forEach(group => group.songs.forEach(song => {
        const data = this.records.get(song.title + '\t' + song.difficulty);
        if (data)
            song.playerData = data;
        else
            song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
    }));
}
