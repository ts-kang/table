import * as tables from './difficulty_table.js';
import * as util from './util.js';

const DOM = {
    body: document.body,
    formOptions: document.getElementById('form_options'),
    selectTable: document.getElementById('select_table'),
    options: document.getElementById('options'),
    content: document.getElementById('content'),
    screenshot: document.getElementById('screenshot'),
};

var TABLES = {
    iidx_ereter_analytics: async () => await import('./table/table_ereter.js').then(m => new m.TableEreterIIDX()),
    iidx_snjkmzs_rank: async () => await import('./table/table_snjkmzs.js').then(m => new m.TableSnjkmzsRank()),
    bms_ereter_insane_analytics: async () => await import('./table/table_ereter.js').then(m => new m.TableEreterBMSInsane()),
    bms_dp_overjoy: async () => await import('./table/table_dp_overjoy.js').then(m => new m.TableDPOverjoy()),
    bms_dp_satellite: async () => await import('./table/table_bms_json.js').then(m => new m.TableBMSJson('https://stellabms.xyz/dp/table.html', 'DP Satellite')),
    bms_sp_satellite: async () => await import('./table/table_bms_json.js').then(m => new m.TableBMSJson('https://stellabms.xyz/sl/table.html', 'SP Satellite')),
    bms_sp_stella: async () => await import('./table/table_bms_json.js').then(m => new m.TableBMSJson('https://stellabms.xyz/st/table.html', 'SP Stella')),
    bms_sp_insane: async () => await import('./table/table_bms_json.js').then(m => new m.TableBMSJson('http://www.ribbit.xyz/bms/tables/insane.html', 'SP Insane BMS')),
    bms_custom: async () => await import('./table/table_bms_json.js').then(m => new m.TableBMSJson()),
};

['log', 'info', 'warn', 'error'].forEach(f => {
    let old = console[f];
    console[f] = (...data) => {
        old(...data);
        let pre = document.createElement('pre');
        pre.className = f;
        pre.innerText = data.join(' ');
        if (DOM.content.querySelectorAll(':not(pre)').length > 0)
            DOM.body.appendChild(pre);
        else
            DOM.content.appendChild(pre);
    };
});

const onerror = e => {
    let pre = document.createElement('pre');
    pre.className = 'error';
    pre.innerText = (e.error || e.reason);
    if (DOM.content.querySelectorAll(':not(pre)').length > 0)
        DOM.body.appendChild(pre);
    else
        DOM.content.appendChild(pre);
};

window.addEventListener('error', onerror);
window.addEventListener('unhandledrejection', onerror);

window.onload = async () => {
    DOM.selectTable.addEventListener('change', onSelectTable);
    onSelectTable();

    DOM.formOptions.addEventListener('submit', buildTable);
    DOM.screenshot.addEventListener('click', takeScreenshot);

    await util.loadLibrary('latinize.js');
};

async function onSelectTable() {
    let table = TABLES[DOM.selectTable.value];
    if(typeof table === 'function')
        table = TABLES[DOM.selectTable.value] = await table();
    
    DOM.options.innerHTML = '';
    table.renderOptions(DOM.options);
}

async function buildTable(e) {
    e.preventDefault();

    DOM.content.innerHTML = '';

    const table = TABLES[DOM.selectTable.value];
    //table.player.userId = DOM.inputId.value.replace(/[\D]/g, '');
    console.log('parsing...');
    await table.parse();
    console.log('render table');
    await table.renderTable(DOM.content);
    DOM.content.querySelectorAll('pre').forEach(pre => pre.remove());
}

async function takeScreenshot() {
    await util.loadLibrary('html2canvas.min.js');

    const download = document.querySelector('#download_screenshot');
    if (download)
        download.remove();
    window.scrollTo(0, 0);
    const canvas = await html2canvas(DOM.content, { backgroundColor: '#252830' });
    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
        let img = new Image();
        img.width = img.width || img.naturalWidth;
        img.height = img.height || img.naturalHeight;
        img.src = canvas.toDataURL('image/png');
        let newTab = window.open('');
        newTab.document.body.appendChild(img);
    } else {
        canvas.toBlob(blob => {
            let a = document.createElement('a');
            a.id = 'download_screenshot';
            a.style.display = 'block';
            a.innerText = 'Download Link';
            a.download = 'table_' + new Date().toISOString().replace(/^([\d-]+)[\w][\d:.]+[\w]$/, '$1') + '.png';
            a.href = URL.createObjectURL(blob);
            DOM.screenshot.after(a);
            a.click();
        }, 'image/png');
    }
}
