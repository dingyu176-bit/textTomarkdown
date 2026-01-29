import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initI18n } from './i18n'
import { bitable, dashboard, DashboardState } from "@lark-base-open/js-sdk";
import { Spin } from "@douyinfe/semi-ui";


// @ts-ignore
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LoadApp />
  </React.StrictMode>
)

function LoadApp() {

  const [load, setLoad] = useState(false);

  useEffect(() => {
    bitable.bridge.getLanguage().then((lang) => {
      // @ts-ignore
      initI18n(lang);
      setLoad(true);
    }).catch((e) => {
      console.log('getLanguage error', e);
    });
  }, []);
  //   initI18n('zh');
  //   setLoad(true);
    if(!load)
      return <Spin size="large" />
    return <App />
}