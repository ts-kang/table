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

    recordKey(song) {},
    async parse() {},

    apply(table) {
        table.groups.forEach(group => group.songs.forEach(song => {
            const data = this.records.get(this.recordKey(song));
            if (data)
                song.playerData = data;
            else
                song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
        }));
    },
}
