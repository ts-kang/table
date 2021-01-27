import { TableBMSJson } from './table_bms_json.js';

export function TableDPOverjoy() {
    TableBMSJson.call(this, 'http://ereter.net/dpoverjoy/');
    this.dataSources.ereter = {
        display: 'ereter.net',
        instance: async () => await import('../data_source/data_ereter.js').then(m => new m.DataEreter(m.TYPE.OVERJOY, this.options)),
    };
}

TableDPOverjoy.prototype = Object.create(TableBMSJson.prototype);
TableDPOverjoy.prototype.constructor = TableDPOverjoy;

TableDPOverjoy.prototype.parse = async function() {
    await TableBMSJson.prototype.parse.call(this);

    this.groups.forEach(group => {
        if (group.name === 99)
            group.name = 'ω';
    });
};
