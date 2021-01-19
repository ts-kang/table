import * as parser from './parser.js';

export const list = {
    iidx: {
        ereterAnalytics: {
            display: 'ereter.net Analytics',
            selects: {
                level: {
                    display: 'Level',
                    options: {
                        12: '☆12',
                    },
                },
            },
            parse: parser.tables.iidxEreterAnalytics,
            playerData: {
                ereter: {
                    display: 'ereter\'s dp laboratory',
                    parse: parser.playerData.iidxEreterLevel,
                },
            },
        },
        snjkmzsRank: {
            display: 'SNJ@KMZS',
            selects: {
                level: {
                    display: 'Level',
                    options: {
                        1: '☆1',
                        2: '☆2',
                        3: '☆3',
                        4: '☆4',
                        5: '☆5',
                        6: '☆6',
                        7: '☆7',
                        8: '☆8',
                        9: '☆9',
                        10: '☆10',
                        11: '☆11',
                        12: '☆12',
                    },
                    selected: 12,
                },
            },
            parse: parser.tables.iidxSnjkmzsRank,
            playerData: {
                ereter: {
                    display: 'ereter\'s dp laboratory',
                    parse: parser.playerData.iidxEreterLevel,
                },
            },
        },
    },
    bms: {
        ereterInsaneAnalytics: {
            display: 'ereter.net Insane Analytics',
            parse: parser.tables.bmsEreterInsaneAnalytics,
            playerData: {
                ereter: {
                    display: 'ereter\'s dp laboratory',
                    parse: parser.playerData.bmsEreterInsane,
                },
            },
        },
    },
};
