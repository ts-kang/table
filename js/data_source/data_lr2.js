import * as util from '../util.js';
import { DataSource } from './data_base.js';

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
   
};
