export function DataSource(table) {
    this.table = table;
    this.options = {};
}

DataSource.prototype = {
    renderOptions(container) {
        Object.values(this.options).forEach(option => {
            let div = document.createElement('div');
            div.className = 'option';
            div.appendChild(option.render());
            container.appendChild(div);
        });
    },

    async parse() {
        
    },
}
