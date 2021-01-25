export function DataSource() {
    this.options = {};
    this.player = {};
    this.records = new Map();
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

    apply(table) {
        
    },
}
