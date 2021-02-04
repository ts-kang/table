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
    this.records = new Map();

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
                const level = row.data[diff + ' 難易度'];

                // ('title\tdifficulty', {lamp, rank, score})
                if (lamp != 'NO-PLAY' || rank)
                    this.records.set(this.recordKey({title: title, difficulty: diff}), {officialLevel: level, lamp: lamp, rank: rank, score: score});
            });
        },
        complete: () => resolve(),
    }));

    this.player.username = this.options.username.value;
};

DataCSV.prototype.apply = async function(table) {
    table.groups.forEach(group => group.songs.forEach(song => {
        const key = this.recordKey(song);
        const data = this.records.get(key);
        if (data) {
            if (parseInt(song.officialLevel) !== parseInt(data.officialLevel)) {
                this.records = new Map();
                throw new Error('invalid data');
            }
            song.playerData = data;
            this.records.delete(key);
        } else {
            const title = key.substring(0, key.lastIndexOf('\t'));
            const [similarKey, similarTitle, distance] = Array.from(this.records.entries())
                  .reduce((t, [k, v]) => {
                      const kt = k.substring(0, k.lastIndexOf('\t'));
                      const d = util.lev(kt, title);
                      if (d < t[2] && parseInt(v.officialLevel) === parseInt(song.officialLevel))
                          return [k, kt, d];
                      return t;
                  }, ['', '', 1000]);
            console.debug(`lev('${similarTitle}', '${title}') ===`, distance,
                        ', tolerance:', parseInt(Math.log2(Math.min(similarTitle.length, title.length))));
            if (distance <= parseInt(Math.log2(Math.min(similarTitle.length, title.length)))) { // lev(ooo, bloom) === 2
                const similarData = this.records.get(similarKey);
                if (parseInt(song.officialLevel) !== parseInt(similarData.officialLevel)) {
                    this.records = new Map();
                    throw new Error('invalid data');
                }
                song.playerData = similarData;
                this.records.delete(similarKey);
            } else {
                song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
            }
        }
    }));
}
