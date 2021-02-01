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
    this.db = undefined;
}

DataLR2.prototype = Object.create(DataSource.prototype);
DataLR2.prototype.constructor = DataLR2;

DataLR2.prototype.recordKey = song => song.md5;

DataLR2.prototype.parse = async function() {
    await util.loadLibrary('sqljs-wasm/sql-wasm.js');

    console.log('initialize sqljs');
    const SQL = await initSqlJs({
        locateFile: file => `js/lib/sqljs-wasm/${file}`,
    });

    console.log('read database');
    this.db = await new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new SQL.Database(new Uint8Array(reader.result)));
        reader.readAsArrayBuffer(this.options.playerFile.value);
    });

    console.log('get player information');
    this.db.each('select irid, id from player', row => {
        this.player.userId = row.irid;
        this.player.username = row.id; // is row.id same as row.name?
    });

    // don't parse all data for efficiency
};

DataLR2.prototype.apply = async function(table) {
    const stmt = this.db.prepare('select * from score where hash=:hash');

    console.log('get records');
    table.groups.forEach(group => group.songs.forEach(song => {
        const record = stmt.getAsObject({':hash': song.md5.toLowerCase()});
        if (record.clear === undefined)
            return;
        const score = record.perfect * 2 + record.great;
        const percentage = score / (record.totalnotes * 2.0) * 100.0;
        song.playerData = {
            lamp: LAMPS[record.clear],
            lamp_db: LAMPS[record.clear_db],
            lamp_sd: LAMPS[record.clear_sd],
            lamp_ex: LAMPS[record.clear_ex],
            rank: RANKS[record.rank],
            bp: record.minbp,
            score: score,
            percentage: percentage,
        };
    }));
};
