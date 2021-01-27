import { DiffTable } from './table_base.js';
import * as util from '../util.js';

export function TableBMSJson() {
    DiffTable.call(this);
    this.dataSources.lr2 = {
        display: 'LR2 Player Data',
        instance: async () => await import('../data_source/data_lr2.js').then(m => new m.DataLR2()),
    };
    this.options.url = {
        display: 'BMSTable URL',
        input: undefined,
        get value() {
            if (this.input)
                return this.input.value;
            return '';
        },
        render() {
            let input = document.createElement('input');
            input.type = 'url';
            input.name = 'bmstable_url';
            input.style.width = '12rem';
            input.placeholder = 'URL';
            this.input = input;
            return input;
        },
    };
}

TableBMSJson.prototype = Object.create(DiffTable.prototype);
TableBMSJson.prototype.constructor = TableBMSJson;

TableBMSJson.prototype.parse = async function() {
    this.groups = [];

    const url = this.options.url.value;
    if (!url) {
        alert('input URL of BMS Table');
        throw new Error('no input');
    }

    let tableHeader;

    const res = await util.readPage(url);
    let contentType;
    for (const [k, v] of res.headers.entries()) {
        if (k.toLowerCase() === 'content-type')
            contentType = v;
    }
    if (!contentType)
        throw new Error('invalid url');

    if (contentType.includes('text/html')) {
        const html = new DOMParser().parseFromString(await res.text(), 'text/html');
        const bmstable = html.querySelector('meta[name=bmstable]');
        if (!bmstable)
            throw new Erorr('invalid url');
        tableHeader = await util.readPage(bmstable.content).then(res => res.json());
    } else if (contentType.includes('application/json')) {
        tableHeader = await res.json();
    } else {
        throw new Error('invalid url');
    }

    this.display = tableHeader.name;
    this.prefix = tableHeader.symbol;

    const songs = await util.readPage(tableHeader.data_url).then(res => res.json());

    let group;
    songs.forEach(song => {
        if (!group || group.name !== song.level) {
            group = {
                name: song.level,
                songs: [],
            };
            this.groups.push(group);
        }
        group.songs.push(song);
    });

    this.cite = `from ${this.options.url.value}`;

    await this.data.parse();
    await this.data.apply(this);
};
