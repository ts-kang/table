import * as util from '../util.js';
import { DataSource } from './data_base.js';

export const TYPE = { IIDX: 0, INSANE: 1, OVERJOY: 2 };

export function DataEreter(type, tableOptions) {
    DataSource.call(this);
    this.type = type;
    this.tableOptions = tableOptions;
    this.options.userId = {
        input: undefined,
        get value() {
            if (this.input)
                return this.input.value;
            return '';
        },
        render: () => {
            let input = document.createElement('input');
            input.type = 'text';
            input.style.width = '8rem';
            input.placeholder = this.type === TYPE.IIDX ? 'IIDX ID' : 'LR2 ID';
            this.options.userId.input = input;
            return input;
        },
    }
}

DataEreter.prototype = Object.create(DataSource.prototype);
DataEreter.prototype.constructor = DataEreter;

DataEreter.prototype.recordKey = function(song) {
    if (this.type === TYPE.IIDX)
        return song.title + '\t' + song.difficulty;
    return song.title;
};

DataEreter.prototype.parse = async function() {
    this.player.userId = this.options.userId.value;
    const level = this.tableOptions.level;
    const url = [
        `http://ereter.net/iidxplayerdata/${this.player.userId}/level/${level ? level.value : ''}/`,
        `http://ereter.net/bmsplayerdata/${this.player.userId}/`,
        `http://ereter.net/bmsplayerdata/${this.player.userId}/dpoverjoy/songs/perlevel/`,
    ][this.type];

    const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');
    this.player.username = html.querySelector('.content > h3').innerText;
    const dataTable = Array.from(html.querySelectorAll('[data-sort^=table]')).pop();
    dataTable.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
        tbody.querySelectorAll('tr').forEach(row => {
            let fields = row.querySelectorAll('td');
            const key = this.type === TYPE.IIDX
                  ? (fields[1].innerText.replace(/ \([A-Z]+\)$/, '') + '\t' + fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1])
                  : fields[1].innerText;
            const offset = this.type === TYPE.IIDX ? 0 : 1;
            let ret = {
                rank: fields[4 + offset].children.length > 0
                    ? fields[4 + offset].querySelectorAll('span span span')[0].innerText
                    : '',
                percentage: fields[4 + offset].children.length > 0
                    ? parseFloat(fields[4 + offset].querySelectorAll('span span span')[1].innerText)
                    : 0,
                lamp: fields[5 + offset].innerText.toUpperCase().trim() || 'NO-PLAY',
            }
            if (this.type !== TYPE.IIDX)
                ret.bp = fields[6].innerText.trim() !== '' ? parseInt(fields[7].innerText) : -1;
            this.records.set(key, ret);
        });
    });
}
