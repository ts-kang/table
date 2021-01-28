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
            input.name = 'username';
            input.style.width = '8rem';
            input.placeholder = 'Username';
            this.input = input;
            return input;
        },
    };
}

DataCSV.prototype = Object.create(DataSource.prototype);
DataCSV.prototype.constructor = DataCSV;

DataCSV.prototype.recordKey = song => util.normalize(song.title) + '\t' + song.difficulty;

DataCSV.prototype.parse = async function() {
    await util.loadLibrary('papaparse.min.js');

    console.log('parse csv')
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
                    this.records.set(this.recordKey({title: title, difficulty: diff}), {lamp: lamp, rank: rank, score: score});
            });
        },
        complete: () => resolve(),
    }));

    this.player.username = this.options.username.value;
};

DataCSV.prototype.apply = async function(table) {
    table.groups.forEach(group => group.songs.forEach(song => {
        const key = this.recordKey(song)
        const data = this.records.get(key);
        if (data) {
            song.playerData = data;
        } else {
            const title = key.substring(0, key.lastIndexOf('\t'));
            const [similarKey, distance] = Array.from(this.records.keys())
                  .reduce((t, k) => {
                      const d = util.lev(k.substring(0, k.lastIndexOf('\t')), title);
                      if (d < t[1])
                          return [k, d];
                      return t;
                  }, [-1, 1000]);
            if (distance < parseInt(0.3 * title.length))
                song.playerData = this.records.get(similarKey);
            else
                song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
        }
    }));
}
