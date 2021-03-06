import { DiffTable } from './table_base.js';
import * as util from '../util.js';

export function TableBMSJson(url, displayName) {
    DiffTable.call(this);
    this.url = url;
    this.display = displayName;
    this.dataSources.lr2 = {
        display: 'LR2 Player Database',
        instance: async () => await import('../data_source/data_lr2.js').then(m => new m.DataLR2()),
    };
    if (!this.url) {
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
}

TableBMSJson.prototype = Object.create(DiffTable.prototype);
TableBMSJson.prototype.constructor = TableBMSJson;

TableBMSJson.prototype.parse = async function() {
    this.groups = [];

    const url = this.url || this.options.url.value;
    if (!url) {
        alert('input URL of BMS Table');
        throw new Error('no input');
    }

    let headerUrl = url;
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
            throw new Error('invalid url');
        headerUrl = new URL(bmstable.content, url).toString();
        tableHeader = await util.readPage(headerUrl).then(res => res.json());
    } else if (contentType.includes('application/json')) {
        tableHeader = await res.json();
    } else {
        throw new Error('invalid url');
    }

    if (!this.display)
        this.display = tableHeader.name;
    this.prefix = tableHeader.symbol;

    const songs = await util.readPage(new URL(tableHeader.data_url, headerUrl).toString())
          .then(res => res.json());

    const prefix = this.prefix;
    songs.forEach(song => {
        let group = this.groups.filter(group => group.level === song.level).shift();
        if (!group) {
            group = {
                level: song.level,
                get name() { return `${prefix}${this.level}`; },
                songs: [],
            };
            this.groups.push(group);
        }
        group.songs.push(song);
    });

    this.groups.sort((a, b) => {
        const [_a, _b] = [a, b].map(group => group.level >= 0 && group.level < 99 ? group.level : -1);
        return _b - _a;
    });

    this.cite = `from <a href="${url}" style="color: inherit">${url}</a>`;

    await this.data.parse();
    await this.data.apply(this);
};

TableBMSJson.prototype.renderTable = async function(container) {
    await DiffTable.prototype.renderTable.call(this, container);

    const h3 = Array.from(container.querySelectorAll('h3')).pop();
    if (h3 && this.data.player.userId) {
        let divId = document.createElement('div');
        divId.style = 'margin-top: 1rem; margin-bottom: -.8rem; font-weight: 300; font-size: 1rem; color: #999baa;';
        divId.innerText = this.data.player.userId;
        h3.after(divId);
    }
}
