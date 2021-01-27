import * as util from '../util.js';
import { DataSource } from './data_base.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'EASY', 'CLEAR', 'HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

export function DataLR2() {
    DataSource.call(this);
    this.options.playerFile = {
        value: undefined,
        render() {
            let input = document.createElement('input');
            input.type = 'file';
            input.addEventListener('change', () => this.value = input.files[0]);
            return input;
        },
    };
}

DataLR2.prototype = Object.create(DataSource.prototype);
DataLR2.prototype.constructor = DataLR2;

DataLR2.prototype.recordKey = song => song.md5;

DataLR2.prototype.parse = async function() {
    // don't parse all data for efficiency
};

DataLR2.prototype.apply = async function(table) {
    await util.loadLibrary('sqljs-wasm/sql-wasm.js');

    const SQL = await initSqlJs({
        locateFile: file => `js/lib/sqljs-wasm/${file}`,
    });

    const db = await new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new SQL.Database(new Uint8Array(reader.result)));
        reader.readAsArrayBuffer(this.options.playerFile.value);
    });

    db.each('select irid, id from player', row => {
        this.player.userId = row.irid;
        this.player.username = row.id; // is row.id same as row.name?
    });

    const stmt = db.prepare('select * from score where hash=:hash');

    table.groups.forEach(group => group.songs.forEach(song => {
        const record = stmt.getAsObject({':hash': song.md5.toLowerCase()});
        if (!record.clear)
            return;
        song.playerData = {
            lamp: LAMPS[record.clear],
            rank: RANKS[record.rank],
        };
    }));
};
