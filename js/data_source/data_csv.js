import { DataSource } from './data_base.js';

export function DataCSV(table) {
    DataSource.call(this, table);
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
            input.style.width = '8rem';
            input.placeholder = 'Username';
            this.input = input;
            return input;
        },
    };
}

DataCSV.prototype = Object.create(DataSource.prototype);
DataCSV.prototype.constructor = DataSource;

DataCSV.prototype.parse = async function() {
    let Papa = import('../lib/papaparse.min.js').then(m => m.Papa);
    Papa.parse(this.options.csvFile.value, {
        header: true,
        step: row => {
            console.log(row.data);
        },
    });

    this.username = this.options.username.value;
};
