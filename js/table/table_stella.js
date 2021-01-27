import { TableBMSJson } from './table_bms_json.js';

export function TableDPSatellite() {
    TableBMSJson.call(this, 'https://stellabms.xyz/dp/table.html');
}

TableDPSatellite.prototype = Object.create(TableBMSJson.prototype);
TableDPSatellite.prototype.constructor = TableDPSatellite;

TableDPSatellite.prototype.parse = async function() {
    await TableBMSJson.prototype.parse.call(this);

    this.display = 'DP Satellite';
};
