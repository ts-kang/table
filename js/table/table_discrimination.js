import { DiffTable } from './table_base.js';

export function TableDiscrimination() {
    DiffTable.call(this);
}

TableDiscrimination.prototype = Object.create(DiffTable.prototype);
TableDiscrimination.prototype.constructor = TableDiscrimination;

TableDiscrimination.prototype.renderTable = async function(container) {
    await DiffTable.prototype.renderTable.call(this, container);

    this.groups.forEach(group => {
        if (group.discrimination) {
            group.domObj.style.marginTop = '0';
        }
    });
};
