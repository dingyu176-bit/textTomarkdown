//@ts-nocheck

const t2 = {
  "customConfig": {
    "title": "项目启动日期",
    "color": "#1F2329",
    "dateType": "ref",
    "iconType": "preset",
    "presetIconIndex": 1,
    "customIcon": "",
    "dateInfo": {
      "tableId": "tblPzYhVEXGJ40qg",
      "fieldId": "fldioFZek7",
      "dateType": "earliest"
    },
    "target": 1756742400000,
    "format": "YYYY-MM-DD"
  },
  "dataConditions": [
    {
      "tableId": "tblPzYhVEXGJ40qg",
      "dataRange": {
        "type": "ALL"
      },
      "groups": [
        {
          "fieldId": "fldioFZek7"
        }
      ],
      "series": "COUNTA"
    }
  ]
}


const t10 = {
  "customConfig": {
    "title": "项目启动日期",
    "color": "#1F2329",
    "dateType": "ref",
    "iconType": "preset",
    "presetIconIndex": 1,
    "customIcon": "",
    "dateInfo": {
      "tableId": "tblncWZs8hBzG5HQ",
      "fieldId": "fldjRJBIf1",
      "dateType": "latest"
    },
    "target": 1756742400000,
    "format": "YYYY-MM-DD"
  },
  "dataConditions": [
    {
      "tableId": "tblncWZs8hBzG5HQ",
      "dataRange": {
        "type": "ALL"
      },
      "groups": [
        {
          "fieldId": "fldjRJBIf1"
        }
      ],
      "series": "COUNTA"
    }
  ]
}

async function saveData(t = 2) {
  if (t === 2) {
    await window._dashboard.saveConfig(t2);
  }
  if (t === 10) {
    await window._dashboard.saveConfig(t10);
  }
}

async function getData() {
  const config = await window._dashboard.getConfig();
  const data = await window._dashboard.getData();
  console.log('===getData', {
    config,
    data
  });
}
export {}